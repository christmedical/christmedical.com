using System.Diagnostics;
using EtlTool.Logging;
using Microsoft.Extensions.Logging;

namespace EtlTool.Services;

/// <summary>
/// Stage 0 — Runs Extract_Access_DB.sh to export the Access database to CSV files
/// and regenerate the V2 staging schema SQL.
/// The shell script handles all mdbtools calls; we own process lifecycle and logging.
/// </summary>
public class ExtractionService
{
    private readonly string _scriptPath;
    private readonly string _repoRoot;
    private readonly ILogger<ExtractionService> _logger;

    public ExtractionService(string repoRoot, string scriptRelativePath, ILogger<ExtractionService> logger)
    {
        _repoRoot   = repoRoot;
        _scriptPath = Path.GetFullPath(Path.Combine(repoRoot, scriptRelativePath));
        _logger     = logger;
    }

    public async Task RunAsync(EtlProgress? progress = null, CancellationToken ct = default)
    {
        EnsureMdbToolsInstalled();

        if (!File.Exists(_scriptPath))
            throw new FileNotFoundException($"Extract script not found: {_scriptPath}");

        _logger.LogInformation("Running extract script: {Script}", _scriptPath);
        progress?.BeginStep("Extracting Access DB ...  ", 1);

        var psi = new ProcessStartInfo("bash", $"\"{_scriptPath}\"")
        {
            WorkingDirectory       = _repoRoot,
            RedirectStandardOutput = true,
            RedirectStandardError  = true,
            UseShellExecute        = false,
        };

        using var proc = Process.Start(psi)
            ?? throw new InvalidOperationException("Failed to start extract script process.");

        // Stream both stdout and stderr to the log file (not console).
        proc.OutputDataReceived += (_, e) =>
        {
            if (e.Data is not null) _logger.LogInformation("[extract] {Line}", e.Data);
        };
        proc.ErrorDataReceived += (_, e) =>
        {
            if (e.Data is not null) _logger.LogWarning("[extract] {Line}", e.Data);
        };
        proc.BeginOutputReadLine();
        proc.BeginErrorReadLine();

        await proc.WaitForExitAsync(ct);

        if (proc.ExitCode != 0)
            throw new Exception($"Extract script exited with code {proc.ExitCode}. Check the log for details.");

        progress?.StepDone("CSV files and staging schema generated.");
        _logger.LogInformation("Extraction complete — exit code 0.");
    }

    // -------------------------------------------------------------------------
    // Preflight check
    // -------------------------------------------------------------------------

    private static void EnsureMdbToolsInstalled()
    {
        foreach (var tool in new[] { "mdb-schema", "mdb-tables", "mdb-export" })
        {
            using var which = Process.Start(new ProcessStartInfo("which", tool)
            {
                RedirectStandardOutput = true,
                UseShellExecute        = false,
            });

            which?.WaitForExit();
            if (which?.ExitCode != 0)
                throw new Exception(
                    $"mdbtools is not installed or '{tool}' is not in PATH.\n" +
                    $"  macOS:  brew install mdbtools\n" +
                    $"  Linux:  sudo apt install mdbtools");
        }
    }
}
