//! Windows connectivity helpers for the in-notch panel.
//!
//! Wi-Fi uses the native WLAN API (scan, connect with a saved profile or a new
//! WPA2/WPA3 profile, disconnect). Bluetooth enumerates paired devices; pairing
//! itself stays in Windows Settings because it can require a PIN or a
//! device-specific confirmation that the notch cannot reliably show.

use std::ffi::c_void;
use std::time::Duration;

use windows::core::{GUID, PCWSTR, PWSTR};
use windows::Win32::Foundation::HANDLE;
use windows::Win32::NetworkManagement::WiFi::{
    dot11_BSS_type_infrastructure, wlan_connection_mode_profile, wlan_intf_opcode_current_connection,
    wlan_interface_state_connected, WlanCloseHandle, WlanConnect, WlanDeleteProfile, WlanDisconnect,
    WlanEnumInterfaces, WlanFreeMemory, WlanGetAvailableNetworkList, WlanGetProfile, WlanGetProfileList,
    WlanOpenHandle, WlanQueryInterface, WlanScan, WlanSetProfile, DOT11_AUTH_ALGO_WPA3,
    DOT11_AUTH_ALGO_WPA3_SAE, DOT11_SSID,
    WLAN_AVAILABLE_NETWORK_CONNECTED, WLAN_AVAILABLE_NETWORK_HAS_PROFILE,
    WLAN_AVAILABLE_NETWORK_LIST, WLAN_CONNECTION_ATTRIBUTES, WLAN_CONNECTION_PARAMETERS,
    WLAN_INTERFACE_INFO_LIST, WLAN_PROFILE_INFO_LIST,
};

use crate::types::{BluetoothDeviceInfo, WifiNetwork, WifiScanResult};

// ── WLAN session ─────────────────────────────────────────────────────────────

struct WlanSession {
    handle: HANDLE,
}

impl Drop for WlanSession {
    fn drop(&mut self) {
        unsafe {
            let _ = WlanCloseHandle(self.handle, None);
        }
    }
}

fn open_wlan() -> Result<(WlanSession, GUID), String> {
    unsafe {
        let mut negotiated_version = 0u32;
        let mut handle = HANDLE::default();
        let rc = WlanOpenHandle(2, None, &mut negotiated_version, &mut handle);
        if rc != 0 {
            return Err(format!("Wi-Fi service is unavailable (error {rc})"));
        }
        let session = WlanSession { handle };

        let mut interface_list: *mut WLAN_INTERFACE_INFO_LIST = std::ptr::null_mut();
        let rc = WlanEnumInterfaces(handle, None, &mut interface_list);
        if rc != 0 || interface_list.is_null() {
            return Err(format!("Could not enumerate Wi-Fi adapters (error {rc})"));
        }

        let interfaces = &*interface_list;
        let guid = if interfaces.dwNumberOfItems > 0 {
            Some(interfaces.InterfaceInfo[0].InterfaceGuid)
        } else {
            None
        };
        WlanFreeMemory(interface_list as *const c_void);

        guid.map(|guid| (session, guid))
            .ok_or_else(|| "No Wi-Fi adapter was found".to_string())
    }
}

fn wide_null(value: &str) -> Vec<u16> {
    value.encode_utf16().chain(std::iter::once(0)).collect()
}

fn wide_array_to_string(value: &[u16]) -> String {
    let end = value.iter().position(|&c| c == 0).unwrap_or(value.len());
    String::from_utf16_lossy(&value[..end])
}

fn ssid_to_string(ssid: &DOT11_SSID) -> Option<String> {
    let len = (ssid.uSSIDLength as usize).min(ssid.ucSSID.len());
    if len == 0 {
        return None;
    }
    Some(String::from_utf8_lossy(&ssid.ucSSID[..len]).into_owned())
}

struct AvailableNetwork {
    ssid: String,
    raw_ssid: DOT11_SSID,
    profile_name: String,
    secured: bool,
    wpa3: bool,
    signal: u32,
    connected: bool,
    has_profile: bool,
}

const LOCATION_REQUIRED: &str = "wifi_location_required";

