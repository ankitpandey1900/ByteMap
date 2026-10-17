use sysinfo::Disks;
use crate::models::DriveInfo;

pub struct DriveDiscovery;

impl DriveDiscovery {
    pub fn get_system_drives() -> Vec<DriveInfo> {
        let disks = Disks::new_with_refreshed_list();
        let mut results = Vec::new();

        for disk in &disks {
            let mount_point = disk.mount_point().to_string_lossy().to_string();
            let name_str = disk.name().to_string_lossy().to_string();
            let name = if name_str.trim().is_empty() {
                format!("Local Disk ({})", mount_point.trim_end_matches('\\'))
            } else {
                format!("{} ({})", name_str, mount_point.trim_end_matches('\\'))
            };

            let filesystem = disk.file_system().to_string_lossy().to_string();
            let total_bytes = disk.total_space();
            let available_bytes = disk.available_space();
            let used_bytes = total_bytes.saturating_sub(available_bytes);
            let is_removable = disk.is_removable();
            let is_read_only = disk.is_read_only();

            results.push(DriveInfo {
                id: mount_point.clone(),
                name,
                mount_point,
                filesystem,
                total_bytes,
                available_bytes,
                used_bytes,
                is_removable,
                is_read_only,
            });
        }

        results
    }
}
