using System.ComponentModel.DataAnnotations.Schema;

namespace FSS.Omnius.Modules.Entitron.Entity.Tapestry
{
    [Table("Tapestry_Output")]
    public class Output
    {
        public int Id { get; set; }
        public int Target { get; set; }
        public int SourceSlot { get; set; }
        public int TargetSlot { get; set; }

        public virtual Activity Activity { get; set; }
    }
}