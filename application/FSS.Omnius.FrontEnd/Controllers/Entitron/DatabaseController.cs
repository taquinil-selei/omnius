﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Management.Instrumentation;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using FSS.Omnius.Modules.Entitron.DAL;
using FSS.Omnius.Modules.Entitron.Entity.Entitron;
using FSS.Omnius.Modules.Entitron.Entity.Tapestry;
using FSS.Omnius.Modules.Entitron.Entity;
using FSS.Omnius.Modules.Entitron.Service;
using Logger;
using static System.String;
using FSS.Omnius.Modules.Entitron;
using System.Data.SqlClient;
using FSS.Omnius.Modules.Entitron.Entity.Master;
using FSS.Omnius.Modules.Entitron.DB;
using Newtonsoft.Json.Linq;
using FSS.Omnius.Modules.CORE;

namespace FSS.Omnius.Controllers.Entitron
{
    [System.Web.Mvc.PersonaAuthorize(NeedsAdmin = true, Module = "Entitron")]
    public class DatabaseController : ApiController
    {
        /*public DatabaseController(IRepository<DbSchemeCommit> repositoryDbSchemeCommit,
            IDatabaseGenerateService databaseGenerateService)
        {
            if (repositoryDbSchemeCommit == null) throw new ArgumentNullException(nameof(repositoryDbSchemeCommit));
            if (databaseGenerateService == null) throw new ArgumentNullException(nameof(databaseGenerateService));
            RepositoryDbSchemeCommit = repositoryDbSchemeCommit;
            DatabaseGenerateService = databaseGenerateService;
        }*/

        public DatabaseController()
        {

        }

        private IRepository<DbSchemeCommit> RepositoryDbSchemeCommit { get; }
        private IDatabaseGenerateService DatabaseGenerateService { get; set; }


        [Route("api/database/apps/{appId}/commits")]
        [HttpGet]
        public IEnumerable<AjaxTransferCommitHeader> GetCommitList(int appId)
        {
            try
            {
                var context = COREobject.i.Context;

                var result = new List<AjaxTransferCommitHeader>();
                var requestedApp = context.Applications.Find(appId);
                foreach (var commit in requestedApp.DatabaseDesignerSchemeCommits.OrderByDescending(o => o.Timestamp))
                {
                    result.Add(new AjaxTransferCommitHeader
                    {
                        Id = commit.Id,
                        CommitMessage = commit.CommitMessage,
                        TimeCommit = commit.Timestamp
                    });
                }
                return result;
            }
            catch (Exception ex)
            {
                var errorMessage = $"DatabaseDesigner: error when loading the commit history (GET api/database/apps/{appId}/commits). Exception message: {ex.Message}";
                throw GetHttpInternalServerErrorResponseException(errorMessage);

            }
        }



        [Route("api/database/apps/{appId}/commits/{commitId}")]
        [HttpGet]
        public AjaxTransferDbScheme GetCommitById(int appId, int commitId)
        {
            try
            {
                return GetCommit(appId, commitId);
            }
            catch (InstanceNotFoundException ex)
            {
                throw GetHttpInternalServerErrorResponseException(ex.Message);

            }
            catch (Exception ex)
            {
                var errorMessage = Format($"DatabaseDesigner: error when loading the commit with id={commitId} (GET api/database/apps/{appId}/commits/{commitId}). "
                    + $"Exception message: {ex.Message}");
                throw GetHttpInternalServerErrorResponseException(errorMessage);

            }
        }

        [Route("api/database/apps/{appId}/getLastCommitId")]
        [HttpGet]
        public int getLastCommitId(int appId)
        {
            var context = COREobject.i.Context;
            var app = context.Applications.Find(appId);
            int lastCommitId = context.Applications.Find(appId).DatabaseDesignerSchemeCommits.OrderByDescending(s => s.Timestamp).FirstOrDefault().Id;

            return lastCommitId;
        }


