using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IRuleEngineService
{
    IReadOnlyList<WhitelistRule> GetRules();

    void SaveRules(IEnumerable<WhitelistRule> rules);

    bool IsCleanerPathWhitelisted(string path);

    bool IsStartupWhitelisted(string name, string command);

    WhitelistRule AddRule(string pattern, WhitelistScope scope, string notes);

    void RemoveRule(string id);
}
