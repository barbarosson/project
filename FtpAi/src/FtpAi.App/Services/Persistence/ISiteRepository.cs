using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FtpAi.Models.Entities;

namespace FtpAi.Services.Persistence;

/// <summary>CRUD for saved connection sites (SQLite via EF Core in later ADIMs).</summary>
public interface ISiteRepository
{
    Task<IReadOnlyList<SiteEntity>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<SiteEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<SiteEntity> AddAsync(SiteEntity site, CancellationToken cancellationToken = default);
}