fn read_available_networks(session: &WlanSession, guid: &GUID) -> Result<Vec<AvailableNetwork>, String> {
    unsafe {
        let mut list: *mut WLAN_AVAILABLE_NETWORK_LIST = std::ptr::null_mut();
        let rc = WlanGetAvailableNetworkList(session.handle, guid, 0, None, &mut list);
        if rc == 5 {
            // Windows 10/11 gates nearby-network lists behind Location services.
            return Err(LOCATION_REQUIRED.to_string());
        }
        if rc != 0 || list.is_null() {
            if !list.is_null() {
                WlanFreeMemory(list as *const c_void);
            }
            return Err(format!("Could not read Wi-Fi networks (error {rc})"));
        }

        let entries = &*list;
        let networks = std::slice::from_raw_parts(
            entries.Network.as_ptr(),
            entries.dwNumberOfItems as usize,
        );
        let mut available = Vec::new();

        for entry in networks {
            if !entry.bNetworkConnectable.as_bool() {
                continue;
            }
            let Some(ssid) = ssid_to_string(&entry.dot11Ssid) else {
                continue;
            };
            let auth = entry.dot11DefaultAuthAlgorithm;
            available.push(AvailableNetwork {
                ssid,
                raw_ssid: entry.dot11Ssid,
                profile_name: wide_array_to_string(&entry.strProfileName),
                secured: entry.bSecurityEnabled.as_bool(),
                wpa3: auth == DOT11_AUTH_ALGO_WPA3 || auth == DOT11_AUTH_ALGO_WPA3_SAE,
                signal: entry.wlanSignalQuality.min(100) as u32,
                connected: entry.dwFlags & WLAN_AVAILABLE_NETWORK_CONNECTED != 0,
                has_profile: entry.dwFlags & WLAN_AVAILABLE_NETWORK_HAS_PROFILE != 0,
            });
        }

        WlanFreeMemory(list as *const c_void);
        Ok(available)
    }
}

fn current_ssid(session: &WlanSession, guid: &GUID) -> Option<String> {
    unsafe {
        let mut size = 0u32;
        let mut data: *mut c_void = std::ptr::null_mut();
        let rc = WlanQueryInterface(
            session.handle,
            guid,
            wlan_intf_opcode_current_connection,
            None,
            &mut size,
            &mut data,
            None,
        );
        if rc != 0 || data.is_null() {
            return None;
        }

        let attributes = &*(data as *const WLAN_CONNECTION_ATTRIBUTES);
        let ssid = if attributes.isState == wlan_interface_state_connected {
            ssid_to_string(&attributes.wlanAssociationAttributes.dot11Ssid)
        } else {
            None
        };
        WlanFreeMemory(data);
        ssid
    }
}

/// Current SSID for `get_wifi_status`. Opens its own short-lived WLAN session.
pub(crate) fn current_wifi_ssid_sync() -> Option<String> {
    let (session, guid) = open_wlan().ok()?;
    current_ssid(&session, &guid)
}

fn saved_profile_names(session: &WlanSession, guid: &GUID) -> Vec<String> {
    unsafe {
        let mut list: *mut WLAN_PROFILE_INFO_LIST = std::ptr::null_mut();
        let rc = WlanGetProfileList(session.handle, guid, None, &mut list);
        if rc != 0 || list.is_null() {
            if !list.is_null() {
                WlanFreeMemory(list as *const c_void);
            }
            return Vec::new();
        }
        let entries = &*list;
        let profiles = std::slice::from_raw_parts(
            entries.ProfileInfo.as_ptr(),
            entries.dwNumberOfItems as usize,
        );
        let names = profiles
            .iter()
            .map(|profile| wide_array_to_string(&profile.strProfileName))
            .filter(|name| !name.is_empty())
            .collect();
        WlanFreeMemory(list as *const c_void);
        names
    }
}

