# Screenshots

This directory currently contains **upstream Nectar's** marketing images
(`desktop.webp`, `dock.png`, `island.png`). They are kept for historical
attribution and do **not** represent the BloodWing build. The main README does not
use them.

## Adding genuine BloodWing screenshots

The repository intentionally ships no fake or borrowed UI images. To add real
captures of this build:

1. Build or install BloodWing and start it.
2. Use a neutral background so the glass surfaces read well: a plain dark wallpaper,
   or a maximized empty window. **Do not capture personal content** — files, chat
   windows, browser tabs, account names, email addresses or window titles you would
   not publish.
3. Capture with `Win`+`Shift`+`S` (Snipping Tool) and save as PNG into this folder
   using these names (the README placeholder is written for this set):

   | File | What to capture |
   | --- | --- |
   | `bloodwing-notch.png` | Notch expanded (weather, clock, battery visible) |
   | `bloodwing-command-center.png` | Command center mode (pills + sliders) |
   | `bloodwing-dock.png` | Dock visible at the bottom edge |
   | `bloodwing-settings.png` | Settings window (Appearance or Dock tab) |
   | `bloodwing-calendar.png` | Calendar mode with the timer panel |

4. Recommended: crop to the interesting region, keep the longest edge ≤ 1600 px,
   and keep each file under ~500 KB (PNG or WebP).
5. Update the **Screenshots** section of the root `README.md`: replace the
   placeholder note with standard Markdown images, for example:

   ```markdown
   <p align="center">
     <img src="docs/screenshots/bloodwing-notch.png" width="720" alt="BloodWing notch expanded" />
   </p>
   ```

6. Commit with a message like `docs: add BloodWing screenshots`.

You are welcome to send screenshots in an issue instead if you would rather not open
a pull request; they will be credited.
