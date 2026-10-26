using UplinkFtp.Services.Licensing;

namespace UplinkFtp.Core.Tests;

public sealed class StorePurchaseMessagesTests
{
    [Fact]
    public void FormatUnavailable_includes_type_and_message()
    {
        var ex = new InvalidOperationException("The application has no active window.");
        var text = StorePurchaseMessages.FormatUnavailable(ex);

        Assert.Contains("InvalidOperationException", text, StringComparison.Ordinal);
        Assert.Contains("The application has no active window.", text, StringComparison.Ordinal);
        Assert.Contains("sandbox/test account", text, StringComparison.OrdinalIgnoreCase);
        Assert.StartsWith("Store purchase unavailable (", text, StringComparison.Ordinal);
    }

    [Fact]
    public void FormatUnavailable_type_only_when_message_empty()
    {
        var text = StorePurchaseMessages.FormatUnavailable(new Exception(string.Empty));
        Assert.Contains("(Exception)", text, StringComparison.Ordinal);
        Assert.DoesNotContain("(Exception: )", text, StringComparison.Ordinal);
    }

    [Fact]
    public void FormatUnavailable_truncates_very_long_detail()
    {
        var longMsg = new string('x', 400);
        var text = StorePurchaseMessages.FormatUnavailable(new Exception(longMsg));
        Assert.Contains('…', text);
        Assert.True(text.Length < 400, "dialog text should stay compact");
    }
}
