class Patient
{
    public Guid Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string DisplayId { get; set; } // e.g. LOC-TRIP-MACH-SYNC#

    // Sync Metadata
    public string DeviceId { get; set; } // e.g. "MIGRATION_ENV"
    public DateTime ClientUpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}
