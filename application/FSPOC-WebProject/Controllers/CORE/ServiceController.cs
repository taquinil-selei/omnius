﻿using System;
using System.Linq;
using System.Web.Mvc;
using FSS.Omnius.Modules.Entitron.Entity;
using FSS.Omnius.Modules.Entitron.Entity.CORE;
using Newtonsoft.Json;
using System.IO;
using System.Collections.Generic;
using FSS.Omnius.Modules.Entitron.Entity.Master;
using System.Text;

namespace FSS.Omnius.Controllers.CORE
{

    [PersonaAuthorize(Roles = "Admin", Module = "CORE")]
    public class ServiceController : Controller
    {

        public FileStreamResult BackupApp(int id)
        {
            var backupService = new FSS.Omnius.Modules.Entitron.Service.BackupGeneratorService();
            var context = new DBEntities();
            string jsonText = backupService.ExportApplication(id);
            var appName = context.Applications.SingleOrDefault(a => a.Id == id).Name;
            var byteArray = Encoding.UTF8.GetBytes(jsonText);
            var stream = new MemoryStream(byteArray);

            return File(stream, "text/plain",  appName + ".txt");

        }
        public ActionResult RecoverApp()
        {
            return View();
        }
    }
}