        [Route("api/database/apps/{appId}/isSchemeLocked/{userId}/{CurrentSchemeCommitId}")]
        [HttpGet]
        public AjaxSchemeLockingStatus isSchemeLocked(int appId, int userId, int CurrentSchemeCommitId)
        {
            var context = COREobject.i.Context;
            var result = new AjaxSchemeLockingStatus();
            var app = context.Applications.Find(appId);
            int? lastCommitId = -1;
            if (CurrentSchemeCommitId != -1)
                lastCommitId = context.Applications.Find(appId).DatabaseDesignerSchemeCommits.OrderByDescending(s => s.Timestamp).FirstOrDefault().Id;
            var lockedForUserId = context.Applications.Find(appId).SchemeLockedForUserId;
            if (lockedForUserId != null && userId != lockedForUserId)//if scheme is locked 
            {
                string lockForUserName = context.Users.FirstOrDefault(u => u.Id == app.SchemeLockedForUserId).DisplayName;
                return new AjaxSchemeLockingStatus() { lockStatusId = 1, lockedForUserName = lockForUserName };
            }
            else if (lockedForUserId != null && lockedForUserId == userId)
            { //if scheme is locked for me
                if (lastCommitId == null || (lastCommitId != null && lastCommitId == CurrentSchemeCommitId))
                {
                    return new AjaxSchemeLockingStatus() { lockStatusId = 2, lockedForUserName = "" };

                }
                else
                {
                    return new AjaxSchemeLockingStatus() { lockStatusId = 3, lockedForUserName = "" };
                }
            }
            else //if its not locked
                return new AjaxSchemeLockingStatus() { lockStatusId = 0, lockedForUserName = "" };
        }


