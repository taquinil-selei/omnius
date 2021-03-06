﻿using System.Collections.Generic;

namespace FSS.Omnius.Modules.Entitron.Entity.Persona
{
     public class AjaxPersonaAppRoles : IEntity
    {
         public string AppName { get; set; }
         public List<AjaxPersonaAppRoles_User> Users { get; set; }
         public List<AjaxPersonaAppRoles_Role> Roles { get; set; }

         public AjaxPersonaAppRoles()
         {
             Users = new List<AjaxPersonaAppRoles_User>();
             Roles = new List<AjaxPersonaAppRoles_Role>();
         }
     }

    public class AjaxPersonaAppstates : IEntity
    {
        public string StateName { get; set; }
        public List<AjaxPersonaAppRoles_State> States { get; set; }

        public AjaxPersonaAppstates()
        {
            States = new List<AjaxPersonaAppRoles_State>();
        }
    }


    public class AjaxPersonaAppRoles_User : IEntity
    {
         public int Id { get; set; }
         public string Name { get; set; }
     }

     public class AjaxPersonaAppRoles_Role : IEntity
    {
         public int Id { get; set; }
         public string Name { get; set; }
         public List<int> MemberList { get; set; }

         public AjaxPersonaAppRoles_Role()
         {
             MemberList = new List<int>();
         }
     }

    public class AjaxPersonaAppRoles_State : IEntity
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }


    public class ColumnHeaderAppRolesForTable : IEntity
    {
        //Roles
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsDeleted { get; set; }
        public int Priority { get; set; }
        public ColumnHeaderAppRolesForTable() { }

        public ColumnHeaderAppRolesForTable(int id, string name,int priority)
        {
            this.Id = id;
            this.Name = name;
            this.Priority = priority;
        }
    }

    public class RowHeaderAppRolesForTable : IEntity
    {
        //Users
        public int Id { get; set; }
        public string Name { get; set; }

        public RowHeaderAppRolesForTable() { }

        public RowHeaderAppRolesForTable(int id, string name)
        {
            this.Id = id;
            this.Name = name;
        }
    }

    public class AjaxPersonaAppRolesForTable : IEntity
    {
        public string AppName { get; set; }
        public int AppID { get; set; }

        public List<ColumnHeaderAppRolesForTable> ColHeaders { get; set; }
        public List<RowHeaderAppRolesForTable> RowHeaders { get; set; }
        public List<bool[]> Data { get; set; }

        public List<int> DeletedCols { get; set; }

        public AjaxPersonaAppRolesForTable() { }

        public AjaxPersonaAppRolesForTable(List<ColumnHeaderAppRolesForTable> colHeaders, List<RowHeaderAppRolesForTable> rowHeaders, List<bool[]> data)
        {
            ColHeaders = colHeaders;
            RowHeaders = rowHeaders;
            Data = data;
        }
    }
}