using FtpAi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FtpAi.Data;

/// <summary>
/// EF Core context. Tables/migrations expand in ADIM 2 (sites, history, queue state).
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<SiteEntity> Sites => Set<SiteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SiteEntity>(entity =>
        {
            entity.ToTable("Sites");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Host).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Protocol).HasMaxLength(16).IsRequired();
            entity.Property(e => e.Username).HasMaxLength(200);
        });
    }
}
