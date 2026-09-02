namespace WinAirPlay.Core.Discovery;

/// <summary>Maps Apple AirPlay model identifiers to human-readable product names.</summary>
public static class AirPlayProductNames
{
    public static string? Resolve(string? model, bool isHomePod)
    {
        if (string.IsNullOrWhiteSpace(model))
        {
            return isHomePod ? "HomePod" : null;
        }

        return model.ToUpperInvariant() switch
        {
            "AUDIOACCESSORY1,1" => "HomePod mini",
            "AUDIOACCESSORY1,2" => "HomePod mini",
            "AUDIOACCESSORY5,1" => "HomePod",
            "AUDIOACCESSORY6,1" => "HomePod mini",
            "AUDIOACCESSORY6,3" => "HomePod",
            "APPLETV5,3" => "Apple TV",
            "APPLETV6,2" => "Apple TV 4K",
            "APPLETV11,1" => "Apple TV 4K",
            "APPLETV14,1" => "Apple TV 4K",
            _ when model.StartsWith("AudioAccessory", StringComparison.OrdinalIgnoreCase) => "HomePod",
            _ when model.StartsWith("AppleTV", StringComparison.OrdinalIgnoreCase) => "Apple TV",
            _ => null,
        };
    }

    public static string FormatDisplayName(string name, string? model, bool isHomePod)
    {
        var product = Resolve(model, isHomePod);
        if (product is null)
        {
            return name;
        }

        if (name.Contains(product, StringComparison.OrdinalIgnoreCase))
        {
            return name;
        }

        return $"{name} · {product}";
    }
}
