# Red Star OS 3.0 - fan recreation

A recreation of the **Red Star OS 3.0** desktop (붉은별) in plain HTML, CSS and JavaScript, with a working window manager, dock, file system and apps.

Made by [adrenaline91](https://github.com/adrenaline91).

> **Work in progress:** not all the features of the real Red Star OS are here yet. I'm still working on it.

> This is a tech and curiosity project only. It has no political purpose and is not meant to hurt, offend, provoke or support any country, government or people. It is not affiliated with the Korea Computer Center or any official organization.

## Features

- **Desktop**: menu bar with the ★ menu, clock (with Juche year), sound and network menus, draggable windows (close / minimize / zoom / resize), dock with magnification, desktop icons and right-click menus.
- **Screen resolution** (분해능) can be changed in System Preferences > Display, from 800 × 600 to 2560 × 1440, or set to fit the window automatically. The default is 964 × 732.
- **Boot, sleep, restart, shut down and log out** screens.
- **Sounds**: the original Red Star OS startup and log out sounds, and the standard KDE 4 "Oxygen" sounds that Red Star OS 3.0 uses for everything else (warnings, questions, errors, information, empty trash, minimize, maximize, close). They follow the volume and mute settings and can be turned off in System Preferences > Sound.
- **Korean 2-set input method** (Shift+Space or the A/가 button) that composes Hangul syllables in any text field.
- **Virtual file system** saved in the browser (localStorage), with Trash, drag & drop and file import from your computer.
- **Apps**: 내나라열람기 (Naenara browser, with tabs, history and bookmarks), File Manager, Text Editor, Image Viewer, Calendar, Address Book, Calculator, Video Player, File Search, System Preferences and Terminal.
- **12 languages built in** (original North Korean, South Korean, English, French, Spanish, German, Italian, Portuguese, Russian, Chinese, Japanese, Arabic). About 75 more can be translated on your computer by the browser's built-in translator (Chrome 138+).

## Run it

### In a web browser

Open `index.html`, or serve the folder with any static web server (GitHub Pages works too).
In this mode, many websites (Google, YouTube…) refuse to be displayed inside the Naenara browser: this is a security rule of the websites themselves. To make every website work in the web version too, set up the optional cloud browser: see [`cloud/README.md`](cloud/README.md).

### As a desktop app (every website works)

Requires [Node.js](https://nodejs.org).

- **Windows**: double-click `Red Star OS.bat` (the first launch installs Electron, about 100 MB).
- **Any system**:

  ```bash
  npm install
  npm start
  ```

  If `npm install` does not download the Electron binary, run `node node_modules/electron/install.js` once.

The desktop app uses Electron `<webview>` tags, so the Naenara browser can open any website. Press **F11** to toggle full screen.

## Project structure

```
index.html          page and screen layout
css/                system and app styles
js/core.js          utilities, virtual file system, window manager, menus, dialogs
js/shell.js         menu bar, tray, dock, desktop, power screens
js/ime.js           Korean input method
js/i18n.js          translation engine
js/lang/            dictionaries (one file per language)
js/apps/            the applications
js/boot.js          startup
main.js, preload.js Electron desktop app
js/sound.js         system sounds
icons/, wallpapers/, sounds/  Red Star OS assets
```

Add a language by copying `js/lang/en.js`, translating the values and adding it to `index.html` and to `BUILTIN` in `js/i18n.js`.

## Credits

Icons, wallpapers and the startup / log out sounds come from the original Red Star OS 3.0 and belong to their respective owners. They were taken from these public extractions:

- [BlackOtton/RedStar-Media](https://github.com/BlackOtton/RedStar-Media)
- [kaiserfen/RedstarOSxfce](https://github.com/kaiserfen/RedstarOSxfce)

Some icons that were not available (calendar, Documents stack) were redrawn in SVG.

The system sounds in `sounds/kde/` are the KDE 4 Oxygen sounds, © 2008 Nuno Filipe Povoa, licensed under LGPL-3.0-or-later ([source](https://invent.kde.org/plasma/oxygen-sounds)). See `sounds/kde/README.txt`.
