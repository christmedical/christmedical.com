var rawData = await stagingDb.Patients
    .Where(p => p.FirstName != null) // Filter out junk
    .Take(2000)
    .ToListAsync();

var demoData = rawData.Select(p => scrubber.Obfuscate(p)).ToList();

// Save to Prod DB or export to a CSV for your GitHub repo
productionDb.Patients.AddRange(demoData);

await productionDb.SaveChangesAsync();


// Example Mapping Loop
// var legacyPatients = await stagingDb.Patients.ToListAsync();

// foreach (var oldPt in legacyPatients)
// {
//     var newPatient = new Patient
//     {
//         Id = Guid.NewGuid(), // NEW UUID
//         FirstName = oldPt.FirstName,
//         LastName = oldPt.LastName,
//         DisplayId = GenerateDisplayId(oldPt), // Logic for Loc-Trip-Mach-Sync#

//         // Sync Metadata
//         DeviceId = "MIGRATION_ENV",
//         ClientUpdatedAt = oldPt.PtUpdatedOn ?? DateTime.UtcNow,
//         IsDeleted = false
//     };

//     productionDb.Patients.Add(newPatient);
// }

// await productionDb.SaveChangesAsync();