﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DynamicDB.Sql
{
    class SqlQuery_UniqueDrop:SqlQuery_withApp
    {
        string tableName { get; set; }

        public SqlQuery_UniqueDrop(string applicationName) : base(applicationName)
        {
        }

        protected override void BaseExecution(MarshalByRefObject transaction)
        {
            string parAppName = safeAddParam("applicationName", _applicationName);
            string parTableName = safeAddParam("tableName", tableName);

            _sqlString = string.Format(
                "DECLARE @realTableName NVARCHAR(50), @sql NVARCHAR(MAX); exec getRealTableName@{0},@{1}, @realTableName OUTPUT;" +
                "SET @sql=CONCAT('ALTER TABLE ', @realTableName, 'DROP CONSTRAINT UN_', @realTableName, ';')" +
                "exec(@sql)",
                parAppName, parTableName);

            base.BaseExecution(transaction);
        }
    }
}
