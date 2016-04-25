using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations.Schema;

namespace FSS.Omnius.Modules.Entitron.Entity.Entitron
{
    [Table("Entitron_DbColumn")]
    public class DbColumn : IEntity
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string DisplayName { get; set; }
        public bool PrimaryKey { get; set; }
        public bool Unique { get; set; }
        public bool AllowNull { get; set; }
        public string Type { get; set; }
        public int ColumnLength { get; set; }
        public bool ColumnLengthIsMax { get; set; }
        public string DefaultValue { get; set; }

        [JsonIgnore]
        public int DbTableId { get; set; }
        [JsonIgnore]
        public virtual DbTable DbTable { get; set; }
    }
}