﻿using System;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using FSS.Omnius.Modules.CORE;
using FSS.Omnius.Modules.Entitron;
using FSS.Omnius.Modules.Entitron.DB;
using System.Data;

namespace FSS.Omnius.Modules.Tapestry.Actions.Entitron
{
    [EntitronRepository]
    public class JSON2DbItemListAction : Action
    {
        public override int Id => 1047;

        public override int? ReverseActionId => null;

        public override string[] InputVar => new string[] { "TableName", "BaseName", "Data", "?ItemName", "?SearchInShared" };

        public override string Name => "JSON to DbItem list";

        public override string[] OutputVar => new string[] { "Result" };

        public override void InnerRun(Dictionary<string, object> vars, Dictionary<string, object> outputVars, Dictionary<string, object> invertedVars, Message message)
        {
            // init
            DBConnection db = COREobject.i.Entitron;

            bool searchInShared = vars.ContainsKey("SearchInShared") ? (bool)vars["SearchInShared"] : false;

            if (!vars.ContainsKey("TableName")) {
                throw new Exception("Tapestry action JSON 2 DBItemList: TableName is required");
            }
            if(!vars.ContainsKey("BaseName")) {
                throw new Exception("Tapestry action JSON 2 DBItemList: BaseName is required");
            }
            if(!vars.ContainsKey("Data")) {
                throw new Exception("Tapestry action JSON 2 DBItemList: Data is required");
            }

            JToken data = (JToken)vars["Data"];
            string tableName = (string)vars["TableName"];
            string baseName = (string)vars["BaseName"];
            string itemName = vars.ContainsKey("ItemName") ? (string)vars["ItemName"] : "item";

            /****************************************************************************************
            ** MOCKUP DATA                                                                         **
            *****************************************************************************************
            string jsonText;
            try {
                XmlDocument xml = new XmlDocument();
                xml.Load("c:/users/mnvk8/Downloads/response.xml");
                jsonText = JsonConvert.SerializeXmlNode(xml);
            }
            catch (Exception e) {
                if (e is ArgumentNullException || e is XmlException) {
                    jsonText = "";// JsonConvert.SerializeObject(response);
                }
                else {
                    throw e;
                }
            }
            JToken data = JToken.Parse(jsonText);
            ****************************************************************************************/

            DBTable table = db.Table(tableName, searchInShared);

            Dictionary<string, DBColumn> columnExists = new Dictionary<string, DBColumn>();
            Dictionary<string, DbType> columnType = new Dictionary<string, DbType>();

            var items = data.SelectToken($"$..{baseName}.{itemName}");
            foreach (JToken item in items) {
                DBItem entity = new DBItem(db, table);
                foreach (JProperty pair in item) 
                {
                    // Zjistíme, jestli ten slupec v tabulce vůbec existuje
                    string columnName = pair.Name.ToLowerInvariant();
                    if(!columnExists.ContainsKey(columnName)) {
                        DBColumn column = table.Columns.Where(c => c.Name.ToLowerInvariant() == columnName).FirstOrDefault();

                        columnExists.Add(columnName, column);
                        if(column != null) {
                            columnType.Add(columnName, column.Type);
                        }
                    }

                    if(columnExists[columnName] != null) {
                        var columnInfo = columnExists[columnName];
                        entity[columnInfo.Name] = DataType.ConvertTo(columnType[columnName], pair);
                    }
                }
                table.Add(entity);
            }

            db.SaveChanges();

            // return
            outputVars["Result"] = true;
        }
    }
}
