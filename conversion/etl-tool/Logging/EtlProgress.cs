namespace EtlTool.Logging;

/// <summary>
/// Manages the minimal console UI: stage headers and an in-place percentage line.
/// All detailed diagnostics go to the log file via ILogger — this class is purely
/// for the human reading the terminal.
/// </summary>
public sealed class EtlProgress
{
    private int _total;
    private int _current;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /// Prints a timestamped stage header (e.g. "[10:32:05] Stage 1: Patient Migration").
    public void BeginStage(string title)
    {
        Console.WriteLine($"\n[{DateTime.Now:HH:mm:ss}] {title}");
    }

    /// Records the step label and total item count, then renders the initial 0% line.
    public void BeginStep(string label, int total)
    {
        _total = total;
        _current = 0;
        Console.Write($"  {label}");
        Render();
    }

    /// Increments the processed count by <paramref name="by"/> and refreshes the line.
    public void Advance(int by = 1)
    {
        _current = Math.Min(_current + by, _total);
        Render();
    }

    /// Snaps to 100%, ends the progress line, and prints an optional summary beneath it.
    public void StepDone(string? summary = null)
    {
        _current = _total;
        Render();
        Console.WriteLine();
        if (summary is not null)
            Console.WriteLine($"    {summary}");
    }

    /// Prints a fatal error in red to stderr. Mirrors what the logger writes to the log file.
    public static void Fatal(string message)
    {
        Console.Error.WriteLine();
        ConsoleColor prev = Console.ForegroundColor;
        Console.ForegroundColor = ConsoleColor.Red;
        Console.Error.WriteLine($"  [FATAL] {message}");
        Console.ForegroundColor = prev;
    }

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    private void Render()
    {
        int pct = _total == 0 ? 100 : Math.Min(100, _current * 100 / _total);
        // \r overwrites the current line; trailing spaces clear any leftover chars.
        Console.Write($"\r  {pct,3}%  ({_current:N0} / {_total:N0})   ");
    }
}