/// Cached list of visible networks. `trigger_scan` asks the driver for a fresh
/// scan first and waits for it; Windows throttles scans, so callers should not
/// loop this faster than a few seconds. When Location services are off Windows
/// denies the nearby list, so saved profiles are returned instead and the UI
/// can explain how to turn location on.
pub(crate) fn list_wifi_networks_sync(trigger_scan: bool) -> Result<WifiScanResult, String> {
    let (session, guid) = open_wlan()?;

    if trigger_scan {
        unsafe {
            let _ = WlanScan(session.handle, &guid, None, None, None);
        }
        std::thread::sleep(Duration::from_millis(1400));
    }

    let available = match read_available_networks(&session, &guid) {
        Ok(networks) => networks,
        Err(error) if error == LOCATION_REQUIRED => {
            let current = current_ssid(&session, &guid);
            let networks = saved_profile_names(&session, &guid)
                .into_iter()
                .map(|ssid| WifiNetwork {
                    connected: current.as_deref() == Some(ssid.as_str()),
                    has_profile: true,
                    // Saved profiles don't expose their auth in the profile
                    // list. The panel labels these as Saved rather than showing
                    // a lock, and connecting uses the stored profile.
                    secured: true,
                    signal: 0,
                    ssid,
                })
                .collect();
            return Ok(WifiScanResult {
                networks,
                location_required: true,
            });
        }
        Err(error) => return Err(error),
    };

    let mut visible: Vec<WifiNetwork> = Vec::new();
    for network in available {
        if let Some(existing) = visible.iter_mut().find(|n| n.ssid == network.ssid) {
            // The API can return one entry per BSSID; keep the best/connected one.
            let better = (!existing.connected && network.connected)
                || (existing.connected == network.connected
                    && (network.signal > existing.signal
                        || (!existing.has_profile && network.has_profile)));
            if better {
                *existing = WifiNetwork {
                    ssid: network.ssid,
                    signal: network.signal,
                    secured: network.secured,
                    connected: network.connected,
                    has_profile: network.has_profile,
                };
            }
        } else {
            visible.push(WifiNetwork {
                ssid: network.ssid,
                signal: network.signal,
                secured: network.secured,
                connected: network.connected,
                has_profile: network.has_profile,
            });
        }
    }

    visible.sort_by(|a, b| {
        b.connected
            .cmp(&a.connected)
            .then_with(|| b.has_profile.cmp(&a.has_profile))
            .then_with(|| b.signal.cmp(&a.signal))
            .then_with(|| a.ssid.to_lowercase().cmp(&b.ssid.to_lowercase()))
    });
    Ok(WifiScanResult {
        networks: visible,
        location_required: false,
    })
}

fn xml_escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn build_profile_xml(ssid: &str, password: Option<&str>, secured: bool, wpa3: bool) -> String {
    let ssid = xml_escape(ssid);
    let security = if secured {
        let key = xml_escape(password.unwrap_or(""));
        let authentication = if wpa3 { "WPA3SAE" } else { "WPA2PSK" };
        format!(
            "<authEncryption>\
                <authentication>{authentication}</authentication>\
                <encryption>AES</encryption>\
                <useOneX>false</useOneX>\
            </authEncryption>\
            <sharedKey>\
                <keyType>passPhrase</keyType>\
                <protected>false</protected>\
                <keyMaterial>{key}</keyMaterial>\
            </sharedKey>"
        )
    } else {
        "<authEncryption>\
            <authentication>open</authentication>\
            <encryption>none</encryption>\
            <useOneX>false</useOneX>\
        </authEncryption>"
            .to_string()
    };

    format!(
        "<?xml version=\"1.0\"?>\
        <WLANProfile xmlns=\"http://www.microsoft.com/networking/WLAN/profile/v1\">\
            <name>{ssid}</name>\
            <SSIDConfig><SSID><name>{ssid}</name></SSID></SSIDConfig>\
            <connectionType>ESS</connectionType>\
            <connectionMode>auto</connectionMode>\
            <MSM><security>{security}</security></MSM>\
        </WLANProfile>"
    )
}

fn profile_exists(session: &WlanSession, guid: &GUID, name: &str) -> bool {
    unsafe {
        let name = wide_null(name);
        let mut xml = PWSTR::null();
        let rc = WlanGetProfile(
            session.handle,
            guid,
            PCWSTR(name.as_ptr()),
            None,
            &mut xml,
            None,
            None,
        );
        if !xml.0.is_null() {
            WlanFreeMemory(xml.0 as *const c_void);
        }
        rc == 0
    }
}

fn wait_for_wifi(session: &WlanSession, guid: &GUID, ssid: &str) -> Result<(), String> {
    // WlanConnect is asynchronous. Wait briefly so the UI can report a wrong
    // password instead of silently showing the old network.
    for _ in 0..20 {
        if current_ssid(session, guid).as_deref() == Some(ssid) {
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(400));
    }
    Err("Windows could not connect. Check the password and that the network is in range.".to_string())
}

fn connect_profile(
    session: &WlanSession,
    guid: &GUID,
    profile_name: &str,
    raw_ssid: Option<&DOT11_SSID>,
) -> Result<(), String> {
    let profile = wide_null(profile_name);
    let mut ssid = raw_ssid.copied();
    let parameters = WLAN_CONNECTION_PARAMETERS {
        wlanConnectionMode: wlan_connection_mode_profile,
        strProfile: PCWSTR(profile.as_ptr()),
        pDot11Ssid: ssid
            .as_mut()
            .map_or(std::ptr::null_mut(), |ssid| ssid as *mut DOT11_SSID),
        pDesiredBssidList: std::ptr::null_mut(),
        dot11BssType: dot11_BSS_type_infrastructure,
        dwFlags: 0,
    };
    unsafe {
        let rc = WlanConnect(session.handle, guid, &parameters, None);
        if rc != 0 {
            return Err(format!("Windows rejected the Wi-Fi connection (error {rc})"));
        }
    }
    Ok(())
}

