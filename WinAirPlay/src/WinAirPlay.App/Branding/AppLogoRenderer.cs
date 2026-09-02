using System.Drawing;
using System.Drawing.Drawing2D;

namespace WinAirPlay.App.Branding;

/// <summary>
/// Rounded profile head (cast-style triangle) with sound waves emanating from the mouth.
/// </summary>
public static class AppLogoRenderer
{
    public static readonly Color DefaultAccent = Color.FromArgb(0x4C, 0x8D, 0xFF);
    public static readonly Color DefaultWave = Color.FromArgb(0x3D, 0xD6, 0x8C);

    public static Bitmap Draw(int size, Color accent, Color? waveColor = null)
    {
        if (size < 16)
        {
            throw new ArgumentOutOfRangeException(nameof(size), "Logo must be at least 16 px.");
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

        DrawProfileHead(graphics, size, waveColor.Value);
        DrawMouthWaves(graphics, size, waveColor.Value);

        return bitmap;
    }

    /// <summary>
    /// Nudge the head+waves left so the group sits in the optical center of the tile
    /// (waves used to pull the silhouette toward the right edge).
    /// </summary>
    private const float FigureShiftX = -0.10f;

    private static float NX(float x) => x + FigureShiftX;

    /// <summary>
    /// Side-profile head: round skull, small nose, lips, chin and neck — still reading left-to-right
    /// like the AirPlay cast triangle.
    /// </summary>
    private static void DrawProfileHead(Graphics graphics, int size, Color color)
    {
        using var brush = new SolidBrush(color);

        graphics.FillEllipse(brush, size * NX(0.25f), size * 0.25f, size * 0.34f, size * 0.42f);

        using (var face = CreateFacePath(size))
        {
            graphics.FillPath(brush, face);
        }

        using (var neck = CreateNeckPath(size))
        {
            graphics.FillPath(brush, neck);
        }

        graphics.FillEllipse(brush, size * NX(0.27f), size * 0.42f, size * 0.09f, size * 0.13f);

        if (size >= 28)
        {
            DrawEye(graphics, size);
        }
    }

    private static GraphicsPath CreateFacePath(int size)
    {
        PointF P(float x, float y) => new(size * NX(x), size * y);

        var path = new GraphicsPath();
        path.AddBezier(P(0.48f, 0.30f), P(0.54f, 0.30f), P(0.56f, 0.34f), P(0.56f, 0.38f));
        path.AddBezier(P(0.56f, 0.38f), P(0.56f, 0.41f), P(0.58f, 0.43f), P(0.60f, 0.45f));
        path.AddBezier(P(0.60f, 0.45f), P(0.63f, 0.46f), P(0.63f, 0.48f), P(0.60f, 0.49f));
        path.AddBezier(P(0.60f, 0.49f), P(0.58f, 0.50f), P(0.61f, 0.51f), P(0.61f, 0.53f));
        path.AddBezier(P(0.61f, 0.53f), P(0.58f, 0.55f), P(0.56f, 0.58f), P(0.54f, 0.62f));
        path.AddBezier(P(0.54f, 0.62f), P(0.48f, 0.66f), P(0.40f, 0.64f), P(0.36f, 0.58f));
        path.AddBezier(P(0.36f, 0.58f), P(0.38f, 0.40f), P(0.42f, 0.30f), P(0.48f, 0.30f));
        path.CloseFigure();
        return path;
    }

    private static GraphicsPath CreateNeckPath(int size)
    {
        PointF P(float x, float y) => new(size * NX(x), size * y);

        var path = new GraphicsPath();
        path.AddBezier(P(0.36f, 0.60f), P(0.34f, 0.68f), P(0.34f, 0.74f), P(0.36f, 0.76f));
        path.AddBezier(P(0.36f, 0.76f), P(0.42f, 0.78f), P(0.48f, 0.76f), P(0.50f, 0.72f));
        path.AddBezier(P(0.50f, 0.72f), P(0.50f, 0.66f), P(0.48f, 0.62f), P(0.44f, 0.60f));
        path.AddBezier(P(0.44f, 0.60f), P(0.40f, 0.58f), P(0.38f, 0.58f), P(0.36f, 0.60f));
        path.CloseFigure();
        return path;
    }

    private static void DrawEye(Graphics graphics, int size)
    {
        var w = Math.Max(2.2f, size * 0.052f);
        var h = Math.Max(2.0f, size * 0.044f);
        var x = size * NX(0.46f);
        var y = size * 0.40f;

        using var brush = new SolidBrush(Color.FromArgb(0x14, 0x16, 0x1A));
        graphics.FillEllipse(brush, x, y, w, h);
    }

    /// <summary>Three arcs opening to the right from the mouth — wireless voice cast.</summary>
    private static void DrawMouthWaves(Graphics graphics, int size, Color waveColor)
    {
        var stroke = Math.Max(2.2f, size / 12f);
        var anchorX = size * NX(0.60f);
        var anchorY = size * 0.52f;

        for (var i = 0; i < 3; i++)
        {
            var diameter = size * (0.11f + i * 0.085f);
            var arcRect = new RectangleF(
                anchorX,
                anchorY - diameter / 2f,
                diameter,
                diameter);

            var alpha = 255 - (i * 38);
            using var pen = new Pen(Color.FromArgb(alpha, waveColor), stroke)
            {
                StartCap = LineCap.Round,
                EndCap = LineCap.Round,
            };

            graphics.DrawArc(pen, arcRect.X, arcRect.Y, arcRect.Width, arcRect.Height, -55, 110);
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
