﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Entitron.Sql;

namespace Entitron
{
    public class DBColumns : List<DBColumn>
    {
        public DBTable table { get { return _table; } }
        private DBTable _table { get; set; }

        public DBColumns(DBTable table)
        {
            _table = table;

            // if table exists - get columns
            if (_table.isInDB())
            {
                SqlQuery_Select_ColumnList query = new SqlQuery_Select_ColumnList() { application = table.Application, table = table };

                foreach (DBItem i in query.ExecuteWithRead())
                {
                    DBColumn column = new DBColumn()
                    {
                        Name = (string)i["name"],
                        type = (string)i["typeName"],
                        maxLength = Convert.ToInt32((Int16)i["max_length"]),
                        precision = Convert.ToInt32((Int16)i["precision"]),
                        scale = Convert.ToInt32((Int16)i["scale"]),
                        canBeNull = (bool)i["is_nullable"]
                    };
                    Add(column);
                }
            }
        }

        public DBTable AddToDB(DBColumn column)
        {
            SqlQuery_Table_Create query = table.Application.queries.GetQuery<SqlQuery_Table_Create>(table.tableName);
            if (query != null)
                query.AddColumn(column);
            else
                table.Application.queries.Add(new SqlQuery_Column_Add()
                {
                    application = table.Application,
                    table = table,
                    column = column
                });

            Add(column);

            return _table;
        }
        public DBTable AddToDB(
            string columnName,
            string type,
            bool allowColumnLength,
            bool allowPrecisionScale,
            int? maxLength = null,
            int? precision = null,
            int? scale = null,
            bool canBeNull = true,
            bool isUnique = false,
            string additionalOptions = null)
        {
            return AddToDB(new DBColumn()
            {
                Name = columnName,
                type = type,
                maxLength = maxLength,
                precision = precision,
                scale = scale,
                canBeNull = canBeNull,
                isUnique = isUnique,
                additionalOptions = additionalOptions
            });
        }
        public DBTable AddRangeToDB(DBColumns columns)
        {
            foreach (DBColumn column in columns)
            {
                Add(column);
            }

            return _table;
        }

        public DBTable RenameInDB(string originColumnName, string newColumnName)
        {
            table.Application.queries.Add(new SqlQuery_Column_Rename()
            {
                application = table.Application,
                table = table,
                originColumnName = originColumnName,
                newColumnName = newColumnName
            });

            this.SingleOrDefault(c => c.Name == originColumnName).Name = newColumnName;
            return _table;
        }

        public DBTable ModifyInDB(DBColumn column)
        {
            new SqlQuery_Column_Modify()
            {
                application = table.Application,
                table = table,
                column = column
            };

            this[this.IndexOf(c => c.Name == column.Name)] = column;
            return _table;
        }
        public DBTable ModifyInDB(
            string columnName,
            string type,
            bool allowColumnLength,
            bool allowPrecisionScale,
            int? maxLength = null,
            int? precision = null,
            int? scale = null,
            bool canBeNull = true,
            bool isUnique = false,
            string additionalOptions = null)
        {
            return ModifyInDB(new DBColumn()
            {
                Name = columnName,
                type = type,
                maxLength = maxLength,
                precision = precision,
                scale = scale,
                canBeNull = canBeNull,
                isUnique = isUnique,
                additionalOptions = additionalOptions
            });
        }

        public DBTable DropFromDB(string columnName)
        {
            table.Application.queries.Add(new SqlQuery_Column_Drop()
            {
                application = table.Application,
                table = table,
                columnName = columnName
            });

            Remove(this.SingleOrDefault(c => c.Name == columnName));
            return _table;
        }

        public static List<string> getMaxLenghtDataTypes()
        {
            List<string> maxLenghtDataType = new List<string>();
            SqlQuery_SelectStringsTypes query = new SqlQuery_SelectStringsTypes();

            foreach (DBItem s in query.ExecuteWithRead())
            {
                maxLenghtDataType.Add(s["name"].ToString());
            }
            return maxLenghtDataType;
        }
    }
}
