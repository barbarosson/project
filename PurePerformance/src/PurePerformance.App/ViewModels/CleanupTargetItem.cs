using CommunityToolkit.Mvvm.ComponentModel;
using PurePerformance.Models;

namespace PurePerformance.ViewModels;

public partial class CleanupTargetItem : ObservableObject
{
    public CleanupTargetItem(CleanupTarget target)
    {
        Target = target;
        IsSelected = target.IsSelected;
    }

    public CleanupTarget Target { get; }

    public string Id => Target.Id;

    public string DisplayName => Target.DisplayName;

    public string WhatItCleans => Target.WhatItCleans;

    public string PathsLabel => string.Join(Environment.NewLine, Target.Paths);

    public string SizeLabel => Target.SizeLabel;

    public bool RequiresAdmin => Target.RequiresAdmin;

    public string AdminHint => RequiresAdmin ? "May need admin" : "No admin required";

    [ObservableProperty]
    private bool isSelected;
}
