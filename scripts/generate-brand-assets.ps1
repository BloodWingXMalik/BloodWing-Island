# BloodWing brand asset generator.
#
# Renders the BloodWing mark (a hardware-notch silhouette with three swept wing
# chevrons) with GDI+ and writes:
#   - public/bloodwing-logo.png        1024x1024 master, used as the app mark
#   - installer/assets/header.bmp      NSIS wizard header (150x57)
#   - installer/assets/sidebar.bmp     NSIS wizard sidebar (164x314)
#
# The Tauri icon set (src-tauri/icons/*) is generated separately from the master
# PNG with `bun run tauri icon public/bloodwing-logo.png`, so the .ico file is
# produced by Tauri's own tooling instead of being hand-rolled here.
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts/generate-brand-assets.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Resolve-Path "$PSScriptRoot/.."
$publicDir = Join-Path $root "public"
$installerAssets = Join-Path $root "installer/assets"

# BloodWing palette
$bgTop = [System.Drawing.Color]::FromArgb(255, 21, 23, 28)     # #15171C
$bgBottom = [System.Drawing.Color]::FromArgb(255, 11, 12, 15)  # #0B0C0F
$markLight = [System.Drawing.Color]::FromArgb(255, 243, 244, 246) # #F3F4F6
$accentHi = [System.Drawing.Color]::FromArgb(255, 208, 44, 61)  # #D02C3D
$accentLo = [System.Drawing.Color]::FromArgb(255, 142, 22, 34)  # #8E1622
$edge = [System.Drawing.Color]::FromArgb(26, 255, 255, 255)

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

# Draws the mark inside a square canvas of $size, scaled from a 1024 design grid.
function Draw-Mark([System.Drawing.Graphics]$g, [float]$size, [bool]$withBackplate) {
    $s = $size / 1024.0
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    if ($withBackplate) {
        $r = 232 * $s
        $back = New-RoundedPath 0 0 $size $size $r
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            (New-Object System.Drawing.PointF 0, 0),
            (New-Object System.Drawing.PointF 0, $size),
            $bgTop, $bgBottom)
        $g.FillPath($brush, $back)
        $brush.Dispose()

        $pen = New-Object System.Drawing.Pen $edge, (2 * $s)
        $g.DrawPath($pen, $back)
        $pen.Dispose()
        $back.Dispose()
    }

    # Notch silhouette (rounded bar) at the top.
    $notch = New-RoundedPath (248 * $s) (232 * $s) (528 * $s) (132 * $s) (66 * $s)
    $notchBrush = New-Object System.Drawing.SolidBrush $markLight
    $g.FillPath($notchBrush, $notch)
    $notchBrush.Dispose()
    $notch.Dispose()

    # Three wing chevrons, decreasing in span, with a red gradient.
    $wingBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF (240 * $s), (430 * $s)),
        (New-Object System.Drawing.PointF (784 * $s), (760 * $s)),
        $accentHi, $accentLo)

    $spans = @(392.0, 312.0, 232.0)
    $tops = @(446.0, 556.0, 666.0)
    for ($i = 0; $i -lt 3; $i++) {
        $w = $spans[$i] * $s
        $y = $tops[$i] * $s
        $cx = 512 * $s
        $depth = 92 * $s
        $thickness = (58 - $i * 8) * $s

        $pts = @(
            (New-Object System.Drawing.PointF (($cx - $w / 2), $y)),
            (New-Object System.Drawing.PointF ($cx, ($y + $depth))),
            (New-Object System.Drawing.PointF (($cx + $w / 2), $y))
        )
        $pen = New-Object System.Drawing.Pen $wingBrush, $thickness
        $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        $g.DrawLines($pen, [System.Drawing.PointF[]]$pts)
        $pen.Dispose()
    }
    $wingBrush.Dispose()
}

function New-MasterPng([int]$size, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    Draw-Mark $g $size $true
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

New-Item -ItemType Directory -Force -Path $publicDir, $installerAssets | Out-Null

New-MasterPng 1024 (Join-Path $publicDir "bloodwing-logo.png")
Write-Host "wrote public/bloodwing-logo.png"

# NSIS wizard bitmaps: dark plate, small mark on the left, wordmark on the right.
function New-WizardBitmap([int]$w, [int]$h, [string]$path, [bool]$vertical) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF 0, 0),
        (New-Object System.Drawing.PointF 0, $h),
        $bgTop, $bgBottom)
    $g.FillRectangle($brush, 0, 0, $w, $h)
    $brush.Dispose()

    $markSize = if ($vertical) { [Math]::Min($w - 24, 96) } else { 36 }
    $mx = if ($vertical) { ($w - $markSize) / 2 } else { 10 }
    $my = if ($vertical) { 26 } else { ($h - $markSize) / 2 }

    $mark = New-Object System.Drawing.Bitmap $markSize, $markSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $mg = [System.Drawing.Graphics]::FromImage($mark)
    $mg.Clear([System.Drawing.Color]::Transparent)
    Draw-Mark $mg $markSize $false
    $mg.Dispose()
    $g.DrawImage($mark, [float]$mx, [float]$my)
    $mark.Dispose()

    $font = New-Object System.Drawing.Font "Segoe UI", (if ($vertical) { 13 } else { 11 }), ([System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush $markLight
    $accentBrush = New-Object System.Drawing.SolidBrush $accentHi
    if ($vertical) {
        $g.DrawString("BLOODWING", $font, $textBrush, 12, 150)
        $g.DrawString("N E C T A R   B U I L D", (New-Object System.Drawing.Font "Segoe UI", 7), $accentBrush, 14, 176)
    } else {
        $g.DrawString("BLOODWING", $font, $textBrush, 52, 12)
        $g.DrawString("Nectar build", (New-Object System.Drawing.Font "Segoe UI", 7), $accentBrush, 53, 30)
    }
    $font.Dispose()
    $textBrush.Dispose()
    $accentBrush.Dispose()
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $bmp.Dispose()
}

New-WizardBitmap 150 57 (Join-Path $installerAssets "header.bmp") $false
New-WizardBitmap 164 314 (Join-Path $installerAssets "sidebar.bmp") $true
Write-Host "wrote installer/assets/header.bmp and installer/assets/sidebar.bmp"
