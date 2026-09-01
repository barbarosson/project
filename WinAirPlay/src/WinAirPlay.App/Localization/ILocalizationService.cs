namespace WinAirPlay.App.Localization;

public interface ILocalizationService
{
    AppLanguage Language { get; set; }

    event EventHandler? LanguageChanged;

    string Get(string key);

    string Format(string key, params object[] args);
}
