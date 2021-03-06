using System.Collections.Generic;

namespace FSS.Omnius.Modules.Entitron.Entity.Entitron
{
    public class AjaxTransferDbTable : IEntity
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public List<AjaxTransferDbColumn> Columns { get; set; }
        public List<AjaxTransferDbIndex> Indices { get; set; }

        public AjaxTransferDbTable()
        {
            Columns = new List<AjaxTransferDbColumn>();
            Indices = new List<AjaxTransferDbIndex>();
        }
    }
}