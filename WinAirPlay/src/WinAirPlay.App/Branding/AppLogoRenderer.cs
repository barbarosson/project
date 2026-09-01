using System.Drawing;
using System.Drawing.Drawing2D;

namespace WinAirPlay.App.Branding;

/// <summary>
/// Speaker with broadcast arcs — wireless audio streaming, without the AirPlay cast triangle.
/// </summary>
public static class AppLogoRenderer
{
    public static readonly Color DefaultAccent = Color.FromArgb(0x4C, 0x8D, 0xFF);
    public static readonly Color DefaultWave = Color.FromArgb(0x3D, 0xD6, 0x8C);

    public static Bitmap Draw(int size, Color accent, Color? waveColor = null)
    {
        if (size < 16)
        {
            throw new ArgumentOutOfRangeException(nameof(size), "Logo en az 16 px olmalı.");
        }

        waveColor ??= DefaultWave;

        var bitmap = new Bitmap(size, size, System.Drawing.Imaging.PixelFormat.Format32bppArgb);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.SmoothingMode = SmoothingMode.AntiAlias;
        graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
        graphics.Clear(Color.Transparent);

        var pad = size * 0.08f;
        var tile = new RectangleF(pad, pad, size - (pad * 2f), size - (pad * 2f));
        var corner = size * 0.2f;

        using (var background = new LinearGradientBrush(
                   tile,
                   Color.FromArgb(0x1C, 0x1F, 0x26),
                   Color.FromArgb(0x14, 0x16, 0x1A),
                   52f))
        {
            FillRoundedRectangle(graphics, tile, corner, background);
        }

        var borderWidth = Math.Max(1.2f, size / 40f);
        using (var border = new Pen(Color.FromArgb(90, accent), borderWidth))
        {
            DrawRoundedRectangle(graphics, tile, corner, border);
        }

        DrawSpeaker(graphics, size, waveColor.Value);
        DrawSoundWaves(graphics, size, waveColor.Value);

        return bitmap;
    }

    private static void DrawSpeaker(Graphics graphics, int size, Color color)
    {
        using var brush = new SolidBrush(color);

        var centerY = size * 0.5f;
        var boxW = size * 0.13f;
        var boxH = size * 0.2f;
        var boxX = size * 0.26f;
        var boxY = centerY - boxH / 2f;

        graphics.FillRectangle(brush, boxX, boxY, boxW, boxH);

        var coneTip = boxX + boxW + size * 0.14f;
        var cone = new[]
        {
            new PointF(boxX + boxW, boxY),
            new PointF(coneTip, centerY - size * 0.07f),
            new PointF(coneTip, centerY + size * 0.07f),
            new PointF(boxX + boxW, boxY + boxH),
        };
        graphics.FillPolygon(brush, cone);
    }

    /// <summary>Three arcs to the right of the cone — classic volume / sound-wave icon.</summary>
    private static void DrawSoundWaves(Graphics graphics, int size, Color waveColor)
    {
        var stroke = Math.Max(2.2f, size / 11f);
        var anchorX = size * 0.52f;
        var centerY = size * 0.5f;

        for (var i = 0; i < 3; i++)
        {
            var diameter = size * (0.14f + i * 0.09f);
            var arcRect = new RectangleF(
                anchorX,
                centerY - diameter / 2f,
                diameter,
                diameter);

            var alpha = 255 - (i * 35);
            using var pen = new Pen(Color.FromArgb(alpha, waveColor), stroke)
            {
                StartCap = LineCap.Round,
                EndCap = LineCap.Round,
            };

            graphics.DrawArc(pen, arcRect.X, arcRect.Y, arcRect.Width, arcRect.Height, -70, 140);
        }
    }

    private static void FillRoundedRectangle(Graphics graphics, RectangleF bounds, float radius, Brush brush)
    {
        using var path = CreateRoundedRectangle(bounds, radius);
        graphics.FillPath(brush, path);
    }

    private static void DrawRoundedRectangle(Graphics graphics, RectangleF bounds, float radius, Pen pen)
    {
        using var path = CreateRoundedRectangle(bounds, radius);
        graphics.DrawPath(pen, path);
    }

    private static GraphicsPath CreateRoundedRectangle(RectangleF bounds, float radius)
    {
        var path = new GraphicsPath();
        var diameter = radius * 2f;
        var arc = new RectangleF(bounds.Location, new SizeF(diameter, diameter));

        path.AddArc(arc, 180, 90);
        arc.X = bounds.Right - diameter;
        path.AddArc(arc, 270, 90);
        arc.Y = bounds.Bottom - diameter;
        path.AddArc(arc, 0, 90);
        arc.X = bounds.Left;
        path.AddArc(arc, 90, 90);
        path.CloseFigure();
        return path;
    }
}
