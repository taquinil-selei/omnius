namespace FSS.Omnius.Modules.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class hermesappid3 : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.Master_Applications", "EmailTemplate_Id", "dbo.Hermes_Email_Template");
            DropIndex("dbo.Master_Applications", new[] { "EmailTemplate_Id" });
            DropColumn("dbo.Master_Applications", "EmailTemplate_Id");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Master_Applications", "EmailTemplate_Id", c => c.Int());
            CreateIndex("dbo.Master_Applications", "EmailTemplate_Id");
            AddForeignKey("dbo.Master_Applications", "EmailTemplate_Id", "dbo.Hermes_Email_Template", "Id");
        }
    }
}
