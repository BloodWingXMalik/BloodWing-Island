# Restores the Windows taskbar after a BloodWing (or Nectar) session left it hidden.
#
# When is this needed?
#   BloodWing hides the native taskbar while the dock replaces it. It restores the
#   taskbar on every normal exit path and on the next launch after a crash (via the
#   taskbar_hidden.flag marker). This script is the manual emergency fallback for the
#   rare case where neither happened -- for example if the app was force-killed and you
#   do not want to start it again, or the app itself cannot start.
#
# What it does (no admin rights needed):
#   1. Shows Shell_TrayWnd and every Shell_SecondaryTrayWnd window again.
#   2. Removes the taskbar_hidden.flag markers so the next BloodWing/Nectar launch
#      starts from a clean state.
#
# Recommended order: quit BloodWing first (tray icon > Quit BloodWing, or Task Manager).
# If BloodWing is still running it may re-hide the taskbar on the next dock event --
# quitting it first avoids that.
#
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/restore-taskbar.ps1

$ErrorActionPreference = "Stop"

Add-Type -Namespace Win32 -Name Taskbar -MemberDefinition @'
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, System.Text.StringBuilder lpClassName, int nMaxCount);
'@

$SW_SHOWNA = 8  # show without activating

Write-Host "Restoring the Windows taskbar..."

$restored = New-Object System.Collections.Generic.List[string]
$callback = [Win32.Taskbar+EnumWindowsProc] {
    param($hwnd, $lParam)
    $sb = New-Object System.Text.StringBuilder 256
    [void][Win32.Taskbar]::GetClassName($hwnd, $sb, 256)
    $cls = $sb.ToString()
    if ($cls -eq "Shell_TrayWnd" -or $cls -eq "Shell_SecondaryTrayWnd") {
        [void][Win32.Taskbar]::ShowWindow($hwnd, $SW_SHOWNA)
        $visible = [Win32.Taskbar]::IsWindowVisible($hwnd)
        $restored.Add(("{0} (visible={1})" -f $cls, $visible))
    }
    return $true
}
[void][Win32.Taskbar]::EnumWindows($callback, [IntPtr]::Zero)

if ($restored.Count -eq 0) {
    Write-Host "  No taskbar windows found. Explorer may be restarting -- try again in a few seconds, or restart Explorer from Task Manager."
} else {
    foreach ($entry in $restored) {
        Write-Host "  $entry"
    }
}

# Clear the crash-recovery markers for both this build and a legacy Nectar install.
$markers = @(
    (Join-Path $env:APPDATA "com.bloodwing.notch\taskbar_hidden.flag"),
    (Join-Path $env:APPDATA "com.kua8.nectar\taskbar_hidden.flag")
)
foreach ($marker in $markers) {
    if (Test-Path -LiteralPath $marker) {
        Remove-Item -LiteralPath $marker -Force
        Write-Host "  removed marker: $marker"
    }
}

Write-Host "Done. If the taskbar is still hidden, restart Explorer (Task Manager > Windows Explorer > Restart) and run this script again."
