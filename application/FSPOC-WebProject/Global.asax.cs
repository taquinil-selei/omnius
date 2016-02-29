﻿using FSPOC_WebProject.Views;
using FSS.Omnius.Controllers.CORE;
using System;
using System.Linq;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace FSPOC_WebProject
{
    public class MvcApplication : HttpApplication
    {
        protected void Application_Start()
        {
            ViewEngines        .Engines.Clear();
            ViewEngines        .Engines.Add(new MyRazorViewEngine());
            ViewEngines        .Engines.Add(new MyWebFormViewEngine());
            AreaRegistration   .RegisterAllAreas();
            UnityConfig        .RegisterComponents();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            FilterConfig       .RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig        .RegisterRoutes(RouteTable.Routes);
            BundleConfig       .RegisterBundles(BundleTable.Bundles);
            App_Start.AppStart.AppInitialize();
            Logger.Log.Info("Omnius starts");
        }

        protected void Application_Error(object sender, EventArgs e)
        {

            string body = $"URL: {Request.Url.AbsoluteUri}{Environment.NewLine}Errors:{Environment.NewLine}";
            foreach (var error in Context.AllErrors)
            {
                var curError = error;
                while (curError != null)
                {
                    body += $"Message: {curError.Message}{Environment.NewLine}Trace: {curError.StackTrace}{Environment.NewLine}{Environment.NewLine}";

                    curError = curError.InnerException;
                }
            }

            Logger.Log.Error(body);
        }

        protected void Application_EndRequest()
        {
            // error
            if (new int[] { 403, 404, 500 }.Contains(Context.Response.StatusCode))
            {
                Response.Clear();

                var rd = new RouteData();
                rd.DataTokens["area"] = "AreaName"; // In case controller is in another area
                rd.Values["controller"] = "Error";

                switch (Context.Response.StatusCode)
                {
                    case 403:
                        rd.Values["action"] = "UserNotAuthorized";
                        break;
                    case 404:
                        rd.Values["action"] = "PageNotFound";
                        break;
                    case 500:
                        rd.Values["action"] = "InternalServerError";
                        break;
                }

                IController c = new ErrorController();
                c.Execute(new RequestContext(new HttpContextWrapper(Context), rd));
            }
        }
    }
}
