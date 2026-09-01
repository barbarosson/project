using System.Drawing;
using WinAirPlay.App.Branding;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class AppLogoRendererTests
{
    [Theory]
    [InlineData(32)]
    [InlineData(96)]
    [InlineData(256)]
    public void Draw_ProducesANonEmptyBitmap(int size)
    {
        using var bitmap = AppLogoRenderer.Draw(size, AppLogoRenderer.DefaultAccent);

        Assert.Equal(size, bitmap.Width);
        Assert.Equal(size, bitmap.Height);
        Assert.True(HasVisiblePixels(bitmap));
    }

    [Fact]
    public void GetIcon_ReturnsAValidHandle()
    {
        using var icon = AppBranding.GetIcon();

        Assert.False(icon.Handle == IntPtr.Zero);
    }

    private static bool HasVisiblePixels(Bitmap bitmap)
    {
        for (var y = 0; y < bitmap.Height; y += 4)
        {
            for (var x = 0; x < bitmap.Width; x += 4)
            {
                if (bitmap.GetPixel(x, y).A > 0)
                {
                    return true;
                }
            }
        }

        return false;
    }
}