        [Route("api/database/apps/{appId}/LockScheme/{userId}/")]
        [HttpGet]
        public bool LockScheme(int appId, int userId)
        {
            try
            {
                var context = COREobject.i.Context;
                var app = context.Applications.Find(appId);
                app.SchemeLockedForUserId = userId;
                context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                var errorMessage = $"DatabaseDesigner: error when locking the latest commit (GET api/database/apps/{appId}/commits/latest). " +
                $"Exception message: {ex.Message}";
                throw GetHttpInternalServerErrorResponseException(errorMessage);
            }
        }
        [Route("api/database/apps/{appId}/UnlockScheme/{userId}/")]
        [HttpGet]
        public bool UnlockScheme(int appId, int userId)
        {
            try
            {
                var context = COREobject.i.Context;
                var app = context.Applications.Find(appId);
                app.SchemeLockedForUserId = null;
                context.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {
                var errorMessage = $"DatabaseDesigner: error when unlocking the latest commit (GET api/database/apps/{appId}/commits/latest). " +
                $"Exception message: {ex.Message}";
                throw GetHttpInternalServerErrorResponseException(errorMessage);
            }
        }
        [Route("api/database/apps/{appId}/commits/latest")]
        [HttpGet]
        public AjaxTransferDbScheme LoadLatest(int appId)
        {
            try
            {
                return GetCommit(appId);
            }
            catch (InstanceNotFoundException ex)
            {
                throw GetHttpInternalServerErrorResponseException(ex.Message);
            }
            catch (Exception ex)
            {
                var errorMessage = $"DatabaseDesigner: error when loading the latest commit (GET api/database/apps/{appId}/commits/latest). " +
                    $"Exception message: {ex.Message}";
                throw GetHttpInternalServerErrorResponseException(errorMessage);
            }
        }

        [Route("api/database/apps/{appId}/viewscheme/{viewName}")]
        [HttpPost]
        public AjaxTransferViewColumnList GetViewScheme(int appId, string viewName)
        {
            DBConnection db = COREobject.i.Entitron;

            AjaxTransferViewColumnList list = new AjaxTransferViewColumnList() { Columns = db.Tabloid(viewName).Columns.Select(c => c.Name).ToList() };

            return list;
        }

        [Route("api/database/apps/{appId}/commits")]
        [HttpPost]
        public int SaveScheme(int appId, AjaxTransferDbScheme postData)
        {
            bool dbSchemeLocked = false;
            try
            {
                DbSchemeCommit commit = new DbSchemeCommit();
                var context = COREobject.i.Context;
                var requestedApp = context.Applications.Find(appId);
                requestedApp.SchemeLockedForUserId = null;
                if (requestedApp.DbSchemeLocked)
                    throw new InvalidOperationException("This application's database scheme is locked because another process is currently working with it.");
                requestedApp.DbSchemeLocked = dbSchemeLocked = true;
                requestedApp.EntitronChangedSinceLastBuild = true;
                requestedApp.TapestryChangedSinceLastBuild = true;
                context.SaveChanges();
                commit.Timestamp = DateTime.UtcNow;
                commit.CommitMessage = postData.CommitMessage;
                requestedApp.DatabaseDesignerSchemeCommits.Add(commit);
                Dictionary<int, int> tableIdMapping = new Dictionary<int, int>();
                Dictionary<int, int> columnIdMapping = new Dictionary<int, int>();
                Dictionary<int, DbColumn> columnMapping = new Dictionary<int, DbColumn>();

                foreach (var ajaxTable in postData.Tables)
                {
                    int ajaxTableId = ajaxTable.Id;
                    DbTable newTable = new DbTable { Name = ajaxTable.Name, PositionX = ajaxTable.PositionX, PositionY = ajaxTable.PositionY };
                    foreach (var column in ajaxTable.Columns)
                    {
                        int ajaxColumnId = column.Id;
                        DbColumn newColumn = new DbColumn
                        {
                            Name = column.Name,
                            DisplayName = column.DisplayName,
                            Type = column.Type,
                            PrimaryKey = column.PrimaryKey,
                            AllowNull = column.AllowNull,
                            DefaultValue = column.DefaultValue,
                            ColumnLength = column.ColumnLength,
                            ColumnLengthIsMax = column.ColumnLengthIsMax,
                            Unique = column.Unique
                        };
                        newTable.Columns.Add(newColumn);
                        context.SaveChanges();
                        columnMapping.Add(ajaxColumnId, newColumn);
                    }
                    foreach (var index in ajaxTable.Indices)
                    {
                        string columnNamesString = "";
                        if (index.ColumnNames.Count > 0)
                        {
                            for (int i = 0; i < index.ColumnNames.Count - 1; i++)
                                columnNamesString += index.ColumnNames[i] + ",";
                            columnNamesString += index.ColumnNames.Last();
                        }
                        DbIndex newIndex = new DbIndex
                        {
                            Name = index.Name,
                            Unique = index.Unique,
                            ColumnNames = columnNamesString
                        };
                        newTable.Indices.Add(newIndex);
                    }
                    commit.Tables.Add(newTable);
                    context.SaveChanges();
                    tableIdMapping.Add(ajaxTableId, newTable.Id);
                    foreach (var column in ajaxTable.Columns)
                    {
                        DbColumn col =
                            newTable.Columns.SingleOrDefault(x => x.Name.ToLower() == columnMapping[column.Id].Name.ToLower());

                        columnIdMapping.Add(column.Id, col.Id);
                    }
                }
                foreach (var ajaxRelation in postData.Relations)
                {
                    int sourceTable = tableIdMapping[ajaxRelation.SourceTable];
                    int targetTable = tableIdMapping[ajaxRelation.TargetTable];
                    int sourceColumn = columnIdMapping[ajaxRelation.SourceColumn];
                    int targetColumn = columnIdMapping[ajaxRelation.TargetColumn];
                    DbTable targetTableDb = commit.Tables.SingleOrDefault(x => x.Id == targetTable);
                    DbTable sourceTableDb = commit.Tables.SingleOrDefault(x => x.Id == sourceTable);
                    string name = targetTableDb.Name + targetTableDb.Columns.SingleOrDefault(x => x.Id == targetColumn).Name + "_" + sourceTableDb.Name + sourceTableDb.Columns.SingleOrDefault(x => x.Id == sourceColumn).Name;
                    commit.Relations.Add(new DbRelation
                    {
                        SourceTableId = sourceTable,
                        TargetTableId = targetTable,
                        SourceColumnId = sourceColumn,
                        TargetColumnId = targetColumn,
                        Type = ajaxRelation.Type,
                        Name = name
                    });
                }
                foreach (var ajaxView in postData.Views)
                {
                    commit.Views.Add(new DbView
                    {
                        Name = ajaxView.Name,
                        Query = ajaxView.Query,
                        PositionX = ajaxView.PositionX,
                        PositionY = ajaxView.PositionY
                    });
                }
                requestedApp.DbSchemeLocked = dbSchemeLocked = false;
                commit.IsComplete = true;
                context.SaveChanges();
                return commit.Id;
            }
            catch (Exception ex)
            {
                if (dbSchemeLocked)
                {
                    var context = COREobject.i.Context;
                    var requestedApp = context.Applications.Find(appId);
                    requestedApp.DbSchemeLocked = false;
                    context.SaveChanges();
                }
                var errorMessage = "DatabaseDesigner: an error occurred when saving the database scheme (POST api/database/apps/{appId}/commits). " +
                        $"Exception message: {ex.Message}";
                Log.Error(errorMessage);
                throw GetHttpInternalServerErrorResponseException(errorMessage);
            }
        }

        public void SaveChanges(DbSchemeCommit SchemeCommit)
        {
            DBEntities e = COREobject.i.Context;
            foreach (DbTable schemeTable in SchemeCommit.Tables)
            {
                IEnumerable<DbTable> removeTables = SchemeCommit.Tables.Where(x1 => !e.DbTables.Any(x2 => x2.Id == x1.Id));
                e.DbTables.Except<DbTable>(removeTables); //maže všechny tabulky, které se už nenachází na schématu uživatele

                if (e.DbTables.SingleOrDefault(x => x.Id == schemeTable.Id) == null) //pokud je ve schématu uživatele vytvořena nová tabulka
                {
                    e.DbTables.Add(schemeTable);
                }
                else
                {
                    DbTable DatabaseTable = e.DbTables.SingleOrDefault(x => x.Id == schemeTable.Id);
                    if (DatabaseTable.Name != schemeTable.Name) DatabaseTable.Name = schemeTable.Name;

                    foreach (DbColumn schemeColumn in schemeTable.Columns)
                    {
                        IEnumerable<DbColumn> removeColumns = schemeTable.Columns.Where(x1 => !DatabaseTable.Columns.Any(x2 => x2.Id == x1.Id));
                        DatabaseTable.Columns.Except<DbColumn>(removeColumns); //maže všechny sloupce tabulky, které se už nenachází na schématu uživatele

                        if (DatabaseTable.Columns.SingleOrDefault(x => x.Id == schemeColumn.Id) == null) //pokud je ve schématu uživatele vytvořen nový sloupec
                        {
                            DatabaseTable.Columns.Add(schemeColumn);
                        }
                        else
                        {
                            DbColumn DatabaseColumn = DatabaseTable.Columns.SingleOrDefault(x => x.Id == schemeColumn.Id);

                            if (DatabaseColumn.Name != schemeColumn.Name) DatabaseColumn.Name = schemeColumn.Name;
                            if (DatabaseColumn.DisplayName != schemeColumn.DisplayName) DatabaseColumn.DisplayName = schemeColumn.DisplayName;
                            if (DatabaseColumn.PrimaryKey != schemeColumn.PrimaryKey) DatabaseColumn.PrimaryKey = schemeColumn.PrimaryKey;
                            if (DatabaseColumn.Type != schemeColumn.Type) DatabaseColumn.Type = schemeColumn.Type;
                            if (DatabaseColumn.Unique != schemeColumn.Unique) DatabaseColumn.Unique = schemeColumn.Unique;
                            if (DatabaseColumn.AllowNull != schemeColumn.AllowNull) DatabaseColumn.AllowNull = schemeColumn.AllowNull;
                            if (DatabaseColumn.ColumnLength != schemeColumn.ColumnLength) DatabaseColumn.ColumnLength = schemeColumn.ColumnLength;
                            if (DatabaseColumn.ColumnLengthIsMax != schemeColumn.ColumnLengthIsMax) DatabaseColumn.ColumnLengthIsMax = schemeColumn.ColumnLengthIsMax;
                            if (DatabaseColumn.DefaultValue != schemeColumn.DefaultValue) DatabaseColumn.DefaultValue = schemeColumn.DefaultValue;
                        }
                    }
                    foreach (DbIndex schemeIndex in schemeTable.Indices)
                    {
                        IEnumerable<DbIndex> removeIndeces = schemeTable.Indices.Where(x1 => !DatabaseTable.Indices.Any(x2 => x2.Id == x1.Id));
                        DatabaseTable.Indices.Except<DbIndex>(removeIndeces); //maže všechny indexy tabulky, které se už nenachází na schématu uživatele

                        if (DatabaseTable.Indices.SingleOrDefault(x => x.Id == schemeIndex.Id) == null) //pokud je ve schématu uživatele vytvořen nový index
                        {
                            DatabaseTable.Indices.Add(schemeIndex);
                        }
                        else
                        {
                            DbIndex databaseIndex = DatabaseTable.Indices.SingleOrDefault(x => x.Id == schemeIndex.Id);

                            if (databaseIndex.ColumnNames != schemeIndex.ColumnNames) databaseIndex.ColumnNames = schemeIndex.ColumnNames;
                            if (databaseIndex.Name != schemeIndex.Name) databaseIndex.Name = schemeIndex.Name;
                            if (databaseIndex.Unique != schemeIndex.Unique) databaseIndex.Unique = schemeIndex.Unique;
                        }
                    }

                }

            }

            foreach (DbRelation schemeRelation in SchemeCommit.Relations)
            {
                IEnumerable<DbRelation> removeRelations = SchemeCommit.Relations.Where(x1 => !e.DbRelation.Any(x2 => x2.Id == x1.Id));
                e.DbRelation.Except<DbRelation>(removeRelations); //maže všechny vztahy, které se už nenachází ve schématu uživatele

                if (e.DbRelation.SingleOrDefault(x => x.Id == schemeRelation.Id) == null) //pokud je ve schématu uživatele vytvořen nový vztah
                {
                    e.DbRelation.Add(schemeRelation);
                }
                else
                {
                    DbRelation databaseRelation = e.DbRelation.SingleOrDefault(x => x.Id == schemeRelation.Id);

                    databaseRelation.SourceTableId = schemeRelation.SourceTableId;
                    databaseRelation.TargetTableId = schemeRelation.TargetTableId;
                    databaseRelation.SourceColumnId = schemeRelation.SourceColumnId;
                    databaseRelation.TargetColumnId = schemeRelation.TargetColumnId;
                    databaseRelation.Type = schemeRelation.Type;
                }
            }

            foreach (DbView schemeView in SchemeCommit.Views)
            {
                IEnumerable<DbView> removeRelations = SchemeCommit.Views.Where(x1 => !e.DbView.Any(x2 => x2.Id == x1.Id));
                e.DbView.Except<DbView>(removeRelations); //maže všechny pohledy, které se už nenachází ve schématu uživatele

                if (e.DbView.SingleOrDefault(x => x.Id == schemeView.Id) == null) //pokud je ve schématu uživatele vytvořen nový pohled
                {
                    e.DbView.Add(schemeView);
                }
                else
                {
                    DbView databaseView = e.DbView.SingleOrDefault(x => x.Id == schemeView.Id);

                    if (databaseView.Name != schemeView.Name) databaseView.Name = schemeView.Name;
                    if (databaseView.Query != schemeView.Query) databaseView.Query = schemeView.Query;
                }
            }
        }

        /// <exception cref="InstanceNotFoundException">Not found commit for commitId</exception>
        private AjaxTransferDbScheme GetCommit(int appId, int commitId = -1)
        {
            var context = COREobject.i.Context;
            var result = new AjaxTransferDbScheme();
            var requestedCommit = FetchDbSchemeCommit(appId, commitId, context);
            int? lockedForUserId = context.Applications.Find(appId).SchemeLockedForUserId;
            result.SchemeLockedForUserId = lockedForUserId; //set the lockedForUserId for ajax model
            if (lockedForUserId != null)
            {
                result.SchemeLockedForUserName = context.Users.SingleOrDefault(u => u.Id == result.SchemeLockedForUserId).DisplayName;
            }
            if (commitId == -1 && requestedCommit != null)
            {
                DbSchemeCommit sharedCommit = FetchDbSchemeCommit(Application.SystemApp().Id, commitId, context);
                AjaxTransferDbScheme sharedScheme = new AjaxTransferDbScheme();

                SetAttributesRequestCommitTables(sharedCommit, sharedScheme);
                SetAttributesRequestCommitRelations(sharedCommit, sharedScheme);
                SetAttributesRequestCommitViews(sharedCommit, sharedScheme);
                sharedScheme.CurrentSchemeCommitId = context.Applications.Find(appId).DatabaseDesignerSchemeCommits.OrderByDescending(s => s.Timestamp).FirstOrDefault().Id;
                result.Shared = sharedScheme;
                if (requestedCommit == null)
                {
                    return result;
                }
            }

            //Latest commit was requested, but there are no commits yet. Returning an empty commit.
            if (requestedCommit == null)
            {
                return new AjaxTransferDbScheme() { CurrentSchemeCommitId = null };
            }
            result.CurrentSchemeCommitId = context.Applications.Find(appId).DatabaseDesignerSchemeCommits.OrderByDescending(s => s.Timestamp).FirstOrDefault().Id;

            SetAttributesRequestCommitTables(requestedCommit, result);
            SetAttributesRequestCommitRelations(requestedCommit, result);
            SetAttributesRequestCommitViews(requestedCommit, result);

            return result;
        }
        private static HttpResponseException GetHttpInternalServerErrorResponseException(string errorMessage)
        {
            Log.Error(errorMessage);
            return new HttpResponseException(new HttpResponseMessage(HttpStatusCode.InternalServerError)
            {
                Content = new StringContent(errorMessage),
                ReasonPhrase = "Critical Exception"
            });
        }


        private static void SetAttributesRequestCommitViews(DbSchemeCommit requestedCommit, AjaxTransferDbScheme result)
        {
            foreach (var view in requestedCommit.Views)
            {
                result.Views.Add(new AjaxTransferDbView
                {
                    Id = view.Id,
                    Name = view.Name,
                    PositionX = view.PositionX,
                    PositionY = view.PositionY,
                    Query = view.Query,
                });
            }
        }

        private static void SetAttributesRequestCommitRelations(DbSchemeCommit requestedCommit, AjaxTransferDbScheme result)
        {
            foreach (var relation in requestedCommit.Relations)
            {
                result.Relations.Add(new AjaxTransferDbRelation
                {
                    SourceColumn = relation.SourceColumnId,
                    SourceTable = relation.SourceTableId,
                    TargetColumn = relation.TargetColumnId,
                    TargetTable = relation.TargetTableId,
                    Type = relation.Type
                });
            }
        }

        private static void SetAttributesRequestCommitTables(DbSchemeCommit requestedCommit, AjaxTransferDbScheme result)
        {
            foreach (var table in requestedCommit.Tables)
            {
                var ajaxTable = new AjaxTransferDbTable
                {
                    Id = table.Id,
                    Name = table.Name,
                    PositionX = table.PositionX,
                    PositionY = table.PositionY
                };
                foreach (var column in table.Columns)
                {
                    ajaxTable.Columns.Add(new AjaxTransferDbColumn
                    {
                        AllowNull = column.AllowNull,
                        ColumnLength = column.ColumnLength,
                        ColumnLengthIsMax = column.ColumnLengthIsMax,
                        DefaultValue = column.DefaultValue,
                        Id = column.Id,
                        Name = column.Name,
                        DisplayName = column.DisplayName,
                        PrimaryKey = column.PrimaryKey,
                        Type = column.Type,
                        Unique = column.Unique,
                    });
                }
                foreach (var index in table.Indices)
                {
                    ajaxTable.Indices.Add(new AjaxTransferDbIndex
                    {
                        ColumnNames = index.ColumnNames.Split(',').ToList(),
                        Id = index.Id,
                        Name = index.Name,
                        Unique = index.Unique,
                    });
                }
                result.Tables.Add(ajaxTable);
            }
        }
        /// <exception cref="InstanceNotFoundException">Not found commit for commitId</exception>
        private DbSchemeCommit FetchDbSchemeCommit(int appId, int commitId, DBEntities context)
        {
            DbSchemeCommit requestedCommit;
            try
            {
                if (commitId == -1)

                    if (context.Applications.Find(appId).DatabaseDesignerSchemeCommits.Count > 0)
                    {
                        requestedCommit = context.Applications.Find(appId).DatabaseDesignerSchemeCommits
                            .OrderByDescending(o => o.Timestamp).FirstOrDefault();
                    }
                    else {
                        return null;
                    }

                else
                    requestedCommit = context.DBSchemeCommits.Find(commitId);
            }
            catch (InvalidOperationException ex)
            {
                if (commitId == -1)
                {
                    Log.Info("DatabaseDesigner: latest commit was requested, but there are no commits yet. Returning an empty commit.");
                    return null;
                }
                var errorString = Format("DatabaseDesigner: the requested commit with id={1} doesn't exist. " + "Exception message: {0}",
                        ex.Message, commitId);
                Log.Error(errorString);
                throw new InstanceNotFoundException(errorString);
            }
            return requestedCommit;
        }

        [Route("api/grid/rig_configs/{container_id}/")]
        [HttpGet]
        public JObject test(int container_id)
        {
            string conString = System.Configuration.ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;
            using (SqlConnection con = new SqlConnection(conString))
            {
                con.Open();
                string query = $@"SELECT Rig_ip, config.GPU_piece as 'gpus'
FROM Entitron_Grid_RigPlacement as placement
INNER JOIN Entitron_Grid_RigConfig as config ON placement.TestRigConfigId = config.id
WHERE Container_id = {container_id};";
                SqlCommand command = new SqlCommand(query, con);
                SqlDataReader reader = command.ExecuteReader();
                JObject response = new JObject();
                while (reader.Read())
                    response.Add(reader["Rig_ip"].ToString().Split(':')[0], (int)reader["gpus"]);
                return response;
            }
        }
    }
}