pub(crate) fn connect_wifi_sync(ssid: &str, password: Option<&str>) -> Result<(), String> {
    let ssid = ssid.trim();
    if ssid.is_empty() {
        return Err("Choose a Wi-Fi network first".to_string());
    }

    let (session, guid) = open_wlan()?;
    let mut location_required = false;
    let network = match read_available_networks(&session, &guid) {
        Ok(networks) => networks.into_iter().find(|n| n.ssid == ssid),
        Err(error) if error == LOCATION_REQUIRED => {
            location_required = true;
            None
        }
        Err(error) => return Err(error),
    };

    if let Some(network) = network {
        let profile_name = if network.profile_name.is_empty() {
            network.ssid.clone()
        } else {
            network.profile_name.clone()
        };

        let mut created_profile = false;
        if !profile_exists(&session, &guid, &profile_name) {
            if network.secured && password.map_or(true, |p| p.trim().is_empty()) {
                return Err("This network needs a password".to_string());
            }
            let xml = build_profile_xml(&network.ssid, password, network.secured, network.wpa3);
            let xml = wide_null(&xml);
            let mut reason = 0u32;
            unsafe {
                let rc = WlanSetProfile(
                    session.handle,
                    &guid,
                    0,
                    PCWSTR(xml.as_ptr()),
                    PCWSTR::null(),
                    true,
                    None,
                    &mut reason,
                );
                if rc != 0 {
                    return Err(format!(
                        "Windows could not save the Wi-Fi profile (error {rc}, reason {reason})"
                    ));
                }
            }
            created_profile = true;
        }

        let result = (|| -> Result<(), String> {
            connect_profile(&session, &guid, &profile_name, Some(&network.raw_ssid))?;
            wait_for_wifi(&session, &guid, &network.ssid)
        })();

        // A wrong password leaves a saved profile behind. Removing only the
        // profile we just created lets the next attempt use a corrected password
        // instead of silently reusing the bad key.
        if result.is_err() && created_profile {
            let profile_name = wide_null(&profile_name);
            unsafe {
                let _ = WlanDeleteProfile(
                    session.handle,
                    &guid,
                    PCWSTR(profile_name.as_ptr()),
                    None,
                );
            }
        }

        return result;
    }

    // The network is not in the nearby list (out of range, or Location services
    // are off). A saved profile still lets Windows connect to it.
    if let Some(profile_name) = saved_profile_names(&session, &guid)
        .into_iter()
        .find(|name| name == ssid)
    {
        connect_profile(&session, &guid, &profile_name, None)?;
        return wait_for_wifi(&session, &guid, ssid);
    }

    Err(if location_required {
        "Nearby Wi-Fi scanning needs Windows Location Services. Turn it on, or connect from Windows Settings.".to_string()
    } else {
        "That network is no longer in range. Scan again.".to_string()
    })
}

pub(crate) fn disconnect_wifi_sync() -> Result<(), String> {
    let (session, guid) = open_wlan()?;
    unsafe {
        let rc = WlanDisconnect(session.handle, &guid, None);
        // 5023 = ERROR_NOT_CONNECTED; disconnecting an idle radio is a no-op.
        if rc != 0 && rc != 5023 {
            return Err(format!("Could not disconnect Wi-Fi (error {rc})"));
        }
    }
    Ok(())
}

#[tauri::command]
pub fn open_location_settings() {
    unsafe {
        use windows::Win32::UI::Shell::ShellExecuteA;
        use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;
        let _ = ShellExecuteA(
            None,
            windows::core::PCSTR(c"open".as_ptr() as *const u8),
            windows::core::PCSTR(c"ms-settings:privacy-location".as_ptr() as *const u8),
            windows::core::PCSTR::null(),
            windows::core::PCSTR::null(),
            SW_SHOWNORMAL,
        );
    }
}

// ── Bluetooth ────────────────────────────────────────────────────────────────

