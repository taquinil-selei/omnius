﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FSS.Omnius.Modules.Entitron;
using FSS.Omnius.Modules.Entitron.Entity;
using FSS.Omnius.Modules.Tapestry;

namespace FSS.Omnius.Modules.Entitron.Entity.Mozaic
{
    public partial class Page
    {
        //public string Render(ActionResultCollection results, DBEntities entity)
        //{
        //    return entity.Templates.FirstOrDefault(t => t.Id == MasterTemplateId)
        //        .Render(this, parseKeyValueString(Relations), results, entity);
        //}
        private Dictionary<string, string> parseKeyValueString(string value, char relationSeparator = ';', char keyValueSeparator = '=')
        {
            Dictionary<string, string> output = new Dictionary<string, string>();
            foreach (string pair in value.Split(relationSeparator))
            {
                int index = pair.IndexOf(keyValueSeparator);
                if (index != -1)
                    output.Add(
                        pair.Substring(0, index),
                        pair.Substring(index + 1)
                    );
            }

            return output;
        }
    }
}
