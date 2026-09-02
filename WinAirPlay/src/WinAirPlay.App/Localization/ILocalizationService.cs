namespace WinAirPlay.App.Localization;

public interface ILocalizationService
{
    string Get(string key);

    string Format(string key, params object[] args);
}
