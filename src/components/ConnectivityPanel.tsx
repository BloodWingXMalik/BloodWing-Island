import { Fragment, useEffect, useState } from "react";
import {
  Bluetooth,
  Check,
  Loader2,
  Lock,
  RefreshCw,
  Settings2,
  Wifi,
} from "lucide-react";
import type {
  BluetoothDeviceInfo,
  WifiNetwork,
  WifiStatus,
} from "../types/connectivity";

interface ConnectivityPanelProps {
  wifi: WifiStatus | null;
  networks: WifiNetwork[];
  scanning: boolean;
  connectingSsid: string | null;
  locationRequired: boolean;
  bluetoothEnabled: boolean;
  bluetoothDevices: BluetoothDeviceInfo[];
  bluetoothLoading: boolean;
  error: string | null;
  onToggleWifi: () => void;
  onToggleBluetooth: () => void;
  onRefresh: () => void;
  onConnect: (network: WifiNetwork, password?: string) => void;
  onDisconnect: () => void;
  onOpenLocationSettings: () => void;
  onOpenBluetoothSettings: () => void;
}

function SignalBars({ value }: { value: number }) {
  const level = value >= 75 ? 4 : value >= 50 ? 3 : value >= 25 ? 2 : value > 0 ? 1 : 0;
  return (
    <span className="bw-conn-signal" aria-hidden="true">
      {[1, 2, 3, 4].map((bar) => (
        <i
          key={bar}
          className={bar <= level ? "on" : ""}
          style={{ height: `${3 + bar * 2}px` }}
        />
      ))}
    </span>
  );
}

function networkSubtitle(network: WifiNetwork, connecting: boolean): string {
  if (connecting) return "Connecting…";
  if (network.connected) return "Connected";
  if (network.has_profile) return "Saved";
  if (network.secured) return "Secured";
  return "Open";
}

