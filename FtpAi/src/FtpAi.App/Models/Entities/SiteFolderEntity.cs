using System.Collections.Generic;

namespace FtpAi.Models.Entities;

/// <summary>Optional folder for grouping sites in Site Manager.</summary>
public class SiteFolderEntity
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int? ParentFolderId { get; set; }

    public SiteFolderEntity? ParentFolder { get; set; }

    public ICollection<SiteFolderEntity> Children { get; set; } = new List<SiteFolderEntity>();

    public ICollection<SiteEntity> Sites { get; set; } = new List<SiteEntity>();
}
