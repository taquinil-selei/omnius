﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FSS.Omnius.Modules.Entitron.Sql
{
    class SqlQuery_Exec : SqlQuery_withoutApp
    {
        protected override void BaseExecution(MarshalByRefObject transaction)
        {
           sqlString =
                $"EXEC ";

                //string.Format(
                //"DECLARE @realTableName NVARCHAR(100),@sql NVARCHAR(MAX);exec getTableRealName @{0}, @{1}, @realTableName OUTPUT;" +
                //"SET @sql= CONCAT('UPDATE ', @realTableName, ' SET {2} WHERE Id = {3};')" +
                //"exec sp_executesql @sql, N'{4}', {5};",
                //parAppName, parTableName,
                //string.Join(", ", parChanges.Select(pair => "[" + pair.Key.Name + "]= @" + pair.Value)),
                //recordId,
                //string.Join(", ", _datatypes.Select(s=>"@" + s.Key +" " + s.Value )),
                //string.Join(", ", _datatypes.Select(s=>"@" + s.Key))
                //);

            base.BaseExecution(transaction);
        }

        public override string ToString()
        {
            return string.Format("Update row in {0}[{1}]", table.tableName, application.Name);
        }
    }
}
