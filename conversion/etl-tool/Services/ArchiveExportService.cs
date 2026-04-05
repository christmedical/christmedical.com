using EtlTool.Configuration;
using EtlTool.Utilities;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EtlTool.Services;

/// <summary>
/// Portable tenant archive: <c>data/*.csv</c> use UTF-8 and <b>¦</b> (U+00A6) as the field delimiter.
/// PostgreSQL <c>COPY</c> only accepts a single-byte delimiter, so host <c>import_*.sh</c> runs
/// <c>convert_archive_csv_for_pg.py</c> to emit TAB-delimited CSV into a temp dir before <c>\copy</c>.
/// </summary>
public sealed class ArchiveExportService
{
    /// <summary>Broken bar — field delimiter in archive <c>data/*.csv</c> (per deployment spec).</summary>
    public const char ArchiveFieldDelimiter = '\u00a6';

    private readonly string _connectionString;
    private readonly ILogger<ArchiveExportService> _logger;

    public ArchiveExportService(string connectionString, ILogger<ArchiveExportService> logger)
    {
        _connectionString = connectionString;
        _logger           = logger;
    }

    public async Task WriteArchiveAsync(
        ConversionOptions options,
        string v1SqlPath,
        string archiveParentDirectory,
        string converterScriptSourcePath,
        CancellationToken ct)
    {
        var snake = TenantNaming.ToSnakeCaseFolder(options.TenantName);
        var root  = Path.Combine(archiveParentDirectory, snake);
        var nest  = Path.Combine(root,  snake);
        var data  = Path.Combine(nest,  "data");

        Directory.CreateDirectory(data);

        _logger.LogInformation("Writing archive to {Root}", root);

        var schemaBody = await File.ReadAllTextAsync(v1SqlPath, ct);
        var extensions = """

            -- ETL extensions (legacy linkage + phones + BP split columns)
            ALTER TABLE public.patients
                ADD COLUMN IF NOT EXISTS legacy_id    VARCHAR(50),
                ADD COLUMN IF NOT EXISTS home_phone   VARCHAR(30),
                ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(30);

            ALTER TABLE public.visits
                ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(50);

            ALTER TABLE public.vitals_core
                ADD COLUMN IF NOT EXISTS systolic  SMALLINT,
                ADD COLUMN IF NOT EXISTS diastolic SMALLINT;
            """;

        await File.WriteAllTextAsync(Path.Combine(nest, "schema.sql"), schemaBody + extensions, ct);

        foreach (var dest in new[]
                 {
                     Path.Combine(root, "convert_archive_csv_for_pg.py"),
                     Path.Combine(nest, "convert_archive_csv_for_pg.py"),
                 })
            File.Copy(converterScriptSourcePath, dest, overwrite: true);

        var tid = (short)options.TenantId;
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        await ExportQueryToCsvAsync(conn, tid, Path.Combine(data, "patients.csv"), """
            SELECT id, tenant_id, display_id, first_name, last_name, dob, calculated_age,
                   gender, marital_status, gov_id, next_of_kin_id, medical_history,
                   surgical_history, family_history, drug_allergies, smoke, alcohol, hope_gospel,
                   device_id, client_updated_at, server_restored_at, is_deleted,
                   legacy_id, home_phone, mobile_phone
            FROM public.patients WHERE tenant_id = @tid
            """, ct);

        await ExportQueryToCsvAsync(conn, tid, Path.Combine(data, "visits.csv"), """
            SELECT id, tenant_id, legacy_id, trip_id, patient_id, visit_date, location_name,
                   chief_complaint, diagnosis_text, referral_notes,
                   device_id, client_updated_at, server_restored_at, is_deleted
            FROM public.visits WHERE tenant_id = @tid
            """, ct);

        await ExportQueryToCsvAsync(conn, tid, Path.Combine(data, "vitals_core.csv"), """
            SELECT id, tenant_id, visit_id, weight, height, pulse, bp, systolic, diastolic,
                   resp, temp_f, oxygen_sat, glucose, hemoglobin,
                   device_id, client_updated_at, server_restored_at, is_deleted
            FROM public.vitals_core WHERE tenant_id = @tid
            """, ct);

        await ExportQueryToCsvAsync(conn, tid, Path.Combine(data, "lab_results.csv"), """
            SELECT id, tenant_id, visit_id, test_name, result_value,
                   device_id, client_updated_at, server_restored_at, is_deleted
            FROM public.lab_results WHERE tenant_id = @tid
            """, ct);

        var safeName = options.TenantName.Replace("'", "'\\''", StringComparison.Ordinal);
        var csEsc    = _connectionString.Replace("'", "'\\''", StringComparison.Ordinal);
        await File.WriteAllTextAsync(Path.Combine(root, ".env"), $"""
            TENANT_NAME='{safeName}'
            TENANT_ID={options.TenantId}
            TENANT_FOLDER_SNAKE={snake}
            DB_CONNECTION_STRING='{csEsc}'
            """, ct);

        // Guard + schema only — row loads happen from import_copy.sql generated by import_*.sh
        var importSql = $"""
            -- Christ Medical — tenant import ({options.TenantName})
            -- data/{snake}/data/*.csv use UTF-8 + ¦ delimiter; import_*.sh converts to TAB for \\copy.

            \echo 'Guard: checking for existing public.patients rows...'
            DO $g$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE  table_schema = 'public' AND table_name = 'patients'
                ) AND EXISTS (SELECT 1 FROM public.patients LIMIT 1) THEN
                    RAISE NOTICE 'Guard tripped: resetting public schema.';
                    DROP SCHEMA public CASCADE;
                    CREATE SCHEMA public;
                    GRANT ALL ON SCHEMA public TO public;
                END IF;
            END
            $g$;

            \echo 'Applying schema...'
            \i {snake}/schema.sql

            \echo 'Schema applied — run COPY step (import_*.sh generates import_copy.sql).'
            """;

        await File.WriteAllTextAsync(Path.Combine(root, "import.sql"), importSql, ct);

        var shName = $"import_{snake}.sh";
        var shellScript = """
            #!/usr/bin/env bash
            set -euo pipefail
            ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
            set -a
            # shellcheck source=/dev/null
            source "$ROOT/.env"
            set +a
            : "${TENANT_FOLDER_SNAKE:?missing TENANT_FOLDER_SNAKE in .env}"
            if [ -t 0 ] && [ "${SKIP_IMPORT_CONFIRM:-}" != "1" ]; then
              read -r -p "Import may DROP SCHEMA public if patients already exist. Continue? [y/N] " _confirm || true
              case "${_confirm:-}" in y|Y|yes|YES) ;; *) echo "Aborted."; exit 1;; esac
            fi
            command -v python3 >/dev/null 2>&1 || { echo "python3 is required to convert ¦ CSV to TAB for PostgreSQL."; exit 1; }
            PG_COPY_DIR="$(mktemp -d)"
            trap 'rm -rf "$PG_COPY_DIR"' EXIT
            python3 "$ROOT/convert_archive_csv_for_pg.py" "$ROOT/${TENANT_FOLDER_SNAKE}/data" "$PG_COPY_DIR"
            export PGOPTIONS='-c client_encoding=UTF8'
            cd "$ROOT"
            psql "$DB_CONNECTION_STRING" -v ON_ERROR_STOP=1 -f "$ROOT/import.sql"
            cat > "$ROOT/import_copy.sql" <<SQL
            SET client_encoding = 'UTF8';
            \\copy public.patients (id, tenant_id, display_id, first_name, last_name, dob, calculated_age, gender, marital_status, gov_id, next_of_kin_id, medical_history, surgical_history, family_history, drug_allergies, smoke, alcohol, hope_gospel, device_id, client_updated_at, server_restored_at, is_deleted, legacy_id, home_phone, mobile_phone) FROM '$PG_COPY_DIR/patients.csv' WITH (FORMAT csv, HEADER true, DELIMITER E'\\t', ENCODING 'UTF8');
            \\copy public.visits (id, tenant_id, legacy_id, trip_id, patient_id, visit_date, location_name, chief_complaint, diagnosis_text, referral_notes, device_id, client_updated_at, server_restored_at, is_deleted) FROM '$PG_COPY_DIR/visits.csv' WITH (FORMAT csv, HEADER true, DELIMITER E'\\t', ENCODING 'UTF8');
            \\copy public.vitals_core (id, tenant_id, visit_id, weight, height, pulse, bp, systolic, diastolic, resp, temp_f, oxygen_sat, glucose, hemoglobin, device_id, client_updated_at, server_restored_at, is_deleted) FROM '$PG_COPY_DIR/vitals_core.csv' WITH (FORMAT csv, HEADER true, DELIMITER E'\\t', ENCODING 'UTF8');
            \\copy public.lab_results (id, tenant_id, visit_id, test_name, result_value, device_id, client_updated_at, server_restored_at, is_deleted) FROM '$PG_COPY_DIR/lab_results.csv' WITH (FORMAT csv, HEADER true, DELIMITER E'\\t', ENCODING 'UTF8');
            SQL
            psql "$DB_CONNECTION_STRING" -v ON_ERROR_STOP=1 -f "$ROOT/import_copy.sql"
            rm -f "$ROOT/import_copy.sql"
            echo "Import complete."
            """;
        shellScript = string.Join(Environment.NewLine,
            shellScript.Split('\n').Select(l => l.TrimStart(' ', '\t')));
        await File.WriteAllTextAsync(Path.Combine(root, shName), shellScript.TrimStart(), ct);

        TryChmodX(Path.Combine(root, shName));
        TryChmodX(Path.Combine(root, "convert_archive_csv_for_pg.py"));

        var seedSql = """
            SET client_encoding = 'UTF8';
            \copy public.patients (id, tenant_id, display_id, first_name, last_name, dob, calculated_age, gender, marital_status, gov_id, next_of_kin_id, medical_history, surgical_history, family_history, drug_allergies, smoke, alcohol, hope_gospel, device_id, client_updated_at, server_restored_at, is_deleted, legacy_id, home_phone, mobile_phone) FROM '/seed/patients.csv' WITH (FORMAT csv, HEADER true, DELIMITER E'\t', ENCODING 'UTF8');
            \copy public.visits (id, tenant_id, legacy_id, trip_id, patient_id, visit_date, location_name, chief_complaint, diagnosis_text, referral_notes, device_id, client_updated_at, server_restored_at, is_deleted) FROM '/seed/visits.csv' WITH (FORMAT csv, HEADER true, DELIMITER E'\t', ENCODING 'UTF8');
            \copy public.vitals_core (id, tenant_id, visit_id, weight, height, pulse, bp, systolic, diastolic, resp, temp_f, oxygen_sat, glucose, hemoglobin, device_id, client_updated_at, server_restored_at, is_deleted) FROM '/seed/vitals_core.csv' WITH (FORMAT csv, HEADER true, DELIMITER E'\t', ENCODING 'UTF8');
            \copy public.lab_results (id, tenant_id, visit_id, test_name, result_value, device_id, client_updated_at, server_restored_at, is_deleted) FROM '/seed/lab_results.csv' WITH (FORMAT csv, HEADER true, DELIMITER E'\t', ENCODING 'UTF8');
            """;

        await File.WriteAllTextAsync(Path.Combine(nest, "docker-seed.sql"), seedSql, ct);

        var dockerfile = """
            FROM postgres:16-alpine
            RUN apk add --no-cache python3
            ENV POSTGRES_DB=christ_medical
            COPY schema.sql /docker-entrypoint-initdb.d/10-schema.sql
            COPY convert_archive_csv_for_pg.py /tmp/convert_archive_csv_for_pg.py
            COPY data /tmp/data_pipe
            RUN python3 /tmp/convert_archive_csv_for_pg.py /tmp/data_pipe /seed
            COPY docker-seed.sql /docker-entrypoint-initdb.d/20-seed.sql
            """;

        await File.WriteAllTextAsync(Path.Combine(nest, "Dockerfile"), dockerfile, ct);

        await File.WriteAllTextAsync(Path.Combine(root, "README.txt"), $"""
            Christ Medical — conversion archive ({options.TenantName})
            Folder key: {snake}

            data/{snake}/data/*.csv — UTF-8, field delimiter ¦ (U+00A6, broken bar).

            Host import:
              1. Edit .env (DB_CONNECTION_STRING, etc.).
              2. Ensure python3 is installed.
              3. Run: ./{shName}
                 (optional: SKIP_IMPORT_CONFIRM=1 to skip the guard prompt)

            Nested Docker image builds TAB /seed/*.csv from ¦ CSV at build time.

              docker build -t christmedical-{snake}-db ./{snake}
              docker run -e POSTGRES_PASSWORD=secret -p 5432:5432 christmedical-{snake}-db
            """, ct);

        _logger.LogInformation("Archive ready: {Root}", root);
    }

    private static async Task ExportQueryToCsvAsync(
        NpgsqlConnection conn,
        short tenantId,
        string filePath,
        string sql,
        CancellationToken ct)
    {
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("tid", tenantId);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        await using var writer = new StreamWriter(filePath, false, new System.Text.UTF8Encoding(false));

        var headers = new object?[reader.FieldCount];
        for (int i = 0; i < reader.FieldCount; i++)
            headers[i] = reader.GetName(i);
        await ArchiveCsv.WriteRowAsync(writer, headers, ArchiveFieldDelimiter, ct);

        while (await reader.ReadAsync(ct))
        {
            var values = new object?[reader.FieldCount];
            for (int i = 0; i < reader.FieldCount; i++)
                values[i] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            await ArchiveCsv.WriteRowAsync(writer, values, ArchiveFieldDelimiter, ct);
        }
    }

    private static void TryChmodX(string path)
    {
        try
        {
            if (OperatingSystem.IsLinux() || OperatingSystem.IsMacOS())
                File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
        }
        catch
        {
            /* best-effort */
        }
    }
}
