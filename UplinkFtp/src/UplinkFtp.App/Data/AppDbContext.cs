using UplinkFtp.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace UplinkFtp.Data;

/// <summary>
/// EF Core context for Site Manager data.
/// Local dev uses <c>EnsureCreated</c> via <see cref="DatabaseInitializer"/>;
/// switch to migrations when schema churn stabilizes.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<SiteEntity> Sites => Set<SiteEntity>();

    public DbSet<SiteFolderEntity> SiteFolders => Set<SiteFolderEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SiteFolderEntity>(entity =>
        {
            entity.ToTable("SiteFolders");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.HasOne(e => e.ParentFolder)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentFolderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SiteEntity>(entity =>
        {
            entity.ToTable("Sites");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Host).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Protocol).HasMaxLength(16).IsRequired();
            entity.Property(e => e.Username).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CredentialKey).HasMaxLength(64).IsRequired();
            entity.Property(e => e.PrivateKeyPath).HasMaxLength(1024);
            entity.Property(e => e.InitialRemotePath).HasMaxLength(1024);
            entity.HasIndex(e => e.CredentialKey).IsUnique();
            entity.HasOne(e => e.Folder)
                .WithMany(e => e.Sites)
                .HasForeignKey(e => e.FolderId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
