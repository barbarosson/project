namespace UplinkFtp.Models.Dto;

/// <summary>Options for remote directory listings.</summary>
public sealed class RemoteListOptions
{
    public static RemoteListOptions Default { get; } = new();

    /// <summary>Include dotfiles (e.g. .htaccess). Maps to FTP LIST -a when supported.</summary>
    public bool IncludeHidden { get; init; } = true;

    /// <summary>When true, attempt to resolve symlink targets into <see cref="RemoteEntry.LinkTarget"/>.</summary>
    public bool FollowSymlinks { get; init; }
}
