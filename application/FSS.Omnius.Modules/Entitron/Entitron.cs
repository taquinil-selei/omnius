﻿using System;
using System.Collections.Generic;
using System.Linq;

namespace FSS.Omnius.Modules.Entitron
{
    using Entity;
    using CORE;
    using Entity.Master;
    using Service;
    using Table;

    public class Entitron : IModule
    {
        public const string connectionString = "data source=vo8qh1qcem.database.windows.net;initial catalog=Omnius;user id=binu@vo8qh1qcem;password=Domaybietd90;MultipleActiveResultSets=True;App=EntityFramework;Min Pool Size=3;Load Balance Timeout=180;";
        private CORE _CORE;
        private DBEntities entities = null;

        public Application Application { get; set; }
        public string AppName
        {
            get { return (Application != null) ? Application.Name : null; }
            set
            {
                Application = GetStaticTables().Applications.SingleOrDefault(a => a.Name == value);
            }
        }
        public int AppId
        {
            get { return Application.Id; }
            set
            {
                Application = GetStaticTables().Applications.SingleOrDefault(a => a.Id == value);
            }
        }
        public IConditionalFilteringService filteringService { get; set; }

        public Entitron(CORE core, string ApplicationName = null)
        {
            _CORE = core;
            AppName = ApplicationName;
            filteringService = new ConditionalFilteringService();
        }

        public DBEntities GetStaticTables()
        {
            if (entities == null)
                entities = new DBEntities();

            return entities;
        }

        public IEnumerable<DBTable> GetDynamicTables()
        {
            if (Application == null)
                throw new ArgumentNullException("Application");

            return Application.GetTables();
        }

        public DBTable GetDynamicTable(string tableName)
        {
            if (Application == null)
                throw new ArgumentNullException("Application");

            return Application.GetTable(tableName);
        }

        public DBView GetDynamicView(string viewName)
        {
            if (Application == null)
                throw new ArgumentNullException("Application");

            return Application.GetView(viewName);
        }

        public DBItem GetDynamicItem(string tableName, int modelId)
        {
            if (string.IsNullOrWhiteSpace(tableName) || modelId < 0)
                return null;

            return Application.GetTable(tableName).Select().where(c => c.column("Id").Equal(modelId)).ToList().FirstOrDefault();
        }
    }
}
