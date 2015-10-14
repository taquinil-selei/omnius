﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Mozaic
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                name: "Config",
                url: "config/{action}",
                defaults: new
                {
                    controller = "Config",
                    action = "Index"
                }
            );

            routes.MapRoute(
                name: "Builder",
                url: "{app}/builder/{action}/{id}",
                defaults: new
                {
                    controller = "Builder",
                    action = "Index",
                    id = UrlParameter.Optional
                }
            );

            routes.MapRoute(
                name: "Default",
                url: "{app}/{pageId}/{tableName}/{modelId}",
                defaults: new
                {
                    controller = "Renderer",
                    action = "Show"
                }
            );
        }
    }
}
