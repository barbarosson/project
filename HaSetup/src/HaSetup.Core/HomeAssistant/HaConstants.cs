namespace HaSetup.Core.HomeAssistant;

public static class HaConstants
{
    public const string Image = "homeassistant/home-assistant:stable";
    public const string ContainerName = "smart-home-ha";
    public const string VolumeName = "smart-home-ha-config";
    public const int HostPort = 8123;
    public const int ContainerPort = 8123;
    public const string LocalUrl = "http://localhost:8123";
    public const string ConfigMount = "/config";
}
