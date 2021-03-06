﻿using FSS.Omnius.Nexus.Gate;
using Newtonsoft.Json.Linq;

namespace FSS.Omnius.Modules.Nexus.Service
{
    public class NexusLdapService : INexusLdapService
    {
        Ldap ldap;

        public NexusLdapService()
        {
            ldap = new Ldap();
        }

        public void UseServer(string serverName)
        {
            ldap.UseServer(serverName);
        }

        public JToken SearchByLogin(string login, string baseDN = "", string[] properties = null)
        {
            return ldap.SearchByAdLogin(login, baseDN, properties);
        }

        public JToken SearchByEmail(string email, string baseDN = "", string[] properties = null)
        {
            return ldap.SearchByEmail(email, baseDN, properties);
        }

        public JToken SearchByIdentify(string identify, string baseDN = "", string[] properties = null)
        {
            return ldap.SearchByIdentify(identify, baseDN, properties);
        }

        public JToken GetUsers(string baseDN = "", string[] properties = null)
        {
            return ldap.GetUsers(baseDN, properties);
        }

        public JToken GetGroups(string CN, string baseDN = "", string[] properties = null)
        {
            return ldap.GetGroups(CN, baseDN, properties);
        }

        public JToken Search(string filter, string baseDN = "", string[] properties = null)
        {
            return ldap.Search(filter, baseDN, properties);
        }

        public JToken FindOne(string filter, string baseDN = "", string[] properties = null)
        {
            return ldap.FindOne(filter, baseDN, properties);
        }
    }
}
