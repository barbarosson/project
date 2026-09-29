namespace HaSetup.Core.Docker;

public sealed record DockerCommandResult(
    int ExitCode,
    string StandardOutput,
    string StandardError)
{
    public bool Succeeded => ExitCode == 0;

    public string CombinedOutput
    {
        get
        {
            if (string.IsNullOrWhiteSpace(StandardError))
            {
                return StandardOutput.Trim();
            }

            if (string.IsNullOrWhiteSpace(StandardOutput))
            {
                return StandardError.Trim();
            }

            return $"{StandardOutput.Trim()}\n{StandardError.Trim()}";
        }
    }
}
