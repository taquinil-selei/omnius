﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FSS.Omnius.Modules.Entitron;
using FSS.Omnius.Modules.Entitron.Entity.CORE;
using FSS.Omnius.Modules.Entitron.Entity.Tapestry;
using FSS.Omnius.Modules.Tapestry;
using System.Collections.Specialized;
using FSS.Omnius.Modules.Entitron.Entity.Mozaic;
using FSS.Omnius.Modules.Entitron.Entity.Master;
using FSS.Omnius.Modules.CORE;
using FSS.Omnius.Modules.Entitron.Entity.Persona;
using FSS.Omnius.Modules.Entitron.Entity;
using System.Data;
using Newtonsoft.Json.Linq;

namespace FSS.Omnius.Modules.Tapestry
{
    public class Tapestry : RunableModule
    {
        private CORE.CORE _CORE;
        private ActionResult _results;

        public Tapestry(CORE.CORE core)
        {
            Name = "Tapestry";

            _CORE = core;
            _results = new ActionResult();
        }
        
        public Tuple<Message, Block> run(User user, Block block, string buttonId, int modelId, NameValueCollection fc)
        {
            Tuple<ActionResult, Block> result = innerRun(user, block, buttonId, modelId, fc);
            return new Tuple<Message, Block>(result.Item1.Message, result.Item2);
        }
        public JToken jsonRun(User user, Block block, string buttonId, int modelId, NameValueCollection fc)
        {
            Tuple<ActionResult, Block> result = innerRun(user, block, buttonId, modelId, fc);
            JObject output = new JObject();
            foreach(KeyValuePair<string, object> pair in result.Item1.OutputData.Where(d => d.Key.StartsWith("__Result[")))
            {
                int startIndex = pair.Key.IndexOf('[') + 1;
                string key = pair.Key.Substring(startIndex, pair.Key.IndexOf(']', startIndex) - startIndex);
                output.Add(key, pair.Value != null ? (pair.Value as IToJson).ToJson() : null);
            }
            return output;
        }
        private Tuple<ActionResult, Block> innerRun(User user, Block block, string buttonId, int modelId, NameValueCollection fc)
        {
            // __CORE__
            // __Result[uicName]__
            // __Model__
            // __ModelId__
            // __Model.{TableName}.{columnName}
            // __TableName__

            // init action
            fc = fc ?? new NameValueCollection();
            _CORE.User = user;
            _results.OutputData.Add("__CORE__", _CORE);
            if (!string.IsNullOrWhiteSpace(block.ModelName))
                _results.OutputData.Add("__TableName__", block.ModelName);
            if (modelId >= 0)
                _results.OutputData.Add("__ModelId__", modelId);

            // get actionRule
            ActionRule actionRule = null;
            ActionRule nextRule;
            try
            { nextRule = GetActionRule(block, buttonId, _results, modelId); }
            catch (MissingMethodException)
            {
                _results.Message.Warnings.Add("Zadaný příkaz nenalezen");
                return new Tuple<ActionResult, Block>(_results, block);
            }

            // get inputs
            string[] keys = fc.AllKeys;
            foreach (string key in keys)
            {
                _results.OutputData.Add(key, fc[key]);
            }

            // map inputs
            foreach (ResourceMappingPair pair in block.ResourceMappingPairs)
            {
                TapestryDesignerResourceItem source = pair.Sources.Count > 0 ? pair.Sources[0] : new TapestryDesignerResourceItem();
                TapestryDesignerResourceItem target = pair.Target;

                if (source.TypeClass == "uiItem" && target.TypeClass == "attributeItem")
                {
                    if (fc.AllKeys.Contains(source.ComponentName))
                        _results.OutputData.Add($"__Model.{target.TableName}.{target.ColumnName}", fc[source.ComponentName]);
                    for (int panelIndex = 1; fc.AllKeys.Contains($"panelCopy{panelIndex}Marker"); panelIndex++)
                    {
                        if (fc.AllKeys.Contains(source.ComponentName))
                        {
                            _results.OutputData.Add($"__Model.panelCopy{panelIndex}.{target.TableName}.{target.ColumnName}",
                                fc[$"panelCopy{panelIndex}_" + source.ComponentName]);
                        }
                    }
                }
            }

            List<ActionRule> prevActionRules = new List<ActionRule>();
            // run all auto Action
            while (nextRule != null)
            {
                actionRule = nextRule;
                prevActionRules.Add(nextRule);
                actionRule.Run(_results);

                if (_results.Type == ActionResultType.Error)
                {
                    return new Tuple<ActionResult, Block>(_results, Rollback(prevActionRules).SourceBlock);
                }

                nextRule = GetAutoActionRule(actionRule.TargetBlock, _results);
            }

            Block resultBlock = actionRule.TargetBlock;
            // if stops on virtual block
            if (actionRule.TargetBlock.IsVirtual)
            {
                actionRule = Rollback(prevActionRules);
                resultBlock = actionRule.SourceBlock;
            }

            // target Block
            return new Tuple<ActionResult, Block>(_results, resultBlock);
        }

        public ActionRule Rollback(List<ActionRule> prevActionRules)
        {
            prevActionRules.Reverse();
            foreach (ActionRule actRule in prevActionRules)
            {
                actRule.ReverseRun(_results);
            }
            return prevActionRules.Last();
        }

        private ActionRule GetActionRule(Block block, string buttonId, ActionResult results, int modelId)
        {
            ActionRule rule = block.SourceTo_ActionRules.SingleOrDefault(ar => ar.ExecutedBy == buttonId);
            if (rule == null)
                throw new MissingMethodException($"Block [{block.Name}] with Executor[{buttonId}] cannot be found");

            if (false && !_CORE.User.canUseAction(rule.Id, _CORE.Entitron.GetStaticTables()))
                throw new UnauthorizedAccessException(string.Format("User cannot execute action rule[{0}]", rule.Id));
            
            results.OutputData["__MODEL__"] = _CORE.Entitron.GetDynamicItem(rule.SourceBlock.ModelName, modelId);

            rule.PreRun(results);
            if (false && !rule.CanRun(results.OutputData))
                throw new UnauthorizedAccessException(string.Format("Cannot pass conditions: rule[{0}]", rule.Id));

            return rule;
        }
        private ActionRule GetAutoActionRule(Block block, ActionResult results, int? modelId = null)
        {
            var actionRules = block.SourceTo_ActionRules.Where(ar => ar.Actor.Name == "Auto").ToList();
            var authorizedActionRules = actionRules.Where(ar => _CORE.User.canUseAction(ar.Id, _CORE.Entitron.GetStaticTables())).ToList();

            // not authorized
            if (actionRules.Count > 0 && authorizedActionRules.Count == 0)
            {
                results.Message.Errors.Add("You are not authorized");
                return null;
            }

            foreach (ActionRule ar in authorizedActionRules)
            {
                if (modelId != null)
                    results.OutputData["__MODEL__"] = _CORE.Entitron.GetDynamicItem(block.ModelName, modelId.Value);

                ar.PreRun(results);
                if (ar.CanRun(results.OutputData))
                    return ar;
            }

            // nothing that meets the conditions
            return null;
        }
    }
}
