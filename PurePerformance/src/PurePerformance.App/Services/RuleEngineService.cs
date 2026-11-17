using PurePerformance.Models;

namespace PurePerformance.Services;

public sealed class RuleEngineService : IRuleEngineService
{
    private readonly UserSettingsStore _store;
    private readonly object _gate = new();
    private List<WhitelistRule> _rules;

    public RuleEngineService(UserSettingsStore store)
    {
        _store = store;
        _rules = store.GetWhitelist().ToList();
    }

    public IReadOnlyList<WhitelistRule> GetRules()
    {
        lock (_gate) return _rules.Select(Clone).ToList();
    }

    public void SaveRules(IEnumerable<WhitelistRule> rules)
    {
        lock (_gate)
        {
            _rules = rules.Select(Clone).ToList();
            _store.SaveWhitelist(_rules);
        }
    }

    public WhitelistRule AddRule(string pattern, WhitelistScope scope, string notes)
    {
        var rule = new WhitelistRule
        {
            Pattern = pattern.Trim(),
            Scope = scope,
            Notes = notes.Trim(),
            IsEnabled = true
        };
        lock (_gate)
        {
            _rules.Add(rule);
            _store.SaveWhitelist(_rules);
        }

        return Clone(rule);
    }

    public void RemoveRule(string id)
    {
        lock (_gate)
        {
            _rules.RemoveAll(r => r.Id == id);
            _store.SaveWhitelist(_rules);
        }
    }

    public bool IsCleanerPathWhitelisted(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return false;
        foreach (var rule in Enabled(WhitelistScope.Cleaner))
        {
            if (Matches(path, rule.Pattern))
            {
                return true;
            }
        }

        return false;
    }

    public bool IsStartupWhitelisted(string name, string command)
    {
        var hay = $"{name} {command}";
        foreach (var rule in Enabled(WhitelistScope.Startup))
        {
            if (Matches(hay, rule.Pattern))
            {
                return true;
            }
        }

        return false;
    }

    private IEnumerable<WhitelistRule> Enabled(WhitelistScope needed)
    {
        lock (_gate)
        {
            return _rules
                .Where(r => r.IsEnabled && !string.IsNullOrWhiteSpace(r.Pattern))
                .Where(r => r.Scope == WhitelistScope.Both || r.Scope == needed)
                .Select(Clone)
                .ToList();
        }
    }

    private static bool Matches(string text, string pattern)
    {
        // Simple contains match (case-insensitive). Supports *foo* style by stripping *.
        var p = pattern.Trim().Trim('*');
        if (string.IsNullOrEmpty(p)) return false;
        return text.Contains(p, StringComparison.OrdinalIgnoreCase);
    }

    private static WhitelistRule Clone(WhitelistRule r) => new()
    {
        Id = r.Id,
        Pattern = r.Pattern,
        Scope = r.Scope,
        Notes = r.Notes,
        IsEnabled = r.IsEnabled
    };
}
