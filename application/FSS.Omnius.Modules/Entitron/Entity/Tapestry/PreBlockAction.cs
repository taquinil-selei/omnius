﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FSS.Omnius.Modules.Entitron.Entity.Tapestry
{
    [Table("Tapestry_PreBlockActions")]
    public partial class PreBlockAction : IEntity
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int BlockId { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ActionId { get; set; }

        public int Order { get; set; }

        /// <summary>
        /// Target1=source1;target2=source2
        /// pro vstup dat uvozovky - Target1=s$nějaký text
        /// s - string
        /// b - boolean
        /// i - int
        /// d - double
        /// </summary>
        [StringLength(200)]
        public string InputVariablesMapping { get; set; } // target=source;c=d

        [StringLength(200)]
        public string OutputVariablesMapping { get; set; } // target=source;c=d

        public virtual Block Block { get; set; }
    }
}
