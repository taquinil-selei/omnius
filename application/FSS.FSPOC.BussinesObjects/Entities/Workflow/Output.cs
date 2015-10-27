namespace FSS.FSPOC.BussinesObjects.Entities.Workflow
{
    public class Output
    {
        public int Id { get; set; }
        public int Target { get; set; }
        public int SourceSlot { get; set; }
        public int TargetSlot { get; set; }

        public virtual Activity Activity { get; set; }
    }
}