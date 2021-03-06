﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using FSS.Omnius.Modules.CORE;
using FSS.Omnius.Modules.Entitron.DB;
using Newtonsoft.Json.Linq;

namespace FSS.Omnius.Modules.Tapestry.Actions.Entitron
{
    enum RethinkDiffType
    {
        INSERT,
        UPDATE,
        DELETE
    }

    [EntitronRepository]
    public class ImportRethinkDiffAction : Action
    {
        public override int Id => 1099;

        public override string[] InputVar => new string[] { "v$Diff", "?s$TablesNames", "?s$ExtIdColumnName", "?s$DiffIdColumnName", "?s$IsDeletedColumnName" };

        public override string Name => "Import RethinkDB diff";

        public override string[] OutputVar => new string[] { "Result", "Error" };

        public override int? ReverseActionId => 1010;

        private DBConnection db;
        private DBTable table;
        private string extIdColumnName;
        private string diffIdColumnName;
        private string isDeletedColumnName;

        public override void InnerRun(Dictionary<string, object> vars, Dictionary<string, object> outputVars, Dictionary<string, object> InvertedInputVars, Message message)
        {
            COREobject core = COREobject.i;
            db = core.Entitron;

            object diffObject = vars["Diff"];
            string tableNames = vars.ContainsKey("TablesNames") ? (string)vars["TablesNames"] : "";
            extIdColumnName = vars.ContainsKey("ExtIdColumnName") ? (string)vars["ExtIdColumnName"] : "ext_id";
            diffIdColumnName = vars.ContainsKey("DiffIdColumnName") ? (string)vars["DiffIdColumnName"] : "id";
            isDeletedColumnName = vars.ContainsKey("IsDeletedColumnName") ? (string)vars["IsDeletedColumnName"] : "";

            if (diffObject == null)
                throw new Exception($"{Name}: Diff must not be null");

            if (!(diffObject is string) && !(diffObject is JToken))
                throw new Exception($"{Name}: Diff must be string or JToken");

            try {
                JToken diff = diffObject is JToken ? (JToken)diffObject : JToken.Parse((string)diffObject);
                List<string> tableNamesList = tableNames.Split(new char[] { ',', ';' }).ToList();

                string tableName = (string)diff["table"];
                if(string.IsNullOrEmpty(tableNames) || tableNamesList.Contains(tableName)) // Zjistíme, jestli synchronizujeme všechny tabulky, nebo jen vybrané
                {
                    table = db.Table(tableName);
                    if (table == null)
                        throw new Exception($"{Name}: table {tableName} was not found");

                    RethinkDiffType changeType = GetDiffType(diff["old_val"], diff["new_val"]); // Zjistíme typ změny
                    switch (changeType) {
                        case RethinkDiffType.INSERT:
                            Insert(diff["new_val"]);
                            break;
                        case RethinkDiffType.UPDATE:
                            Update(diff["old_val"], diff["new_val"]);
                            break;
                        case RethinkDiffType.DELETE:
                            Delete(diff["old_val"]);
                            break;
                    }

                    try {
                        db.SaveChanges();
                        outputVars["Result"] = 1;
                        outputVars["Error"] = "";
                    }
                    catch(Exception e) {
                        outputVars["Result"] = 0;
                        outputVars["Error"] = e.Message;
                    }
                }
                else // Pokud synchronizujeme jen vybrané tabulky a tato v nich není, vracíme -1 = ignorovaná tabulka
                {
                    outputVars["Result"] = -1;
                    outputVars["Error"] = "";
                }
            }
            catch (Exception e) {
                throw new Exception($"{Name}: Fatal error occured ({e.Message})");
            }
        }

        private RethinkDiffType GetDiffType(JToken oldValue, JToken newValue)
        {
            if     (oldValue.Type == JTokenType.Null   && newValue.Type == JTokenType.Object) { return RethinkDiffType.INSERT; }
            else if(oldValue.Type == JTokenType.Object && newValue.Type == JTokenType.Null)   { return RethinkDiffType.DELETE; }
            else                                                                              { return RethinkDiffType.UPDATE; }
        }

        private void SetDBItemValues(ref DBItem item, IEnumerable<DBColumn> columns, JToken values)
        {
            Dictionary<string, object> parsedValues = new Dictionary<string, object>();
            TapestryUtils.ParseJObjectRecursively((JObject)values, parsedValues);

            foreach (DBColumn column in columns) 
            {
                if (column.Name == DBCommandSet.PrimaryKey) {
                    continue;
                }

                if (parsedValues[column.Name] != null) {
                    item[column.Name] = parsedValues[column.Name];
                }
                if (column.Name == extIdColumnName) {
                    item[column.Name] = parsedValues[diffIdColumnName];
                }
            }
        }

        private void Insert(JToken newValue)
        {
            var item = new DBItem(db, table);
            SetDBItemValues(ref item, table.Columns, newValue);
            table.Add(item);
        }

        private void Update(JToken oldValue, JToken newValue)
        {
            var id = (string)oldValue[diffIdColumnName];
            var item = table.Select().Where(t => t.Column(extIdColumnName).Equal(id)).SingleOrDefault();

            if(item != null) {
                SetDBItemValues(ref item, table.Columns, newValue);
                table.Update(item, (int)item[DBCommandSet.PrimaryKey]);
            }
            else { // Nekonzistentní data, ale asi ho můžeme v klidu vložit
                Insert(newValue);
            }
        }

        private void Delete(JToken oldValue)
        {
            var id = (string)oldValue[diffIdColumnName];
            var item = table.Select().Where(t => t.Column(extIdColumnName).Equal(id)).SingleOrDefault();

            if(item != null) {
                if (isDeletedColumnName != "") {
                    item[isDeletedColumnName] = true;
                    table.Update(item, (int)item[DBCommandSet.PrimaryKey]);
                }
                else {
                    table.Delete(item);
                }
            }
        }
    }
}