fn bluetooth_devices_sync() -> Result<Vec<BluetoothDeviceInfo>, String> {
    use windows::Devices::Bluetooth::{BluetoothConnectionStatus, BluetoothDevice};
    use windows::Devices::Enumeration::DeviceInformation;

    unsafe {
        let _ = windows::Win32::System::Com::CoInitializeEx(
            None,
            windows::Win32::System::Com::COINIT_MULTITHREADED,
        );
    }

    let selector = BluetoothDevice::GetDeviceSelectorFromPairingState(true)
        .map_err(|e| format!("Bluetooth selector failed: {e}"))?;
    let devices = DeviceInformation::FindAllAsyncAqsFilter(&selector)
        .and_then(|operation| operation.get())
        .map_err(|e| format!("Could not list Bluetooth devices: {e}"))?;

    let count = devices.Size().unwrap_or(0);
    let mut result = Vec::new();
    for index in 0..count {
        let Ok(info) = devices.GetAt(index) else {
            continue;
        };
        let name = info
            .Name()
            .map(|name| name.to_string_lossy())
            .unwrap_or_default();
        let Ok(id) = info.Id() else {
            continue;
        };
        let Ok(device) = BluetoothDevice::FromIdAsync(&id).and_then(|operation| operation.get())
        else {
            continue;
        };
        let address = device.BluetoothAddress().unwrap_or(0);
        let connected = device.ConnectionStatus().ok() == Some(BluetoothConnectionStatus::Connected);
        let name = if name.trim().is_empty() {
            "Unknown device".to_string()
        } else {
            name
        };
        result.push(BluetoothDeviceInfo {
            name,
            address,
            connected,
        });
    }

    result.sort_by(|a, b| {
        b.connected
            .cmp(&a.connected)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    result.truncate(40);
    Ok(result)
}

// ── Tauri commands ───────────────────────────────────────────────────────────

#[tauri::command]
pub async fn scan_wifi_networks() -> Result<WifiScanResult, String> {
    tauri::async_runtime::spawn_blocking(|| list_wifi_networks_sync(true))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn connect_wifi(ssid: String, password: Option<String>) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || connect_wifi_sync(&ssid, password.as_deref()))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn disconnect_wifi() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(disconnect_wifi_sync)
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_bluetooth_devices() -> Result<Vec<BluetoothDeviceInfo>, String> {
    tauri::async_runtime::spawn_blocking(bluetooth_devices_sync)
        .await
        .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escapes_xml_in_profile_fields() {
        let xml = build_profile_xml("Café & Co <5G>", Some("p&ss<word>"), true, false);
        assert!(xml.contains("<name>Café &amp; Co &lt;5G&gt;</name>"));
        assert!(xml.contains("<keyMaterial>p&amp;ss&lt;word&gt;</keyMaterial>"));
        assert!(xml.contains("<authentication>WPA2PSK</authentication>"));
    }

    #[test]
    fn open_profile_has_no_shared_key() {
        let xml = build_profile_xml("Guest", None, false, false);
        assert!(xml.contains("<authentication>open</authentication>"));
        assert!(xml.contains("<encryption>none</encryption>"));
        assert!(!xml.contains("<sharedKey>"));
    }

    #[test]
    fn wpa3_profile_uses_sae() {
        let xml = build_profile_xml("Home", Some("secret123"), true, true);
        assert!(xml.contains("<authentication>WPA3SAE</authentication>"));
    }

    #[test]
    fn ssid_round_trip_and_trimming() {
        let mut ssid = DOT11_SSID::default();
        ssid.uSSIDLength = 5;
        ssid.ucSSID[..5].copy_from_slice(b"Hello");
        assert_eq!(ssid_to_string(&ssid).as_deref(), Some("Hello"));

        let wide = wide_null("Hello");
        assert_eq!(wide_array_to_string(&wide), "Hello");
    }

    #[test]
    #[ignore = "requires a Wi-Fi adapter; run manually on Windows"]
    fn live_scan_smoke_test() {
        let result = list_wifi_networks_sync(false).expect("scan should work");
        eprintln!(
            "found {} networks (location_required={})",
            result.networks.len(),
            result.location_required
        );
        // Don't print SSIDs: they identify the user's networks in logs.
        for (index, network) in result.networks.iter().take(5).enumerate() {
            eprintln!(
                "network {index}: {}%, secured={}, connected={}, saved={}",
                network.signal, network.secured, network.connected, network.has_profile
            );
        }
    }

    #[test]
    #[ignore = "requires paired Bluetooth devices; run manually on Windows"]
    fn live_bluetooth_smoke_test() {
        let devices = bluetooth_devices_sync().expect("bluetooth enumeration should work");
        let connected = devices.iter().filter(|device| device.connected).count();
        // Device names are personal; report counts only.
        eprintln!(
            "found {} paired Bluetooth devices ({} connected)",
            devices.len(),
            connected
        );
    }
}
