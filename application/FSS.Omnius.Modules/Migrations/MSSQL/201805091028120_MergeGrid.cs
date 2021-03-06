namespace FSS.Omnius.Modules.Migrations.MSSQL
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class MergeGrid : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.Master_Applications", "CssTemplate_Id", "dbo.Mozaic_CssTemplates");
            DropForeignKey("dbo.Tapestry_AttributeRules", "BlockId", "dbo.Tapestry_Blocks");
            DropForeignKey("dbo.Mozaic_CssPages", "CssId", "dbo.Mozaic_Css");
            DropForeignKey("dbo.Mozaic_CssPages", "PageId", "dbo.Mozaic_Pages");
            DropForeignKey("dbo.Tapestry_PreBlockActions", "BlockId", "dbo.Tapestry_Blocks");
            DropForeignKey("dbo.Mozaic_TemplateCategories", "ParentId", "dbo.Mozaic_TemplateCategories");
            DropForeignKey("dbo.Mozaic_Template", "CategoryId", "dbo.Mozaic_TemplateCategories");
            DropIndex("dbo.Master_Applications", new[] { "CssTemplate_Id" });
            DropIndex("dbo.Hermes_Email_Template", "HermesUniqueness");
            DropIndex("dbo.Hermes_Email_Template_Content", new[] { "Hermes_Email_Template_Id" });
            DropIndex("dbo.Hermes_Email_Placeholder", new[] { "Hermes_Email_Template_Id" });
            DropIndex("dbo.Tapestry_AttributeRules", new[] { "BlockId" });
            DropIndex("dbo.Tapestry_PreBlockActions", new[] { "BlockId" });
            DropIndex("dbo.Hermes_Email_Queue", new[] { "ApplicationId" });
            DropIndex("dbo.Mozaic_TemplateCategories", new[] { "ParentId" });
            DropIndex("dbo.Mozaic_Template", new[] { "CategoryId" });
            DropIndex("dbo.Mozaic_CssPages", new[] { "CssId" });
            DropIndex("dbo.Mozaic_CssPages", new[] { "PageId" });
            RenameColumn(table: "dbo.Entitron_DbSchemeCommit", name: "Application_Id", newName: "ApplicationId");
            RenameIndex(table: "dbo.Entitron_DbSchemeCommit", name: "IX_Application_Id", newName: "IX_ApplicationId");
            AlterColumn("dbo.Hermes_Email_Template", "AppId", c => c.Int(nullable: false));
            AlterColumn("dbo.Hermes_Email_Template_Content", "Hermes_Email_Template_Id", c => c.Int(nullable: false));
            AlterColumn("dbo.Hermes_Email_Placeholder", "Hermes_Email_Template_Id", c => c.Int(nullable: false));
            AlterColumn("dbo.Hermes_Email_Queue", "ApplicationId", c => c.Int(nullable: false));
            CreateIndex("dbo.Hermes_Email_Template", new[] { "AppId", "Name" }, unique: true, name: "HermesUniqueness");
            CreateIndex("dbo.Hermes_Email_Template_Content", "Hermes_Email_Template_Id");
            CreateIndex("dbo.Hermes_Email_Placeholder", "Hermes_Email_Template_Id");
            CreateIndex("dbo.Hermes_Email_Queue", "ApplicationId");
            DropColumn("dbo.Master_Applications", "CssTemplate_Id");
            DropTable("dbo.Mozaic_CssTemplates");
            DropTable("dbo.Tapestry_AttributeRules");
            DropTable("dbo.Mozaic_Css");
            DropTable("dbo.Tapestry_PreBlockActions");
            DropTable("dbo.Tapestry_ActionSequences");
            DropTable("dbo.Mozaic_TemplateCategories");
            DropTable("dbo.Mozaic_Template");
            DropTable("dbo.Mozaic_CssPages");
        }
        
        public override void Down()
        {
            CreateTable(
                "dbo.Mozaic_CssPages",
                c => new
                    {
                        CssId = c.Int(nullable: false),
                        PageId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.CssId, t.PageId });
            
            CreateTable(
                "dbo.Mozaic_Template",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 50),
                        Html = c.String(nullable: false),
                        CategoryId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Mozaic_TemplateCategories",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 50),
                        ParentId = c.Int(),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Tapestry_ActionSequences",
                c => new
                    {
                        Id = c.Int(nullable: false),
                        ChildId = c.Int(nullable: false),
                        Order = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.Id, t.ChildId });
            
            CreateTable(
                "dbo.Tapestry_PreBlockActions",
                c => new
                    {
                        BlockId = c.Int(nullable: false),
                        ActionId = c.Int(nullable: false),
                        Order = c.Int(nullable: false),
                        InputVariablesMapping = c.String(maxLength: 200),
                        OutputVariablesMapping = c.String(maxLength: 200),
                    })
                .PrimaryKey(t => new { t.BlockId, t.ActionId });
            
            CreateTable(
                "dbo.Mozaic_Css",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 50),
                        Value = c.String(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Tapestry_AttributeRules",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        InputName = c.String(nullable: false, maxLength: 50),
                        AttributeName = c.String(nullable: false, maxLength: 50),
                        AttributeDataTypeId = c.Int(nullable: false),
                        BlockId = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Mozaic_CssTemplates",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(),
                        Url = c.String(),
                    })
                .PrimaryKey(t => t.Id);
            
            AddColumn("dbo.Master_Applications", "CssTemplate_Id", c => c.Int());
            DropIndex("dbo.Hermes_Email_Queue", new[] { "ApplicationId" });
            DropIndex("dbo.Hermes_Email_Placeholder", new[] { "Hermes_Email_Template_Id" });
            DropIndex("dbo.Hermes_Email_Template_Content", new[] { "Hermes_Email_Template_Id" });
            DropIndex("dbo.Hermes_Email_Template", "HermesUniqueness");
            AlterColumn("dbo.Hermes_Email_Queue", "ApplicationId", c => c.Int());
            AlterColumn("dbo.Hermes_Email_Placeholder", "Hermes_Email_Template_Id", c => c.Int());
            AlterColumn("dbo.Hermes_Email_Template_Content", "Hermes_Email_Template_Id", c => c.Int());
            AlterColumn("dbo.Hermes_Email_Template", "AppId", c => c.Int());
            RenameIndex(table: "dbo.Entitron_DbSchemeCommit", name: "IX_ApplicationId", newName: "IX_Application_Id");
            RenameColumn(table: "dbo.Entitron_DbSchemeCommit", name: "ApplicationId", newName: "Application_Id");
            CreateIndex("dbo.Mozaic_CssPages", "PageId");
            CreateIndex("dbo.Mozaic_CssPages", "CssId");
            CreateIndex("dbo.Mozaic_Template", "CategoryId");
            CreateIndex("dbo.Mozaic_TemplateCategories", "ParentId");
            CreateIndex("dbo.Hermes_Email_Queue", "ApplicationId");
            CreateIndex("dbo.Tapestry_PreBlockActions", "BlockId");
            CreateIndex("dbo.Tapestry_AttributeRules", "BlockId");
            CreateIndex("dbo.Hermes_Email_Placeholder", "Hermes_Email_Template_Id");
            CreateIndex("dbo.Hermes_Email_Template_Content", "Hermes_Email_Template_Id");
            CreateIndex("dbo.Hermes_Email_Template", new[] { "AppId", "Name" }, unique: true, name: "HermesUniqueness");
            CreateIndex("dbo.Master_Applications", "CssTemplate_Id");
            AddForeignKey("dbo.Mozaic_Template", "CategoryId", "dbo.Mozaic_TemplateCategories", "Id");
            AddForeignKey("dbo.Mozaic_TemplateCategories", "ParentId", "dbo.Mozaic_TemplateCategories", "Id");
            AddForeignKey("dbo.Tapestry_PreBlockActions", "BlockId", "dbo.Tapestry_Blocks", "Id");
            AddForeignKey("dbo.Mozaic_CssPages", "PageId", "dbo.Mozaic_Pages", "Id");
            AddForeignKey("dbo.Mozaic_CssPages", "CssId", "dbo.Mozaic_Css", "Id");
            AddForeignKey("dbo.Tapestry_AttributeRules", "BlockId", "dbo.Tapestry_Blocks", "Id");
            AddForeignKey("dbo.Master_Applications", "CssTemplate_Id", "dbo.Mozaic_CssTemplates", "Id");
        }
    }
}
