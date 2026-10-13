# Restricted capability justifications (Partner Center)

Paste/adapt into the Partner Center submission questionnaire for Uplink FTP.

## `runFullTrust`

Uplink FTP is a WinUI 3 / Windows App SDK **desktop** FTP client. It runs as a full-trust desktop process to host the WinUI shell, FluentFTP/SSH.NET sessions, dual-pane file browsers, and background transfer workers. AppContainer-only execution cannot host this desktop packaging model.

## `broadFileSystemAccess`

Users browse and transfer **local** files from arbitrary folders (Documents, project trees, external drives) via the local browser panel and drag-and-drop. Restricted AppContainer storage paths alone cannot support a general-purpose FTP client’s local filesystem UX. Access is user-initiated; the app does not scan the disk in the background for advertising or analytics.

## `internetClient` (standard)

Required to connect to user-specified FTP / FTPS / SFTP servers and to call Microsoft Store licensing APIs on the Store channel.

## `privateNetworkClientServer` (standard)

Developers and admins commonly target FTP/SFTP hosts on localhost, LAN, or private VPNs. This capability enables those private-network client connections.
