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

var icoPath = Path.Combine(repoRoot, "src", "WinAirPlay.App", "Assets", "app.ico");
Directory.CreateDirectory(Path.GetDirectoryName(icoPath)!);
SaveIco(icoPath, [16, 24, 32, 48, 64, 128, 256]);
Console.WriteLine($"App icon written to {icoPath}");

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

static void SaveIco(string path, int[] sizes)
{
    var pngs = new List<byte[]>(sizes.Length);
    foreach (var size in sizes)
    {
        using var bitmap = AppLogoRenderer.Draw(size, AppLogoRenderer.DefaultAccent);
        using var buffer = new MemoryStream();
        bitmap.Save(buffer, ImageFormat.Png);
        pngs.Add(buffer.ToArray());
    }

    using var stream = File.Create(path);
    using var writer = new BinaryWriter(stream);
    writer.Write((ushort)0);
    writer.Write((ushort)1);
    writer.Write((ushort)pngs.Count);

    var offset = 6 + (16 * pngs.Count);
    for (var i = 0; i < pngs.Count; i++)
    {
        var size = sizes[i];
        writer.Write((byte)(size >= 256 ? 0 : size));
        writer.Write((byte)(size >= 256 ? 0 : size));
        writer.Write((byte)0);
        writer.Write((byte)0);
        writer.Write((ushort)1);
        writer.Write((ushort)32);
        writer.Write(pngs[i].Length);
        writer.Write(offset);
        offset += pngs[i].Length;
    }

    foreach (var png in pngs)
    {
        writer.Write(png);
    }
}
