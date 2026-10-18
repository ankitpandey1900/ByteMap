pub mod cleanup;
pub mod commands;
pub mod drives;
pub mod duplicates;
pub mod errors;
pub mod models;
pub mod scanner;
pub mod security;

use commands::AppScanState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppScanState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_drives,
            commands::start_scan,
            commands::cancel_scan,
            commands::get_scan_summary,
            commands::clear_scan_data,
            commands::find_duplicates,
            commands::execute_cleanup,
            commands::reveal_in_folder,
            commands::load_settings,
            commands::save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running ByteMap application");
}
