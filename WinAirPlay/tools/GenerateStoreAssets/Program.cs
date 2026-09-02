using System.Drawing;
using System.Drawing.Imaging;
using WinAirPlay.App.Branding;

var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
var outputDirectory = args.Length > 0
    ? args[0]
    : Path.Combine(repoRoot, "src", "WinAirPlay.Package", "Images");

outputDirectory = Path.GetFullPath(outputDirectory);
Directory.CreateDirectory(outputDirectory);

SaveSquare(outputDirectory, "StoreLogo.png", 50);
SaveSquare(outputDirectory, "Square44x44Logo.png", 44);
SaveSquare(outputDirectory, "Square150x150Logo.png", 150);
SaveSquare(outputDirectory, "Square310x310Logo.png", 310);
SaveSquare(outputDirectory, "StoreListingLogo300.png", 300);
SaveWide(outputDirectory, "Wide310x150Logo.png", 310, 150);

Console.WriteLine($"Store assets written to {outputDirectory}");

static void SaveSquare(string directory, string fileName, int size)
{
    using var bitmap = AppLogoRenderer.Draw(size, AppLogoRenderer.DefaultAccent);
    bitmap.Save(Path.Combine(directory, fileName), ImageFormat.Png);
}

static void SaveWide(string directory, string fileName, int width, int height)
{
    using var canvas = new Bitmap(width, height, PixelFormat.Format32bppArgb);
    using var graphics = Graphics.FromImage(canvas);
    graphics.Clear(Color.FromArgb(0x14, 0x16, 0x1A));

    var logoSize = Math.Min(height - 16, 128);
    using var logo = AppLogoRenderer.Draw(logoSize, AppLogoRenderer.DefaultAccent);
    var x = 24;
    var y = (height - logoSize) / 2;
    graphics.DrawImage(logo, x, y, logoSize, logoSize);

    canvas.Save(Path.Combine(directory, fileName), ImageFormat.Png);
}
