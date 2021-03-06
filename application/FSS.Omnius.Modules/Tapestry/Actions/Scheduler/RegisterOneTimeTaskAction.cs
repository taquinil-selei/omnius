﻿using FSS.Omnius.Modules.CORE;
using FSS.Omnius.Modules.Entitron.Entity.Cortex;
using FSS.Omnius.Modules.Entitron.Entity.Master;
using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Configuration;

namespace FSS.Omnius.Modules.Tapestry.Actions.Entitron
{
    [EntitronRepository]
    public class RegisterTaskAction : Action
    {
        public override int Id => 186;
        public override int? ReverseActionId => null;
        public override string[] InputVar => new string[] { "TaskName", "Block", "Minutes", "?Button", "?ModelId", "?StartTime", "?b$InputIsUtc" };
        public override string Name => "Register one-time task";
        public override string[] OutputVar => new string[] { "TaskId" };

        public override void InnerRun(Dictionary<string, object> vars, Dictionary<string, object> outputVars, Dictionary<string, object> InvertedInputVars, Message message)
        {
            Application app = COREobject.i.Application;

            bool isutc = vars.ContainsKey("InputIsUtc") ? (bool)vars["InputIsUtc"] : false;
            string hostname = TapestryUtils.GetServerHostName();
            string appName = app.Name;
            string blockName = (string)vars["Block"];
            string button = vars.ContainsKey("Button") ? (string)vars["Button"] : "";
            int modelId = vars.ContainsKey("ModelId") ? (int)vars["ModelId"] : -1;
            string serverName = HttpContext.Current.Request.ServerVariables["SERVER_NAME"];

            string systemAccName = WebConfigurationManager.AppSettings["SystemAccountName"];
            string systemAccPass = WebConfigurationManager.AppSettings["SystemAccountPass"];

            string targetUrl;

            if (serverName == "localhost")
                targetUrl = $"https://omnius-as.azurewebsites.net/{appName}/{blockName}/Get?modelId={modelId}&User={systemAccName}&Password={systemAccPass}";
            else
                targetUrl = $"{hostname}/{appName}/{blockName}/Get?modelId={modelId}&User={systemAccName}&Password={systemAccPass}";

            if (button != "")
                targetUrl += $"&button={button}";

            string taskName = (string)vars["TaskName"];
            DateTime time;
            if(vars.ContainsKey("StartTime"))
            {
                var localTime = (DateTime)vars["StartTime"];
                if (!isutc)
                {
                    time = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(localTime, DateTimeKind.Unspecified),
                    TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time"));
                }
                else
                {
                    time = localTime;
                }
            }
            else
            {
                int minutes = Convert.ToInt32(vars["Minutes"]);
                time = DateTime.Now.AddMinutes(minutes);
            }

            var newTask = new Task
            {
                AppId = app.Id,
                Active = true,
                Name = taskName,
                Type = ScheduleType.ONCE,
                Url = targetUrl,
                Repeat = false,
                Start_Time = new TimeSpan(time.Hour, time.Minute, 0),
                Start_Date = time
            };
            var cortex = new Cortex.Cortex();
            cortex.Save(newTask);

            outputVars["TaskId"] = newTask.Id;
        }
    }
}
