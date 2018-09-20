﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FSS.Omnius.Modules.Entitron.Sql
{
    public class SqlQuery_Column_Check_Drop : SqlQuery_withAppTable
    {
        public string realCheckName { get; set; }
        public string checkName
        {
            get
            {
                return string.Join("_", realCheckName.Split('_').Skip(3));
            }
            set
            {
                realCheckName = $"CHK_{application.Name}_{table.Name}_{value}";
            }
        }

        protected override string CreateString()
        {
            if (string.IsNullOrWhiteSpace(realCheckName))
                checkName = $"CHK_{application.Name}_{table.Name}_1";

            return
                $"ALTER TABLE [{realTableName}] DROP CONSTRAINT [{realCheckName}]";
        }

        public override string ToString()
        {
            return $"[{application.Name}:{table.Name}] Drop check[{checkName}]";
        }
    }
}
