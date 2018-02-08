﻿using System;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Configuration;
using System.Web.Routing;
using FSS.Omnius.FrontEnd.Views;
using FSS.Omnius.Controllers.CORE;
using FSS.Omnius.Modules.Entitron.Entity;
using FSS.Omnius.Controllers.Tapestry;
using System.Collections.Generic;
using System.Data.Entity.Validation;
using System.Diagnostics;
using System.Globalization;
using System.Configuration;
using FSS.Omnius.Modules.Entitron;

namespace FSS.Omnius.FrontEnd
{
    public class MvcApplication : HttpApplication
    {
        protected void Application_Start()
        {
            ViewEngines.Engines.Clear();
            ViewEngines.Engines.Add(new MyRazorViewEngine());
            //ViewEngines        .Engines.Add(new MyWebFormViewEngine());
            AreaRegistration.RegisterAllAreas();
            UnityConfig.RegisterComponents();
            GlobalConfiguration.Configure(WebApiConfig.Register);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            //BundleConfig.RegisterBundles(BundleTable.Bundles);
            Logger.Log.ConfigureRootDir(Server);
            Omnius.Modules.Entitron.Entitron.connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;
            MvcHandler.DisableMvcResponseHeader = true;
            App_Start.AppStart.AppInitialize();
            Logger.Log.Info("Omnius starts");
        }

        protected void Application_Error(object sender, EventArgs e)
        {
            try
            {
                foreach (Exception error in Context.AllErrors)
                {
                    Omnius.Modules.Watchtower.OmniusException.Log(
                        $"Global: {Request?.HttpMethod} {Request?.Url.AbsoluteUri}",
                        Omnius.Modules.Watchtower.OmniusLogSource.CORE,
                        innerException: error);
                }
            }
            catch (Exception exc)
            {
                Logger.Log.Error(exc, Request);
            }
        }

        protected void Application_BeginRequest()
        {
            // SECURE: Ensure any request is returned over SSL/TLS in production
            // Has to be disabled on IIS instances without SSL certificates
            /*if (!Request.IsLocal && !Context.Request.IsSecureConnection)
            {
                var redirect = Context.Request.Url.ToString().ToLower(CultureInfo.CurrentCulture).Replace("http:", "https:");
                Response.Redirect(redirect);
            }*/

            RunController.requestStart = DateTime.Now;
            DBEntities.Create();
            //string appName = Context.Request.Url.LocalPath.TrimStart(new char[] { '/' }).Split('/').FirstOrDefault();
            RouteData routeData = RouteTable.Routes.GetRouteData(new HttpContextWrapper(HttpContext.Current));
            string appName = (string)routeData.Values["appName"];
            if (string.IsNullOrEmpty(appName) && (routeData.Values["MS_SubRoutes"] as System.Web.Http.Routing.IHttpRouteData[])?.FirstOrDefault()?.Values.ContainsKey("appName") == true)
                appName = (string)(routeData.Values["MS_SubRoutes"] as System.Web.Http.Routing.IHttpRouteData[])?.FirstOrDefault()?.Values["appName"];
            Entitron.Create(appName); // run controller || api run controller
        }

        protected void Application_EndRequest()
        {
            // error
            if (new int[] { 403, 404, 500 }.Contains(Context.Response.StatusCode) && !Request.Url.AbsolutePath.StartsWith("/rest/"))
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
            DBEntities.Destroy();
            Entitron.Destroy();
        }
    }
}
