using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IAutoOptimizationService
{
    IReadOnlyList<AutoOptimizationRule> GetRules();

    void SaveRules(IEnumerable<AutoOptimizationRule> rules);

    AutoOptimizationRule AddDefaultRule();

    void RemoveRule(string id);

    Task<IReadOnlyList<string>> EvaluateAsync(CancellationToken cancellationToken = default);
}