export function ConnectivityPanel({
  wifi,
  networks,
  scanning,
  connectingSsid,
  locationRequired,
  bluetoothEnabled,
  bluetoothDevices,
  bluetoothLoading,
  error,
  onToggleWifi,
  onToggleBluetooth,
  onRefresh,
  onConnect,
  onDisconnect,
  onOpenLocationSettings,
  onOpenBluetoothSettings,
}: ConnectivityPanelProps) {
  const [passwordFor, setPasswordFor] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [revealPassword, setRevealPassword] = useState(false);

  const connectedCount = bluetoothDevices.filter((device) => device.connected).length;
  const wifiEnabled = wifi?.enabled ?? false;
  const wifiOff = wifi !== null && !wifi.enabled;

  // If the network list changes underneath an open password prompt, close it
  // rather than submitting a password for a stale SSID. Also close it once the
  // target connects or Wi-Fi is switched off.
  useEffect(() => {
    if (!passwordFor) return;
    const target = networks.find((network) => network.ssid === passwordFor);
    if (!target || target.connected || !wifi?.enabled) {
      setPasswordFor(null);
      setPassword("");
      setRevealPassword(false);
    }
  }, [networks, passwordFor, wifi?.enabled]);

  const chooseNetwork = (network: WifiNetwork) => {
    if (connectingSsid || network.connected) return;
    if (network.has_profile) {
      onConnect(network);
      return;
    }
    if (network.secured) {
      setPasswordFor(network.ssid);
      setPassword("");
      setRevealPassword(false);
      return;
    }
    onConnect(network);
  };

  const submitPassword = (event: React.FormEvent, network: WifiNetwork) => {
    event.preventDefault();
    if (!password.trim() || connectingSsid) return;
    onConnect(network, password);
  };

  const wifiSubtitle = !wifi
    ? "Checking…"
    : !wifi.enabled
      ? "Off"
      : wifi.connected
        ? wifi.ssid
          ? `Connected to ${wifi.ssid}`
          : "Connected"
        : "Not connected";

  const bluetoothSubtitle = !bluetoothEnabled
    ? "Off"
    : connectedCount > 0
      ? `${connectedCount} connected`
      : "On";

  return (
    <div className="bw-conn-panel" onClick={(event) => event.stopPropagation()}>
      <section className={`bw-conn-section ${wifiEnabled ? "bw-conn-wifi-on" : ""}`}>
        <header className="bw-conn-head">
          <span className={`bw-conn-icon ${wifiEnabled ? "on" : ""}`}>
            <Wifi size={15} strokeWidth={2.3} />
          </span>
          <div className="bw-conn-titles">
            <span className="bw-conn-title">Wi-Fi</span>
            <span className="bw-conn-sub" title={wifiSubtitle}>{wifiSubtitle}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={wifiEnabled}
            aria-label="Toggle Wi-Fi"
            className={`bw-conn-switch ${wifiEnabled ? "on" : ""}`}
            onClick={onToggleWifi}
          >
            <span />
          </button>
        </header>

        {wifiEnabled ? (
          <>
            <div className="bw-conn-toolbar">
              <button type="button" onClick={onRefresh} disabled={scanning}>
                {scanning ? (
                  <Loader2 size={11} className="bw-conn-spin" />
                ) : (
                  <RefreshCw size={11} />
                )}
                Refresh
              </button>
              {wifi?.connected && (
                <button type="button" onClick={onDisconnect}>
                  Disconnect
                </button>
              )}
            </div>

            {locationRequired && (
              <div className="bw-conn-notice">
                <span>Windows location is off — showing saved networks.</span>
                <button type="button" onClick={onOpenLocationSettings}>
                  Location settings
                </button>
              </div>
            )}

            <div className="bw-conn-list">
              {scanning && networks.length === 0 ? (
                <div className="bw-conn-empty">
                  <Loader2 size={13} className="bw-conn-spin" /> Scanning…
                </div>
              ) : networks.length === 0 ? (
                <div className="bw-conn-empty">
                  {locationRequired ? "No saved networks yet" : "No networks found"}
                </div>
              ) : (
                networks.map((network) => {
                  const connecting = connectingSsid === network.ssid;
                  const showPassword = passwordFor === network.ssid;
                  return (
                    <Fragment key={network.ssid}>
                      <button
                        type="button"
                        className={`bw-conn-row ${network.connected ? "connected" : ""}`}
                        onClick={() => chooseNetwork(network)}
                        disabled={Boolean(connectingSsid)}
                      >
                        {network.signal > 0 ? (
                          <SignalBars value={network.signal} />
                        ) : (
                          <Wifi size={13} className="bw-conn-saved-icon" />
                        )}
                        <span className="bw-conn-row-main">
                          <span className="bw-conn-row-name" title={network.ssid}>
                            {network.ssid}
                          </span>
                          <span className="bw-conn-row-sub">
                            {networkSubtitle(network, connecting)}
                          </span>
                        </span>
                        {connecting ? (
                          <Loader2 size={13} className="bw-conn-spin" />
                        ) : network.connected ? (
                          <Check size={13} className="bw-conn-check" />
                        ) : network.secured && !network.has_profile ? (
                          <Lock size={11} className="bw-conn-lock" />
                        ) : null}
                      </button>

                      {showPassword && (
                        <form
                          className="bw-conn-password"
                          onSubmit={(event) => submitPassword(event, network)}
                        >
                          <div className="bw-conn-password-input">
                            <input
                              autoFocus
                              type={revealPassword ? "text" : "password"}
                              value={password}
                              placeholder={`Password for ${network.ssid}`}
                              aria-label={`Password for ${network.ssid}`}
                              onChange={(event) => setPassword(event.target.value)}
                            />
                            <button
                              type="button"
                              className="bw-conn-reveal"
                              onClick={() => setRevealPassword((value) => !value)}
                              aria-label={revealPassword ? "Hide password" : "Show password"}
                            >
                              {revealPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                          <div className="bw-conn-password-actions">
                            <button
                              type="button"
                              className="bw-conn-cancel"
                              onClick={() => {
                                setPasswordFor(null);
                                setPassword("");
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bw-conn-connect"
                              disabled={!password.trim() || Boolean(connectingSsid)}
                            >
                              Connect
                            </button>
                          </div>
                        </form>
                      )}
                    </Fragment>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="bw-conn-empty bw-conn-off">
            {wifiOff ? "Wi-Fi is off" : "Checking Wi-Fi…"}
          </div>
        )}
      </section>

      <section className="bw-conn-section bw-conn-bluetooth">
        <header className="bw-conn-head">
          <span className={`bw-conn-icon ${bluetoothEnabled ? "on" : ""}`}>
            <Bluetooth size={15} strokeWidth={2.3} />
          </span>
          <div className="bw-conn-titles">
            <span className="bw-conn-title">Bluetooth</span>
            <span className="bw-conn-sub">{bluetoothSubtitle}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={bluetoothEnabled}
            aria-label="Toggle Bluetooth"
            className={`bw-conn-switch ${bluetoothEnabled ? "on" : ""}`}
            onClick={onToggleBluetooth}
          >
            <span />
          </button>
        </header>

        {bluetoothEnabled ? (
          <>
            <div className="bw-conn-toolbar">
              <button type="button" onClick={onOpenBluetoothSettings}>
                <Settings2 size={11} />
                Pair new device
              </button>
            </div>
            <div className="bw-conn-list bw-conn-bt-list">
              {bluetoothLoading && bluetoothDevices.length === 0 ? (
                <div className="bw-conn-empty">
                  <Loader2 size={13} className="bw-conn-spin" /> Loading devices…
                </div>
              ) : bluetoothDevices.length === 0 ? (
                <div className="bw-conn-empty">
                  No paired devices. Use “Pair new device” to open Windows Settings.
                </div>
              ) : (
                bluetoothDevices.map((device) => (
                  <div
                    className="bw-conn-row bw-conn-device"
                    key={`${device.address}-${device.name}`}
                  >
                    <Bluetooth
                      size={13}
                      className={device.connected ? "bw-conn-bt-on" : "bw-conn-bt-off"}
                    />
                    <span className="bw-conn-row-main">
                      <span className="bw-conn-row-name" title={device.name}>
                        {device.name}
                      </span>
                      <span className="bw-conn-row-sub">
                        {device.connected ? "Connected" : "Paired"}
                      </span>
                    </span>
                    {device.connected && <Check size={13} className="bw-conn-check" />}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="bw-conn-empty bw-conn-off">Bluetooth is off</div>
        )}
      </section>

      {error && <div className="bw-conn-error">{error}</div>}
    </div>
  );
}
