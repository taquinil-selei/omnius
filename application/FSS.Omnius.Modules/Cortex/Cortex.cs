﻿namespace FSS.Omnius.Modules.Cortex
{
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using System.Linq;
    using Entitron.Entity.Cortex;
    using System.Web.Configuration;
    using Entitron.Entity;
    using System.Web;
    using Interface;
    using FSS.Omnius.Modules.CORE;

    public class Cortex
    {
        private HttpRequestBase Request;

        public Cortex()
        {

        }
        public Cortex(HttpRequestBase request)
        {
            Request = request;
        }

        private ICortexAPI GetAPI()
        {
#if DEBUG
            string APIType = WebConfigurationManager.AppSettings["CortexAPI_DEBUG"];
#else
            string APIType = WebConfigurationManager.AppSettings["CortexAPI_RELEASE"];
#endif
            switch (APIType)
            {
                case "AzureScheduler":
                    return new CortexAzureScheduler(Request);
                case "Schtasks":
                    return new CortexSchtasks(Request);
                default:
                    throw new Exception("Not implemented schedule task api");
            }
        }

        public string List()
        {
            ICortexAPI api = GetAPI();
            return api.List();
        }

        public int? Save(Task model)
        {
            DBEntities e = COREobject.i.Context;
            Task row = !model.Id.Equals(null) ? e.Tasks.Single(m => m.Id == model.Id) : new Task();
            Task original = !model.Id.Equals(null) ? e.Tasks.Single(m => m.Id == model.Id) : null;

            row.Active = model.Active;
            row.AppId = model.AppId;
            row.Daily_Repeat = model.Daily_Repeat;
            row.Duration = model.Duration;
            row.End_Date = model.End_Date;
            row.End_Time = model.End_Time;
            row.Repeat = model.Repeat;
            row.Repeat_Minute = model.Repeat_Minute;
            row.Repeat_Duration = model.Repeat_Duration;
            row.Idle_Time = model.Idle_Time;
            row.Monthly_Days = GetDaysInMonthFlags();
            row.Monthly_In_Days = GetDaysFlags("Monthly_In_Days[]");
            row.Monthly_In_Modifiers = GetModifierFlags();
            row.Monthly_Months = GetMonthsFlags();
            row.Monthly_Type = model.Monthly_Type;
            row.Name = model.Name;
            row.Start_Date = model.Start_Date;
            row.Start_Time = model.Start_Time;
            row.Type = model.Type;
            row.Url = model.Url;
            row.Weekly_Days = GetDaysFlags("Weekly_Days[]");
            row.Weekly_Repeat = model.Weekly_Repeat;

            ICortexAPI api = GetAPI();

            if (model.Id.Equals(null))
            {
                e.Tasks.Add(row);
                e.SaveChanges();
                api.Create(row);
            }
            else
            {
                api.Change(row, original);
            }

            e.SaveChanges();
            return row.Id;
        }

        public void Delete(int taskId)
        {
            DBEntities e = COREobject.i.Context;
            Task row = e.Tasks.Single(m => m.Id == taskId);

            ICortexAPI api = GetAPI();
            api.Delete(row);

            e.Tasks.Remove(row);
            e.SaveChanges();
        }

        public void Delete(string taskName)
        {
            ICortexAPI api = GetAPI();
            api.Delete(taskName);
        }

        public void ClearObsolateOneTimeTasks()
        {
            DateTime now = DateTime.UtcNow;
            DateTime oldDate = now.AddMinutes(-10);
            TimeSpan oldTime = new TimeSpan(oldDate.Hour, oldDate.Minute, oldDate.Second);

            oldDate = oldDate.AddHours(-oldDate.Hour);
            oldDate = oldDate.AddMinutes(-oldDate.Minute);
            oldDate = oldDate.AddSeconds(-oldDate.Second);

            ICortexAPI api = GetAPI();
            List<Task> taskList = COREobject.i.Context.Tasks.Where(t => t.Type == ScheduleType.ONCE).ToList();

            List<Task> taskForDelete = new List<Task>();
            foreach (Task t in taskList)
            {
                if (t.Start_Date < oldDate)
                {
                    taskForDelete.Add(t);
                }
                if (t.Start_Date == oldDate && t.Start_Time <= oldTime)
                {
                    taskForDelete.Add(t);
                }
            }

            if (taskForDelete.Count > 0)
            {
                foreach (Task t in taskForDelete)
                {
                    api.Delete(t);
                }
                COREobject.i.Context.Tasks.RemoveRange(taskForDelete);
            }
        }

        #region TOOLS

        private int GetDaysFlags(string formKey)
        {
            int flag = 0;
            if (Request != null && !String.IsNullOrEmpty((string)Request.Form[formKey]))
            {
                List<string> selected = ((string)Request.Form[formKey]).Split(',').ToList();
                foreach (Days day in Enums<Days>())
                {
                    if (selected.Contains(day.ToString())) flag = flag | (int)day;
                }
            }
            return flag;
        }

        private int GetModifierFlags()
        {
            int flag = 0;
            if (Request != null && !String.IsNullOrEmpty((string)Request.Form["Monthly_In_Modifiers[]"]))
            {
                List<string> selected = ((string)Request.Form["Monthly_In_Modifiers[]"]).Split(',').ToList();
                foreach (InModifiers mod in Enums<InModifiers>())
                {
                    if (selected.Contains(mod.ToString())) flag = flag | (int)mod;
                }
            }
            return flag;
        }

        private int GetMonthsFlags()
        {
            int flag = 0;
            if (Request != null && !String.IsNullOrEmpty((string)Request.Form["Monthly_Months[]"]))
            {
                List<string> selected = ((string)Request.Form["Monthly_Months[]"]).Split(',').ToList();
                foreach (Months month in Enums<Months>())
                {
                    if (selected.Contains(month.ToString())) flag = flag | (int)month;
                }
            }
            return flag;
        }

        private Int64 GetDaysInMonthFlags()
        {
            Int64 flag = 0;
            if (Request != null && !String.IsNullOrEmpty((string)Request.Form["Monthly_Days[]"]))
            {
                List<string> selected = ((string)Request.Form["Monthly_Days[]"]).Split(',').ToList();
                foreach (DaysInMonth day in Enums<DaysInMonth>())
                {
                    if (selected.Contains(day.ToString())) flag = flag | (Int64)day;
                }
            }
            return flag;
        }

        private IEnumerable Enums<T>()
        {
            return Enum.GetValues(typeof(T));
        }

        #endregion
    }
}