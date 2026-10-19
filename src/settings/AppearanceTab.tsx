import { Palette, Droplet, Contrast, Droplets, Sun, Square, Maximize2, Accessibility, Activity } from "lucide-react";
import { SettingRow } from "./SettingRow";
import { Dropdown } from "./Dropdown";

// Curated accent colors for the BloodWing identity (first entry is the default).
const ACCENT_PRESETS = [
  { value: "#b51f2e", label: "Blood Red" },
  { value: "#e5484d", label: "Crimson" },
  { value: "#e07a2f", label: "Ember" },
  { value: "#e3b341", label: "Amber" },
  { value: "#3fb950", label: "Emerald" },
  { value: "#2f81f7", label: "Azure" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#d946ef", label: "Magenta" },
];

interface AppearanceTabProps {
  themeMode: string;
  handleThemeModeChange: (mode: string) => void;
  themeColor: string;
  handleThemeColorChange: (color: string) => void;
  themeOpacity: number;
  handleOpacityChange: (val: number) => void;
  themeSaturation: number;
  handleSaturationChange: (val: number) => void;
  themeBrightness: number;
  handleBrightnessChange: (val: number) => void;
  reduceMotion: string;
  handleReduceMotionChange: (val: string) => void;
  motionIntensity: string;
  handleMotionIntensityChange: (val: string) => void;
  cornersEnabled: boolean;
  toggleCorners: () => void;
  scale: number;
  handleScaleChange: (val: number) => void;
}

export function AppearanceTab({
  themeMode,
  handleThemeModeChange,
  themeColor,
  handleThemeColorChange,
  themeOpacity,
  handleOpacityChange,
  themeSaturation,
  handleSaturationChange,
  themeBrightness,
  handleBrightnessChange,
  reduceMotion,
  handleReduceMotionChange,
  motionIntensity,
  handleMotionIntensityChange,
  cornersEnabled,
  toggleCorners,
  scale,
  handleScaleChange,
}: AppearanceTabProps) {
  const showCustomColor = themeMode === "custom";
  const showAdvancedSliders = themeMode === "custom" || themeMode === "adaptive";
  // The accent color is configurable in dark and light mode; custom mode uses
  // the theme color for both background and accent, adaptive follows Windows.
  const showAccentColor = themeMode === "dark" || themeMode === "light";

  return (
    <>
      <div className="setting-group-label">Theme</div>
      <div className="setting-group">
        <SettingRow icon={Palette} label="Theme Mode" desc="Configure visual styling">
          <Dropdown
            value={themeMode}
            onChange={handleThemeModeChange}
            options={[
              { value: "dark", label: "Dark (Translucent)" },
              { value: "light", label: "Light (Translucent)" },
              { value: "custom", label: "Custom Color" },
              { value: "adaptive", label: "Adaptive Accent" },
            ]}
          />
        </SettingRow>

        {showCustomColor && (
          <SettingRow icon={Droplet} label="Custom Theme Color" desc="Choose layout background color">
            <div className="color-picker-row">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => handleThemeColorChange(e.target.value)}
                className="color-picker-input"
              />
              <span className="color-picker-label">{themeColor.toUpperCase()}</span>
            </div>
          </SettingRow>
        )}

        {showAccentColor && (
          <SettingRow icon={Droplet} label="Accent Color" desc="Highlight color used across the app">
            <div className="bw-preset-row">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`bw-preset-swatch ${themeColor.toLowerCase() === preset.value ? "active" : ""}`}
                  style={{ background: preset.value }}
                  title={preset.label}
                  aria-label={preset.label}
                  onClick={() => handleThemeColorChange(preset.value)}
                />
              ))}
              <input
                type="color"
                value={themeColor}
                onChange={(e) => handleThemeColorChange(e.target.value)}
                className="bw-preset-custom"
                title="Custom accent color"
                aria-label="Custom accent color"
              />
            </div>
          </SettingRow>
        )}

        <SettingRow
          icon={Contrast}
          label="Background Opacity"
          desc={`Adjust theme transparency (${Math.round(themeOpacity * 100)}%)`}
          divider={showAdvancedSliders}
        >
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={themeOpacity}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            className="settings-slider"
          />
        </SettingRow>

        {showAdvancedSliders && (
          <>
            <SettingRow
              icon={Droplets}
              label="Color Saturation"
              desc={`Adjust theme color vibrancy (${Math.round(themeSaturation * 100)}%)`}
            >
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={themeSaturation}
                onChange={(e) => handleSaturationChange(parseFloat(e.target.value))}
                className="settings-slider"
              />
            </SettingRow>

            <SettingRow
              icon={Sun}
              label="Background Brightness"
              desc={`Adjust background lightness (${Math.round(themeBrightness * 100)}%)`}
              divider={false}
            >
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={themeBrightness}
                onChange={(e) => handleBrightnessChange(parseFloat(e.target.value))}
                className="settings-slider"
              />
            </SettingRow>
          </>
        )}
      </div>

      <div className="setting-group-label">Display</div>
      <div className="setting-group">
        <SettingRow icon={Square} label="Screen Corners" desc="Rounded top edges">
          <label className="toggle-switch">
            <input type="checkbox" checked={cornersEnabled} onChange={toggleCorners} />
            <span className="slider"></span>
          </label>
        </SettingRow>

        <SettingRow
          icon={Maximize2}
          label="UI & Font Scale"
          desc={`Adjust desktop size (${Math.round(scale * 100)}%)`}
          divider={false}
        >
          <div className="scale-button-container">
            <button
              onClick={() => handleScaleChange(Math.max(0.8, parseFloat((scale - 0.1).toFixed(1))))}
              disabled={scale <= 0.8}
              className="scale-adjust-btn"
              title="Decrease Scale"
            >
              —
            </button>
            <span className="scale-display-value">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => handleScaleChange(Math.min(1.3, parseFloat((scale + 0.1).toFixed(1))))}
              disabled={scale >= 1.3}
              className="scale-adjust-btn"
              title="Increase Scale"
            >
              +
            </button>
          </div>
        </SettingRow>
      </div>

      <div className="setting-group-label setting-group-label--spaced">Motion</div>
      <div className="setting-group">
        <SettingRow
          icon={Accessibility}
          label="Reduce Motion"
          desc="Windows animations, ambient glows and loops"
        >
          <Dropdown
            value={reduceMotion}
            onChange={handleReduceMotionChange}
            options={[
              { value: "system", label: "Follow Windows" },
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
          />
        </SettingRow>

        <SettingRow
          icon={Activity}
          label="Motion Intensity"
          desc="How much decorative motion plays"
          divider={false}
        >
          <Dropdown
            value={motionIntensity}
            onChange={handleMotionIntensityChange}
            options={[
              { value: "full", label: "Full" },
              { value: "balanced", label: "Balanced" },
              { value: "minimal", label: "Minimal" },
            ]}
          />
        </SettingRow>
      </div>
    </>
  );
}
