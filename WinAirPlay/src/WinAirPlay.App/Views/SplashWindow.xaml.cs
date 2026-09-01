using System.Windows;
using WinAirPlay.App.Branding;
using WinAirPlay.App.Localization;

namespace WinAirPlay.App.Views;

public partial class SplashWindow : Window
{
    public SplashWindow(ILocalizationService localization)
    {
        InitializeComponent();
        LogoImage.Source = AppBranding.GetLogo(96);
        TaglineText.Text = localization.Get(LocKeys.SplashTagline);
        LoadingText.Text = localization.Get(LocKeys.SplashLoading);
    }
}
