using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FtpAi.Models.Entities;

namespace FtpAi.Services.Persistence;

/// <summary>In-memory stub until EF Core repository is implemented.</summary>
public sealed class SiteRepositoryStub : ISiteRepository
{
    private readonly List<SiteEntity> _sites = [];

    public Task<IReadOnlyList<SiteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<SiteEntity>>(_sites.AsReadOnly());

    public Task<SiteEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => Task.FromResult(_sites.Find(s => s.Id == id));

    public Task<SiteEntity> AddAsync(SiteEntity site, CancellationToken cancellationToken = default)
    {
        site.Id = _sites.Count + 1;
        site.CreatedAtUtc = DateTime.UtcNow;
        _sites.Add(site);
        return Task.FromResult(site);
    }
}
