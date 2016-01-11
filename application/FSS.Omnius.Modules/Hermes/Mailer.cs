﻿using FSS.Omnius.Modules.Entitron.Entity;
using FSS.Omnius.Modules.Entitron.Entity.Hermes;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Net.Mail;
using System.Text;
using System.Web.Mvc.Html;
using FSS.Omnius.Modules.Watchtower;
using Newtonsoft.Json;
using System.Web.Mvc;

namespace FSS.Omnius.Modules.Hermes
{
    public class Mailer
    {
        private Smtp server;
        private DBEntities e;
        private List<EmailPlaceholder> plcs;
        private Object data;
        private SmtpClient client;

        public MailMessage mail;

        public Mailer(string serverName = "")
        {
            Init(serverName);
        }

        public Mailer(string serverName, string templateName, Object model)
        {
            Init(serverName);
            Prepare(templateName, model);
        }

        private void Init(string serverName = "")
        {
            e = new DBEntities();

            if (string.IsNullOrEmpty(serverName))
            {
                server = e.SMTPs.Single(s => s.Is_Default == true);
            }
            else {
                server = e.SMTPs.Single(s => s.Name == serverName || s.Server == serverName);
            }

            client = new SmtpClient();
            client.Port = server.Use_SSL ? 465 : 25;
            client.EnableSsl = server.Use_SSL;
            client.DeliveryMethod = SmtpDeliveryMethod.Network;
            client.Host = server.Server;
            client.Timeout = 10000;

            if(!string.IsNullOrWhiteSpace(server.Auth_User) && !string.IsNullOrWhiteSpace(server.Auth_Password))
            {
                client.UseDefaultCredentials = false;
                client.Credentials = new System.Net.NetworkCredential(server.Auth_User, server.Auth_Password);
            }
        }

        public void Prepare(string templateName, Object model)
        {
            data = model;

            EmailTemplate template = e.EmailTemplates.Single(t => t.Name == templateName);
            plcs = template.PlaceholderList.ToList();
            EmailTemplateContent contentModel = template.ContentList.Single(t => t.LanguageId == 1);

            string subject = SetData(contentModel.Subject);
            string content = SetData(contentModel.Content);

            mail = new MailMessage();
            mail.BodyEncoding = UTF8Encoding.UTF8;
            mail.DeliveryNotificationOptions = DeliveryNotificationOptions.OnFailure;

            if (!string.IsNullOrWhiteSpace(contentModel.From_Email))
                mail.From = new MailAddress(contentModel.From_Email, contentModel.From_Name);

            if (!string.IsNullOrWhiteSpace(subject))
                mail.Subject = subject;

            if (!string.IsNullOrWhiteSpace(content))
                mail.Body = content;

            if (template.Is_HTML)
                mail.IsBodyHtml = true;
        }

        public string SetData(string content)
        {
            Regex regExpList = new Regex("^\\{list\\.([^\\}]+)}$");

            foreach (EmailPlaceholder p in plcs)
            {
                string key = "{" + p.Prop_Name + "}";
                if (regExpList.IsMatch(key))
                {
                    Match m = regExpList.Match(key);
                    ParseList(ref content, p.Prop_Name, m.Groups[1].ToString(), GetValue(data, m.Groups[1].ToString()));
                }
                else
                {
                    object value = GetValue(data, p.Prop_Name);
                    content = content.Replace(key, value == null ? string.Empty : value.ToString());
                }
            }

            return content;
        }

        public void SendMail(int? applicationId = null)
        {
            client.Send(mail);
            client.Dispose();

            // Uložíme do logu
            EmailLog log = new EmailLog();
            log.Content = JsonConvert.SerializeObject(mail);

            e.EmailLogItems.Add(log);
            e.SaveChanges(); 

            WatchtowerLogger logger = WatchtowerLogger.Instance;
            logger.LogEvent(
                string.Format("Odeslání e-mailu \"{0}\" (<a href=\"{1}\" title=\"Detail e-mailu\">detail e-mailu</a>)", mail.Subject, "/Hermes/Log/Detail/" + log.Id + "/"),
                1, // !!! POZOR !!!
                LogEventType.EmailSent,
                LogLevel.Info,
                applicationId == null ? true : false,
                applicationId
            );
        }

        #region Mail Tools

        public void From(string email, string displayName = "")
        {
            mail.From = new MailAddress(email, displayName);
        }

        public void To(string email, string displayName = "")
        {
            mail.To.Clear();
            mail.To.Add(new MailAddress(email, displayName));
        }

        public void To(Dictionary<string,string>addressList)
        {
            mail.To.Clear();
            foreach(KeyValuePair<string, string> addr in addressList)
            {
                mail.To.Add(new MailAddress(addr.Key, addr.Value));
            }
        }

        public void CC (string email, string displayName = "")
        {
            mail.CC.Clear();
            mail.CC.Add(new MailAddress(email, displayName));
        }

        public void CC (Dictionary<string,string> addressList)
        {
            mail.CC.Clear();
            foreach(KeyValuePair<string, string> addr in addressList)
            {
                mail.CC.Add(new MailAddress(addr.Key, addr.Value));
            }
        }

        public void BCC(string email, string displayName = "")
        {
            mail.Bcc.Clear();
            mail.Bcc.Add(new MailAddress(email, displayName));
        }

        public void BCC(Dictionary<string, string> addressList)
        {
            mail.Bcc.Clear();
            foreach (KeyValuePair<string, string> addr in addressList)
            {
                mail.Bcc.Add(new MailAddress(addr.Key, addr.Value));
            }
        }

        public void AddTo(string email, string displayName = "") { mail.To.Add(new MailAddress(email, displayName)); }
        public void AddCC(string email, string displayName = "") { mail.CC.Add(new MailAddress(email, displayName)); }
        public void AddBCC(string email, string displayName = "") { mail.Bcc.Add(new MailAddress(email, displayName)); }

        public void Subject(string subject) { mail.Subject = subject; }

        #endregion


        #region Tools

        private void ParseList(ref string content, string listKey, string objectKey, object model)
        {
            Regex regExpList = new Regex("(\\{" + listKey + "\\}(.*?)\\{end." + listKey + "\\})", RegexOptions.Singleline);
            MatchCollection lists = regExpList.Matches(content);

            foreach (Match list in lists)
            {
                string template = list.Groups[2].ToString();
                List<string> items = new List<string>();

                foreach(var item in (IEnumerable)model)
                {
                    string text = template;
                    foreach (EmailPlaceholder p in plcs)
                    {
                        if(p.Prop_Name.StartsWith(objectKey))
                        {
                            string propName = p.Prop_Name.Replace(objectKey + ".", "");
                            object value = GetValue(item, propName);
                            text = text.Replace("{" + p.Prop_Name + "}", value == null ? string.Empty : value.ToString());    
                        } 
                    }
                    items.Add(text);
                }

                content = content.Replace(list.Groups[1].ToString(), String.Join("", items));
            }
        }

        private object GetValue(object model, string propName)
        {
            if(model is IDictionary)
            {
                return ((IDictionary)model)[propName] as object;
            }
            else
            {
                return model.GetType().GetProperty(propName).GetValue(model) as object;
            }
        }

        #endregion
    }
}
