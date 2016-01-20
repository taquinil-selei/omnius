namespace FSS.Omnius.Modules.Entitron.Entity.Tapestry
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("Tapestry_AttributeRules")]
    public partial class AttributeRule
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string InputName { get; set; }

        [Required]
        [StringLength(50)]
        public string AttributeName { get; set; }
        
        [Required]
        public int AttributeDataTypeId { get; set; }

        public int BlockId { get; set; }

        public virtual CORE.DataType AttributeDataType { get; set; }
        public virtual Block Block { get; set; }
    }
}
