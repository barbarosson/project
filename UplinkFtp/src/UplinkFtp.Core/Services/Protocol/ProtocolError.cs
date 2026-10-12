using System;
using System.IO;
using System.Net.Sockets;
using System.Security.Authentication;

namespace UplinkFtp.Services.Protocol;

/// <summary>Maps low-level protocol exceptions to short, user-facing messages.</summary>
public static class ProtocolError
{
    public static string ToUserMessage(Exception? exception)
    {
        if (exception is null)
        {
            return "An unknown error occurred.";
        }

        for (var current = exception; current is not null; current = current.InnerException)
        {
            switch (current)
            {
                case OperationCanceledException:
                    return "The operation was cancelled.";
                case TimeoutException:
                    return "The connection timed out. Check the host, port, and network.";
                case AuthenticationException:
                    return "Authentication or TLS certificate validation failed.";
                case UnauthorizedAccessException:
                    return "Access denied. Check username, password, or key permissions.";
                case FileNotFoundException fnf:
                    return string.IsNullOrWhiteSpace(fnf.FileName)
                        ? "A required file was not found."
                        : $"File not found: {fnf.FileName}";
                case DirectoryNotFoundException:
                    return "Directory not found.";
                case SocketException socket:
                    return socket.SocketErrorCode switch
                    {
                        SocketError.HostNotFound => "Host not found. Check the server address.",
                        SocketError.ConnectionRefused => "Connection refused. The server may be offline or the port is wrong.",
                        SocketError.TimedOut => "The connection timed out. Check the host, port, and network.",
                        SocketError.NetworkUnreachable => "Network unreachable.",
                        _ => "A network error occurred while talking to the server."
                    };
                case IOException io when !string.IsNullOrWhiteSpace(io.Message):
                    return Sanitize(io.Message);
            }
        }

        return Sanitize(exception.Message) is { Length: > 0 } msg
            ? msg
            : "An unexpected error occurred.";
    }

    private static string Sanitize(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return string.Empty;
        }

        // Never echo credential-like fragments into the UI.
        var trimmed = message.Trim();
        if (LooksLikeAuthFailure(trimmed))
        {
            return "Authentication failed. Check username, password, or SFTP private key.";
        }

        if (trimmed.Contains("password", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains("private key", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains("secret", StringComparison.OrdinalIgnoreCase))
        {
            return "A secure connection error occurred. Check credentials or key path.";
        }

        return trimmed.Length > 240 ? trimmed[..240] + "…" : trimmed;
    }

    private static bool LooksLikeAuthFailure(string message)
    {
        // SSH.NET / OpenSSH often mention "password" in auth failures — map those clearly
        // without echoing the raw exception (which may include sensitive wording).
        return message.Contains("permission denied", StringComparison.OrdinalIgnoreCase)
               || message.Contains("auth fail", StringComparison.OrdinalIgnoreCase)
               || message.Contains("authentication", StringComparison.OrdinalIgnoreCase)
               || message.Contains("not authenticated", StringComparison.OrdinalIgnoreCase)
               || (message.Contains("password", StringComparison.OrdinalIgnoreCase)
                   && (message.Contains("denied", StringComparison.OrdinalIgnoreCase)
                       || message.Contains("failed", StringComparison.OrdinalIgnoreCase)
                       || message.Contains("reject", StringComparison.OrdinalIgnoreCase)
                       || message.Contains("invalid", StringComparison.OrdinalIgnoreCase)));
    }
}
