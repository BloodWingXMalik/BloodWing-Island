export interface WifiStatus {
    enabled: boolean;
    connected: boolean;
    ssid?: string | null;
}

export interface WifiNetwork {
    ssid: string;
    signal: number;
    secured: boolean;
    connected: boolean;
    has_profile: boolean;
}

export interface WifiScanResult {
    networks: WifiNetwork[];
    location_required: boolean;
}

export interface BluetoothDeviceInfo {
    name: string;
    address: number;
    connected: boolean;
}
