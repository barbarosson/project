using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace UplinkFtp.Services.Assist;

/// <summary>
/// Local smart-assist helpers for connection setup and error diagnosis.
/// No cloud LLM call — deterministic parsing and heuristics suitable for offline use.
/// </summary>
public static class ConnectionAssistService
{
    private static readonly Regex HostPortLine = new(
        @"^(?<user>[^@\s/]+@)?(?<host>[A-Za-z0-9.\-_\[\]]+)(:(?<port>\d{1,5}))?\s*$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>
    /// Parse a connection URI or compact host line into form fields.
    /// Supports ftp://, ftps://, sftp:// and user@host:port.
    /// </summary>
    public static ConnectionAssistParseResult ParseConnectionText(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return new ConnectionAssistParseResult
            {
                Success = false,
                Summary = "Paste a URI (sftp://user@host:22/path) or host:port line."
            };
        }

        var text = input.Trim();

        if (Uri.TryCreate(text, UriKind.Absolute, out var uri)
            && uri.Scheme is "ftp" or "ftps" or "sftp")
        {
            var protocol = uri.Scheme.ToUpperInvariant() switch
            {
                "FTPS" => "FTPS",
                "SFTP" => "SFTP",
                _ => "FTP"
            };

            var port = uri.IsDefaultPort ? DefaultPort(protocol) : uri.Port;
            var user = Uri.UnescapeDataString(uri.UserInfo ?? string.Empty);
            string? password = null;
            if (user.Contains(':', StringComparison.Ordinal))
            {
                var parts = user.Split(':', 2);
                user = parts[0];
                password = parts.Length > 1 ? parts[1] : null;
            }

            var path = string.IsNullOrEmpty(uri.AbsolutePath) || uri.AbsolutePath == "/"
                ? "/"
                : Uri.UnescapeDataString(uri.AbsolutePath);

            return new ConnectionAssistParseResult
            {
                Success = true,
                Host = uri.Host,
                Port = port,
                Protocol = protocol,
                Username = string.IsNullOrWhiteSpace(user) ? null : user,
                Password = password,
                RemotePath = path,
                Summary = $"Parsed {protocol} → {uri.Host}:{port}"
            };
        }

        var m = HostPortLine.Match(text);
        if (m.Success)
        {
            var user = m.Groups["user"].Success
                ? m.Groups["user"].Value.TrimEnd('@')
                : null;
            var host = m.Groups["host"].Value;
            int? port = m.Groups["port"].Success && int.TryParse(m.Groups["port"].Value, out var p)
                ? p
                : null;
            var protocol = port switch
            {
                22 => "SFTP",
                990 => "FTPS",
                21 => "FTP",
                _ => null
            };

            return new ConnectionAssistParseResult
            {
                Success = true,
                Host = host,
                Port = port,
                Protocol = protocol,
                Username = user,
                Summary = port is null
                    ? $"Parsed host {host}"
                    : $"Parsed host {host}:{port}" + (protocol is null ? string.Empty : $" ({protocol})")
            };
        }

        return new ConnectionAssistParseResult
        {
            Success = false,
            Summary = "Could not parse. Try sftp://user@host:22/ or host:22."
        };
    }

    /// <summary>Suggest default port for a protocol label (FTP / FTPS / SFTP).</summary>
    public static int DefaultPort(string? protocol) => protocol?.Trim().ToUpperInvariant() switch
    {
        "SFTP" => 22,
        "FTPS" => 990,
        _ => 21
    };

    /// <summary>Diagnose recent log / error lines with offline heuristics.</summary>
    public static ConnectionAssistDiagnosis Diagnose(IEnumerable<string>? logLines)
    {
        var text = string.Join('\n', (logLines ?? []).TakeLast(40)).ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(text))
        {
            return new ConnectionAssistDiagnosis
            {
                Title = "No log yet",
                Advice = "Try connecting once, then open Assist again for a diagnosis."
            };
        }

        if (text.Contains("connection refused", StringComparison.Ordinal)
            || text.Contains("actively refused", StringComparison.Ordinal)
            || text.Contains("could not connect", StringComparison.Ordinal))
        {
            return new ConnectionAssistDiagnosis
            {
                Title = "Connection refused",
                Advice = "Nothing is accepting the port. For SFTP start OpenSSH Server (sshd) and use your Windows username. For plain FTP try a local Python FTP server on port 21. Confirm Host/Port and firewall.",
                SuggestedProtocol = text.Contains("sftp", StringComparison.Ordinal) ? "SFTP" : null,
                SuggestedPort = text.Contains("sftp", StringComparison.Ordinal) ? 22 : null
            };
        }

        if ((text.Contains("auth", StringComparison.Ordinal) &&
             (text.Contains("fail", StringComparison.Ordinal) || text.Contains("denied", StringComparison.Ordinal)))
            || text.Contains("secure connection error", StringComparison.Ordinal)
            || text.Contains("authentication failed", StringComparison.Ordinal))
        {
            return new ConnectionAssistDiagnosis
            {
                Title = "Authentication failed",
                Advice = "OpenSSH is reachable but login failed. Use the exact Windows username (e.g. barba — not the display name with spaces), the correct password, and confirm OpenSSH Authentication Agent / password auth is allowed. Sites → private key path is an alternative for SFTP."
            };
        }

        if (text.Contains("certificate", StringComparison.Ordinal)
            || text.Contains("tls", StringComparison.Ordinal)
            || text.Contains("ssl", StringComparison.Ordinal))
        {
            return new ConnectionAssistDiagnosis
            {
                Title = "TLS / certificate issue",
                Advice = "For lab FTPS only, enable “Accept any FTPS certificate” in Settings or the Connect bar. Prefer installing a proper cert for production.",
                SuggestedProtocol = "FTPS",
                SuggestedPort = 990
            };
        }

        if (text.Contains("timeout", StringComparison.Ordinal) || text.Contains("timed out", StringComparison.Ordinal))
        {
            return new ConnectionAssistDiagnosis
            {
                Title = "Timeout",
                Advice = "Host unreachable or port blocked. Ping/route the host, open the firewall, and raise Connect timeout in Settings if the network is slow."
            };
        }

        if (text.Contains("connection failed", StringComparison.Ordinal))
        {
            return new ConnectionAssistDiagnosis
            {
                Title = "Connection failed",
                Advice = "Verify protocol matches the server (FTP 21 / FTPS 990 / SFTP 22), then retry. Paste a full URI here to auto-fill Host, Port, and Protocol."
            };
        }

        return new ConnectionAssistDiagnosis
        {
            Title = "No clear error pattern",
            Advice = "Paste a connection URI to auto-fill fields, or check Message log for the last [ERROR] line."
        };
    }
}
