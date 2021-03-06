using System.Linq;
using System.Web.Mvc;
using FSS.Omnius.Modules.Entitron.Entity;
using FSS.Omnius.Modules.Entitron.Entity.Hermes;
using System.Collections.Generic;
using System;
using FSS.Omnius.Modules.CORE;

namespace FSS.Omnius.Controllers.Hermes
{
    [PersonaAuthorize(NeedsAdmin = true, Module = "Hermes")]
    public class PlaceholderController : Controller
    {
        // GET: Placeholder list
        public ActionResult Index(int? emailId)
        {
            DBEntities e = COREobject.i.Context;
            EmailTemplate template = e.EmailTemplates.Single(t => t.Id == emailId);

            ViewData["SMTPServersCount"] = e.SMTPs.Count();
            ViewData["EmailTemplatesCount"] = e.EmailTemplates.Count();
            ViewData["EmailQueueCount"] = e.EmailQueueItems.Count();
            ViewData["IncomingEmailCount"] = e.IncomingEmail.Count();
            ViewData["TemplateName"] = template.Name;
            ViewData["emailId"] = template.Id;

            return View(template.PlaceholderList.ToList());
        }

        #region configuration methods

        public ActionResult Create(int? emailId)
        {
            // emailId = id - �patn� identifikuje routu
            ViewData["emailId"] = emailId;

            return View("~/Views/Hermes/Placeholder/Form.cshtml");
        }

        [HttpPost]
        public ActionResult Save(EmailPlaceholder model, int? emailId, int? id)
        {
            if (emailId == null)
                throw new Exception("Do�lo k neo�ek�van� chyb�");

            DBEntities e = COREobject.i.Context;
            if (!ModelState.IsValid && model.Id != 0)
            {
                return View("~/Views/Hermes/Placeholder/Form.cshtml", model);

               
            }
            else
            {
                // Z�znam ji� existuje - pouze upravujeme
                if (!model.Id.Equals(0))
                {
                    EmailPlaceholder row = e.EmailPlaceholders.Single(m => m.Id == model.Id);
                    row.Prop_Name = model.Prop_Name;
                    row.Description = model.Description;

                    e.SaveChanges();
                }
                else
                {
                    model.Hermes_Email_Template_Id = emailId.Value;
                    if (e.EmailPlaceholders.Where(p => p.Hermes_Email_Template_Id == emailId).Count() == 0)
                    {
                        model.Num_Order = 1;
                    }
                    else
                    {
                        model.Num_Order = e.EmailPlaceholders.Where(p => p.Hermes_Email_Template_Id == emailId).OrderByDescending(p => p.Num_Order).First().Num_Order + 1;
                    }

                    e.EmailPlaceholders.Add(model);
                    e.SaveChanges();
                }
                return RedirectToRoute("HermesPlaceholders", new { @action = "Index", @emailId = emailId });
            }
        }
        
        public ActionResult Edit(int? emailId, int? id)
        {
            DBEntities e = COREobject.i.Context;
            ViewData["emailId"] = emailId;

            return View("~/Views/Hermes/Placeholder/Form.cshtml", e.EmailTemplates.Single(t => t.Id == emailId).PlaceholderList.Single(p => p.Id == id));
        }

        public ActionResult Delete(int? emailId, int? id)
        {
            DBEntities e = COREobject.i.Context;
            EmailPlaceholder row = e.EmailTemplates.Single(t => t.Id == emailId).PlaceholderList.Single(p => p.Id == id);

            if (row == null)
                throw new Exception("Do�lo k neo�ek�van� chyb�");

            e.EmailPlaceholders.Remove(row);
            e.SaveChanges(); 

            return RedirectToRoute("HermesPlaceholders", new { @action = "Index", @emailId = emailId });
        }

        public ActionResult ChangeOrder(int? emailId)
        {
            DBEntities e = COREobject.i.Context;
            EmailTemplate template = e.EmailTemplates.Single(t => t.Id == emailId);

            ViewData["emailId"] = template.Id;

            return View("~/Views/Hermes/Placeholder/NumOrder.cshtml", template.PlaceholderList.ToList());
        }

        public ActionResult SaveNumOrder(int? emailId, ICollection<int> ids)
        {
            DBEntities e = COREobject.i.Context;
            List<EmailPlaceholder> list = e.EmailTemplates.Single(t => t.Id == emailId).PlaceholderList.ToList();

            int order = 1;
            foreach(int id in ids)
            {
                EmailPlaceholder row = list.Single(p => p.Id == id);
                if(row == null)
                    throw new Exception("Do�lo k neo�ek�van� chyb�. Prom�nn� nebyla nalezena.");

                row.Num_Order = order;
                order++;
            }

            e.SaveChanges();

            return RedirectToRoute("HermesPlaceholders", new { @action = "Index", @emailId = emailId });
        }

        #endregion

        #region tools


        #endregion
    }
}
