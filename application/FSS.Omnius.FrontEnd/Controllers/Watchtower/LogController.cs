﻿using System;
using System.Collections.Generic;
using System.Web.Mvc;
using System.Linq;
using FSS.Omnius.Modules.Entitron.Entity;
using FSS.Omnius.Modules.Entitron.Entity.Watchtower;
using FSS.Omnius.Modules.Watchtower;
using FSS.Omnius.FrontEnd.Models;
using FSS.Omnius.Modules.CORE;

namespace FSS.Omnius.Controllers.Watchtower
{
    [PersonaAuthorize(NeedsAdmin = true, Module = "Watchtower")]
    public class LogController : Controller
    {
        public ActionResult Index(LogFilter filter)
        {
            // INIT
            DBEntities context = COREobject.i.Context;
            filter.Fill(context);

            int perPage = 20;
            int page = Request.Form.AllKeys.Contains("page") ? Convert.ToInt32(Request.Form["page"]) - 1 : 0;
            page = page >= 0 ? page : 0;



            var allItems = context.LogItems.Where(
                i =>
                   i.ParentLogItemId == null
                && (filter.LevelId == -1 || i.LogLevel == filter.LevelId)
                && (filter.UserName == "All" || i.UserName == filter.UserName)
                && (filter.Server == "All" || i.Server == filter.Server)
                && (filter.SourceId == -1 || i.Source == filter.SourceId)
                && (filter.ApplicationName == "All" || i.Application == filter.ApplicationName)
                && (filter.BlockName == "All" || i.BlockName == filter.BlockName)
                && (filter.ActionName == "All" || i.ActionName == filter.ActionName)
                && (i.Timestamp > filter.TimeSince && i.Timestamp < filter.TimeTo)
                && (string.IsNullOrEmpty(filter.Message) || i.Message.ToLower().Contains(filter.Message.ToLower()))
            ).OrderByDescending(i => i.Timestamp).Take(100).Select(i =>
                new {
                    Id = i.Id,
                    Timestamp = i.Timestamp,
                    LogLevel = i.LogLevel,
                    UserName = i.UserName,
                    Server = i.Server,
                    Source = i.Source,
                    Application = i.Application,
                    BlockName = i.BlockName,
                    ActionName = i.ActionName,
                    Message = i.Message
                }
            );


            ViewData["perPage"] = perPage;
            ViewData["page"] = page + 1;
            ViewData["total"] = allItems.Count();
            
            filter.ResultItems = allItems.Skip(page * perPage).Take(perPage).ToList().Select(i =>
                new LogItem
                {
                    Id = i.Id,
                    Timestamp = i.Timestamp,
                    LogLevel = i.LogLevel,
                    UserName = i.UserName,
                    Server = i.Server,
                    Source = i.Source,
                    Application = i.Application,
                    BlockName = i.BlockName,
                    ActionName = i.ActionName,
                    Message = i.Message
                }).ToList();
            
            return View(filter);
        }

        [AllowAnonymous]
        public ActionResult DeleteObsolete()
        {
            DBEntities context = COREobject.i.Context;

            var olderThan = DateTime.Now.AddDays(-30);

            var itemsToDelete = context.LogItems.Where(i => i.Timestamp < olderThan && i.ParentLogItem == null);
            var toDeleteList = itemsToDelete.ToList();
            context.LogItems.RemoveRange(toDeleteList);
            context.SaveChanges();

            return new EmptyResult();
        }

        public JsonResult GetRow(int id)
        {
            DBEntities context = COREobject.i.Context;
            LogItem item = context.LogItems.Find(id);

            LogItem current = item;
            while (current != null)
            {
                current.ParentLogItem = null;

                current = current.ChildLogItems.FirstOrDefault();
            }

            return Json(new {
                Time = item.TimeString,
                Level = item.LogLevelString,
                User = item.UserName,
                Server = item.Server,
                Source = item.LogSourceString,
                Application = item.Application,
                Block = item.BlockName,
                Action = item.ActionName,
                Message = item.Message,
                Vars = item.VarHtmlTable(),
                StackTrace = item.StackTraceHtml(),
                Inner = item.ChildLogItems.FirstOrDefault() }, JsonRequestBehavior.AllowGet);
        }
    }
}
