﻿using System;
using System.Collections.Generic;
using System.Web.Mvc;
using System.Linq;
using FSS.Omnius.Modules.Entitron.Entity;
using FSS.Omnius.Modules.Entitron.Entity.Watchtower;

namespace FSS.Omnius.Controllers.Watchtower
{
    [PersonaAuthorize(NeedsAdmin = true, Module = "Watchtower")]
    public class LogController : Controller
    {
        public ActionResult Index(FormCollection formParams)
        {
            using (var context = DBEntities.instance)
            {
                List<LogItem> searchResults = new List<LogItem>();
                List<AjaxLogItem> model = new List<AjaxLogItem>();

                //all USers
                ViewData["users"] = context.Users.ToList();
                //all Applications
                ViewData["apps"] = context.Applications.ToList();

                if (Request.HttpMethod == "POST")
                {
                    bool filterByLevel = formParams["level"] != "all";
                    int levelValue = filterByLevel ? Convert.ToInt32(formParams["level"]) : 0;
                    bool filterByType = formParams["type"] != "all";
                    int typeValue = filterByType ? Convert.ToInt32(formParams["type"]) : 0;
                    bool filterBySource = formParams["source"] != "all";
                    bool filterPlatformOnly = formParams["source"] == "platform";
                    bool filterByAppId = filterBySource && !filterPlatformOnly;
                    int appIdValue = filterByAppId ? Convert.ToInt32(formParams["source"]) : 0;
                    bool filterByUserId = formParams["user"] != "all";
                    int userIdValue = filterByUserId ? Convert.ToInt32(formParams["user"]) : 0;
                    bool searchMessage = formParams["message"] != "";
                    string messageValue = formParams["message"];

                    bool limitByTimeFrom = formParams["time-from"] != "";
                    bool limitByTimeTo = formParams["time-to"] != "";
                    DateTime timeFrom = new DateTime();
                    DateTime timeTo = new DateTime();
                    string format = "dd-MM-yyyy HH:mm";
                    bool timeFromOK = DateTime.TryParseExact(formParams["time-from"], format, null, System.Globalization.DateTimeStyles.None, out timeFrom);
                    bool timeToOK = DateTime.TryParseExact(formParams["time-to"], format, null, System.Globalization.DateTimeStyles.None, out timeTo);

                    if (!timeFromOK || !timeToOK)
                        ViewData["timeFormatError"] = true;

                    ViewData["filter"] = filterByLevel || filterByType || filterBySource || filterPlatformOnly || filterByAppId || filterByUserId
                        || searchMessage || limitByTimeFrom || limitByTimeTo;
                    ViewData["level"] = formParams["level"];
                    ViewData["type"] = formParams["type"];
                    ViewData["source"] = formParams["source"];
                    ViewData["user"] = formParams["user"];
                    ViewData["message"] = formParams["message"];
                    ViewData["time-from"] = formParams["time-from"];
                    ViewData["time-to"] = formParams["time-to"];

                    searchResults = context.LogItems.Where(c =>
                        c.LogLevel == (filterByLevel ? levelValue : c.LogLevel)
                        && c.LogEventType == (filterByType ? typeValue : c.LogEventType)
                        && c.IsPlatformEvent == (filterPlatformOnly ? true : c.IsPlatformEvent)
                        && c.AppId == (filterByAppId ? appIdValue : c.AppId)
                        && c.UserId == (filterByUserId ? userIdValue : c.UserId)
                        && c.Timestamp >= (limitByTimeFrom ? timeFrom : c.Timestamp)
                        && c.Timestamp <= (limitByTimeTo ? timeTo : c.Timestamp)
                        && c.Message.Contains((searchMessage ? messageValue : c.Message)
                        )).OrderByDescending(c => c.Timestamp).Take(100).ToList();
                }
                else
                {
                    searchResults = context.LogItems.OrderByDescending(c => c.Timestamp).Take(100).ToList();
                    ViewData["filter"] = false;
                    ViewData["level"] = "all";
                    ViewData["type"] = "all";
                    ViewData["source"] = "all";
                    ViewData["user"] = "all";
                    ViewData["message"] = "";
                    ViewData["time-from"] = "";
                    ViewData["time-to"] = "";

         

                }

                foreach (var r in searchResults)
                {
                    model.Add(new AjaxLogItem
                    {
                        Id = r.Id,
                        Timestamp = r.Timestamp,
                        LogEventType = r.LogEventType,
                        LogLevel = r.LogLevel,
                        IsPlatformEvent = r.IsPlatformEvent,
                        AppId = r.AppId,
                        UserId = r.UserId,
                        Message = r.Message
                    });
                }
                return View(model);
            }
        }
    }
}