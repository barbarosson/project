using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PurePerformance.Helpers;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class TutorialViewModel : ObservableObject
{
    private readonly UserSettingsStore _settings;

    public TutorialViewModel(UserSettingsStore settings)
    {
        _settings = settings;
        HasCompletedTutorial = settings.HasCompletedTutorial;
        StatusMessage = HasCompletedTutorial
            ? "You marked this tutorial as done. Reopen anytime from Help / Tutorial."
            : "First-run tip: walk through these steps once, then tap Mark tutorial done.";
    }

    public IReadOnlyList<TutorialSection> Sections => TutorialCatalog.Sections;

    public string Intro { get; } =
        "Welcome to Pure Performance — Crash Analyzer and Startup Manager, with honest free tools and optional Pro. " +
        "Follow the steps below in order, or jump to the pane you need.";

    [ObservableProperty]
    private bool hasCompletedTutorial;

    [ObservableProperty]
    private string statusMessage = string.Empty;

    [RelayCommand]
    private void MarkDone()
    {
        _settings.HasCompletedTutorial = true;
        HasCompletedTutorial = true;
        StatusMessage = "Tutorial marked done. You can still open Help / Tutorial anytime from the left navigation.";
    }

    [RelayCommand]
    private void ResetTutorialFlag()
    {
        _settings.HasCompletedTutorial = false;
        HasCompletedTutorial = false;
        StatusMessage = "Tutorial flag cleared — it will open again on the next first-run prompt.";
    }
}
