﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Entitron.Sql;

namespace Entitron
{
    public class DBColumns : List<DBColumn>
    {
        public DBTable table { get { return _table; }  }
        private DBTable _table { get; set; }

        public DBColumns(DBTable table)
        {
            _table = table;

            SqlQuery_Select_ColumnList query = new SqlQuery_Select_ColumnList() { applicationName = table.AppName, tableName = table.tableName };
            
            foreach(DBItem i in query.ExecuteWithRead())
            {
                DBColumn column = new DBColumn()
                {
                    Name = (string)i["name"],
                    type = (string)i["typeName"],
                    maxLength = Convert.ToInt32((Int16)i["max_length"]),
                    canBeNull = (bool)i["is_nullable"]
                };
                Add(column);
            }
        }

        public DBTable AddToDB(DBColumn column)
        {
            SqlQuery_Table_Create query;
            if ((query = DBTable.queries.GetCreate(table.tableName)) != null)
                query.AddColumn(column);
            else
                DBTable.queries.Add(new SqlQuery_Column_Add()
                {
                    applicationName = table.AppName,
                    tableName = table.tableName,
                    column = column
                });

            this.Add(column);

            return _table;
        }
        public DBTable AddToDB(
            string columnName,
            string type,
            bool allowColumnLength,
            int? maxLength = null,
            bool canBeNull = true,
            bool isPrimaryKey = false,
            bool isUnique = false,
            string additionalOptions = null)
        {
            return AddToDB(new DBColumn()
            {
                Name = columnName,
                type = type,
                maxLength = maxLength,
                canBeNull = canBeNull,
                isPrimaryKey = isPrimaryKey,
                isUnique = isUnique,
                additionalOptions = additionalOptions
            });
        }
        public DBTable AddRangeToDB(DBColumns columns)
        {
            foreach(DBColumn column in columns)
            {
                Add(column);
            }

            return _table;
        }

        public DBTable RenameInDB(string originColumnName, string newColumnName)
        {
            DBTable.queries.Add(new SqlQuery_Column_Rename()
            {
                applicationName = table.AppName,
                tableName = table.tableName,
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
                applicationName = table.AppName,
                tableName = table.tableName,
                column = column
            };
            
            this[this.IndexOf(c => c.Name == column.Name)] = column;
            return _table;
        }
        public DBTable ModifyInDB(
            string columnName,
            string type,
            bool allowColumnLength,
            int? maxLength = null,
            bool canBeNull = true,
            bool isPrimaryKey = false,
            bool isUnique = false,
            string additionalOptions = null)
        {
            return ModifyInDB(new DBColumn()
            {
                Name = columnName,
                type = type,
                maxLength = maxLength,
                canBeNull = canBeNull,
                isPrimaryKey = isPrimaryKey,
                isUnique = isUnique,
                additionalOptions = additionalOptions
            });
        }

        public DBTable DropFromDB(string columnName)
        {
            DBTable.queries.Add(new SqlQuery_Column_Drop()
            {
                applicationName = table.AppName,
                tableName = table.tableName,
                columnName = columnName
            });

            Remove(this.SingleOrDefault(c => c.Name == columnName));
            return _table;
        }
    }
}
