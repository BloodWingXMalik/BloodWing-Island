import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { listen } from "@tauri-apps/api/event";

/**
 * BloodWing motion preferences.
 *
 * Two independent settings drive every animation in the app:
 *
 * - `nectar-reduce-motion`  "system" | "on" | "off"  (default "system")
 *   "system" follows the Windows "Show animations in Windows" setting via
 *   `prefers-reduced-motion`. "on" forces reduced motion, "off" forces full
 *   motion even when Windows asks for less.
 *
 * - `nectar-motion-intensity`  "full" | "balanced" | "minimal" (default "full")
 *   Controls decorative motion (ambient glow, marquees, pulses) and trims CSS
 *   transition durations. It never disables a functional state change.
 *
 * The CSS side reads the `bw-reduce-motion`, `bw-motion-balanced` and
 * `bw-motion-minimal` classes this module puts on `<html>`; framer-motion
 * reads the value returned by `useMotionPreference()` through `MotionConfig`.
 */

export type ReducedMotionSetting = "system" | "on" | "off";
export type MotionIntensity = "full" | "balanced" | "minimal";
export type MotionPreference = "always" | "never" | "user";

const REDUCE_KEY = "nectar-reduce-motion";
const INTENSITY_KEY = "nectar-motion-intensity";

const MOTION_KEYS = [REDUCE_KEY, INTENSITY_KEY];

function readReducedMotionSetting(): ReducedMotionSetting {
    const raw = localStorage.getItem(REDUCE_KEY);
    return raw === "on" || raw === "off" ? raw : "system";
}

function readIntensity(): MotionIntensity {
    const raw = localStorage.getItem(INTENSITY_KEY);
    return raw === "balanced" || raw === "minimal" ? raw : "full";
}

function systemPrefersReduced(): boolean {
    try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
        return false;
    }
}

function isReduced(setting: ReducedMotionSetting): boolean {
    if (setting === "on") return true;
    if (setting === "off") return false;
    return systemPrefersReduced();
}

function applyClasses() {
    const root = document.documentElement;
    const reduced = isReduced(readReducedMotionSetting());
    const intensity = readIntensity();

    root.classList.toggle("bw-reduce-motion", reduced);
    root.classList.toggle("bw-motion-balanced", intensity === "balanced");
    root.classList.toggle("bw-motion-minimal", intensity === "minimal");
}

const listeners = new Set<() => void>();

function notify() {
    applyClasses();
    listeners.forEach((fn) => fn());
}

/** Framer-motion's `MotionConfig` value for the current preference. */
export function motionConfigValue(): MotionPreference {
    const setting = readReducedMotionSetting();
    if (setting === "on") return "always";
    if (setting === "off") return "never";
    return "user";
}

/**
 * Subscribes React to motion preference changes. Returns the framer-motion
 * `reducedMotion` mode to hand to `MotionConfig`.
 */
export function useMotionPreference(): MotionPreference {
    const [value, setValue] = useState<MotionPreference>(motionConfigValue);

    useEffect(() => {
        const update = () => setValue(motionConfigValue());
        listeners.add(update);
        return () => {
            listeners.delete(update);
        };
    }, []);

    return value;
}

/**
 * Applies the current preference to `<html>` immediately and keeps it in sync
 * with Windows and with settings edits from any window. Safe to call more than
 * once; returns a cleanup function.
 */
export function initMotionPreference(): () => void {
    applyClasses();

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMediaChange = () => {
        if (readReducedMotionSetting() === "system") notify();
    };
    media.addEventListener("change", onMediaChange);

    const settingsPromise = listen<{ key: string; value: unknown }>("settings-changed", (event) => {
        if (MOTION_KEYS.includes(event.payload.key)) notify();
    }).catch(() => () => {});
    const externalPromise = listen<{ key: string; value: unknown }>("settings-external-changed", (event) => {
        if (MOTION_KEYS.includes(event.payload.key)) notify();
    }).catch(() => () => {});

    return () => {
        media.removeEventListener("change", onMediaChange);
        settingsPromise.then((fn) => fn());
        externalPromise.then((fn) => fn());
        listeners.clear();
    };
}

/** Current intensity class suffix, for components that render decorative extras. */
export function currentMotionIntensity(): MotionIntensity {
    return readIntensity();
}

/**
 * Wraps a window's React tree so every framer-motion animation follows the
 * motion preference. The window's entry file must call `initMotionPreference()`
 * once (module scope) to apply the CSS classes and keep them in sync.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
    const reducedMotion = useMotionPreference();
    return <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>;
}
