# n-gon Controller Support
Allows you to play [n-gon](https://landgreen.github.io/sidescroller) with a controller

## Usage
Create a website bookmark in your browser and paste this script as the url. Then open [n-gon](https://landgreen.github.io/sidescroller) and click on the bookmark, and gamepad controls will be enabled.
```js
javascript: (async () => { const scriptText = await (await fetch('https://raw.githubusercontent.com/kgurchiek/n-gon-controller/main/main.js')).text(); var script = document.createElement('script'); script.type = 'text/javascript'; script.textContent = scriptText; document.head.appendChild(script); })();
```

## Controls
| Bind | Function |
| - | - |
| Left Joystick | move, jump, crouch |
| Right Joystick | look |
| A | jump, select, start game |
| B | toggle crouch, cancel |
| Left Bumber | previous weapon |
| Right Bumper | next weapon |
| D-Pad | navigate menus |
| Select | toggle free look |
| Pause | pause |
