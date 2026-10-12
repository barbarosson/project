using System;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Security.Authentication;
using Renci.SshNet.Common;

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

        foreach (var current in Flatten(exception))
        {
            switch (current)
            {
                case OperationCanceledException:
                    return "The operation was cancelled.";
                case TimeoutException:
                    return "The connection timed out. Check the host, port, and network.";
                case AuthenticationException:
                    return "Authentication or TLS certificate validation failed.";
                case SshAuthenticationException:
                    return "Authentication failed. Check username, password, or SFTP private key.";
                case SftpPermissionDeniedException:
                    return "Remote permission denied. You may not write to this folder — try your home directory.";
                case SftpPathNotFoundException:
                    return "Remote path not found. Refresh the remote folder and retry.";
                case UnauthorizedAccessException:
                    return "Access denied. Check username, password, or file permissions.";
                case FileNotFoundException fnf:
                    return string.IsNullOrWhiteSpace(fnf.FileName)
                        ? "A required local file was not found."
                        : $"Local file not found: {Path.GetFileName(fnf.FileName)}";
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
                case SshException ssh when !string.IsNullOrWhiteSpace(ssh.Message):
                    return Sanitize(ssh.Message);
                case COMException com:
                    return MapComException(com);
            }
        }

        foreach (var current in Flatten(exception))
        {
            var msg = Sanitize(current.Message);
            if (msg.Length > 0 &&
                !msg.Equals("One or more errors occurred.", StringComparison.OrdinalIgnoreCase) &&
                !msg.Equals("Exception of type 'System.Exception' was thrown.", StringComparison.OrdinalIgnoreCase))
            {
                return msg;
            }
        }

        var typeName = exception.GetType().Name;
        return $"Transfer failed ({typeName}). Check remote path permissions and that you are still connected.";
    }

    private static System.Collections.Generic.IEnumerable<Exception> Flatten(Exception exception)
    {
        if (exception is AggregateException aggregate)
        {
            foreach (var inner in aggregate.Flatten().InnerExceptions)
            {
                foreach (var nested in Flatten(inner))
                {
                    yield return nested;
                }
            }

            yield break;
        }

        for (var current = exception; current is not null; current = current.InnerException)
        {
            yield return current;
        }
    }

    private static string MapComException(COMException com)
    {
        // 0x8001010E RPC_E_WRONG_THREAD — usually UI/collection touch off the UI thread,
        // or Free-tier concurrent use of the same protocol client.
        if (unchecked((uint)com.HResult) == 0x8001010E)
        {
            return "Transfer hit a threading conflict. Retry the transfer; if it persists, disconnect and reconnect.";
        }

        var inner = Sanitize(com.InnerException?.Message);
        if (inner.Length > 0)
        {
            return inner;
        }

        var own = Sanitize(com.Message);
        if (own.Length > 0)
        {
            return own;
        }

        return "Transfer failed (COM). Check remote path permissions and that you are still connected.";
    }

    private static string Sanitize(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return string.Empty;
        }

        var trimmed = message.Trim();

        if (LooksLikeAuthFailure(trimmed))
        {
            return "Authentication failed. Check username, password, or SFTP private key.";
        }

        if (trimmed.Equals("Permission denied", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains("permission denied", StringComparison.OrdinalIgnoreCase))
        {
            return "Remote permission denied. You may not write to this folder — try your home directory.";
        }

        if (trimmed.Equals("Failure", StringComparison.OrdinalIgnoreCase))
        {
            return "Remote server returned Failure. Check path, permissions, and disk space.";
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
        return message.Contains("auth fail", StringComparison.OrdinalIgnoreCase)
               || message.Contains("authentication", StringComparison.OrdinalIgnoreCase)
               || message.Contains("not authenticated", StringComparison.OrdinalIgnoreCase)
               || message.Contains("login incorrect", StringComparison.OrdinalIgnoreCase)
               || (message.Contains("password", StringComparison.OrdinalIgnoreCase)
                   && (message.Contains("denied", StringComparison.OrdinalIgnoreCase)
                       || message.Contains("failed", StringComparison.OrdinalIgnoreCase)
                       || message.Contains("reject", StringComparison.OrdinalIgnoreCase)
                       || message.Contains("invalid", StringComparison.OrdinalIgnoreCase)));
    }
}
