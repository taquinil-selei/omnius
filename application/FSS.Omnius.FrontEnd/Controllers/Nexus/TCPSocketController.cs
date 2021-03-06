using System.Linq;
using System.Web.Mvc;
using FSS.Omnius.Modules.Entitron.Entity;
using FSS.Omnius.Modules.Entitron.Entity.Nexus;
using System.Collections.Generic;
using System;
using FSS.Omnius.Modules.Entitron.Entity.Master;
using System.Web.Helpers;
using FSS.Omnius.Modules.Entitron.Entity.Tapestry;
using FSS.Omnius.Modules.Nexus.Service;
using FSS.Omnius.Modules.CORE;

namespace FSS.Omnius.Controllers.Nexus
{
    [PersonaAuthorize(NeedsAdmin = true, Module = "Nexus")]
    public class TCPSocketController : Controller
    {
        public ActionResult Index()
        {
            DBEntities e = COREobject.i.Context;
            
            ViewData["LdapServersCount"] = e.Ldaps.Count();
            ViewData["WebServicesCount"] = e.WSs.Count();
            ViewData["ExtDatabasesCount"] = e.ExtDBs.Count();
            ViewData["WebDavServersCount"] = e.WebDavServers.Count();
            ViewData["APICount"] = e.APIs.Count();
            ViewData["TCPSocketCount"] = e.TCPListeners.Count();
            ViewData["RabbitMQCount"] = e.RabbitMQs.Count();

            return View(e.TCPListeners.ToList());
        }

        #region configuration methods

        public ActionResult Create()
        {
            DBEntities e = COREobject.i.Context;
            
            List<SelectListItem> appList = new List<SelectListItem>();
            foreach(Application a in e.Applications.OrderBy(a => a.Name)) {
                appList.Add(new SelectListItem() { Value = a.Id.ToString(), Text = a.Name });
            }
            ViewData["ApplicationList"] = appList;

            return View("~/Views/Nexus/TCPSocket/Form.cshtml");
        }

        [HttpPost]
        public ActionResult Save(TCPSocketListener model, int? id)
        {
            DBEntities e = COREobject.i.Context;
            if (ModelState.IsValid)
            {
                // Z�znam ji. existuje - pouze upravujeme
                if (!model.Id.Equals(null))
                {
                    TCPSocketListener row = e.TCPListeners.Single(m => m.Id == model.Id);
                    row.ApplicationId = model.ApplicationId;
                    row.BlockName = model.BlockName;
                    row.WorkflowName = model.WorkflowName;
                    row.Name = model.Name;
                    row.Port = model.Port;
                    row.BufferSize = model.BufferSize;

                    e.SaveChanges();
                }
                else
                {
                    e.TCPListeners.Add(model);
                    e.SaveChanges();
                }

                TCPSocketListenerService.AddListener(model);

                return RedirectToRoute("Nexus", new { @action = "Index" });
            }
            else
            {
                return View("~/Views/Nexus/TCPSocket/Form.cshtml", model);
            }
        }
        
        public ActionResult Edit(int? id)
        {
            DBEntities e = COREobject.i.Context;
            TCPSocketListener model = e.TCPListeners.Single(l => l.Id == id);

            List<SelectListItem> appList = new List<SelectListItem>();
            foreach (Application a in e.Applications.OrderBy(a => a.Name)) {
                appList.Add(new SelectListItem() { Value = a.Id.ToString(), Text = a.Name, Selected = model.ApplicationId == a.Id });
            }
            
            ViewData["ApplicationList"] = appList;
            
            return View("~/Views/Nexus/TCPSocket/Form.cshtml", model);
        }

        public ActionResult Delete(int? id)
        {
            DBEntities e = COREobject.i.Context;
            TCPSocketListener row = e.TCPListeners.Single(l => l.Id == id);

            if (row == null)
                throw new Exception("Do�lo k neo�ek�van� chyb�");

            e.TCPListeners.Remove(row);
            e.SaveChanges(); 

            return RedirectToRoute("Nexus", new { @action = "Index" });
        }
        
        #endregion

        #region tools

        public ActionResult LoadBlockList(int appId, string selectedBlockName)
        {
            DBEntities e = COREobject.i.Context;
            TapestryDesignerMetablock root = e.TapestryDesignerMetablocks.Where(b => b.ParentAppId == appId && b.ParentMetablock_Id == null).FirstOrDefault();

            BlockJsonResponse blockList = LoadFromMetablock(root, 0, selectedBlockName);   
            
            return Json(blockList);
        }

        public ActionResult LoadWorkflowList(string blockName, int appId, string selectedWorkflowName)
        {
            DBEntities e = COREobject.i.Context;
            List<SelectListItem> result = new List<SelectListItem>();

            TapestryDesignerBlock block = e.TapestryDesignerBlocks.Where(b => b.Name == blockName && b.ParentMetablock.ParentAppId == appId).SingleOrDefault();
            if(block != null) {
                foreach(TapestryDesignerWorkflowRule wf in block.BlockCommits.OrderByDescending(c => c.Id).First().WorkflowRules) {
                    foreach(TapestryDesignerSwimlane sl in wf.Swimlanes) {
                        foreach(TapestryDesignerWorkflowItem wi in sl.WorkflowItems.Where(i => i.SymbolType == "circle-event")) {
                            result.Add(new SelectListItem()
                            {
                                Text = wf.Name,
                                Value = wi.Label,
                                Selected = wi.Label == selectedWorkflowName
                            });
                        }
                    }
                }
            }

            return Json(result.OrderBy(i => i.Text).ToList());
        }

        private BlockJsonResponse LoadFromMetablock(TapestryDesignerMetablock parent, int level, string selectedBlockName)
        {
            BlockJsonResponse item = new BlockJsonResponse()
            {
                Name = parent.Name,
                Value = "",
                Selected = false,
                IsMetablock = true,
                Level = level,
                ChildBlocks = new List<BlockJsonResponse>()
            };

            foreach(TapestryDesignerBlock block in parent.Blocks.OrderBy(b => b.Name)) {
                item.ChildBlocks.Add(new BlockJsonResponse()
                {
                    Name = block.Name,
                    Value = block.Name,
                    Selected = block.Name == selectedBlockName,
                    IsMetablock = false,
                    Level = level + 1,
                    ChildBlocks = null
                });
            }
            foreach(TapestryDesignerMetablock mBlock in parent.Metablocks.OrderBy(m => m.Name)) {
                item.ChildBlocks.Add(LoadFromMetablock(mBlock, level + 1, selectedBlockName));
            }
            
            return item;
        }



        #endregion
    }

    class BlockJsonResponse
    {
        public string Name { get; set; }
        public string Value { get; set; }
        public bool Selected { get; set; }
        public bool IsMetablock { get; set; }
        public int Level { get; set; }
        public List<BlockJsonResponse> ChildBlocks { get; set; }
    }
}