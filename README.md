# 🎼  werckmeister-component

A [web component](https://en.wikipedia.org/wiki/Web_Components) which allows you to embed werckmeister snippets on your website.

## How to use

### snippet
* include the javascript file

```html
<script src="https://unpkg.com/@werckmeister/components@1.1.6-41/werckmeister-components.js"></script>
```
* embed your snippet

```html
<werckmeister-snippet>
<![CDATA[
device: MyDevice  midi _usePort=0;
instrumentDef:lead    _onDevice=MyDevice  _ch=0 _pc=0;

-- a melody track
[
instrument: lead;
{
    c d e f | g a b c
}
]
]]>
</werckmeister-snippet> 
```

## Demo
https://jsfiddle.net/z8qv5b7j/


## Options

### `wm-type`
can be either `default` or `single`. `single` means that the input is treated as one singe voice line such as `c d e f g`.
In `default`mode the input has to be a valid `werckmeister` source.

https://jsfiddle.net/bh4ugc5q/

### `wm-tempo`
Set the tempo of an snippet.
### `wm-style`
Inline css rules to set up the apperance of the snippet.
https://jsfiddle.net/zxhgyv2p/

### `wm-css-url`
Set an url of an css file, to override the default css of the snippet.
https://jsfiddle.net/m01bzg3f/

### `wm-soundfont-url`
Set the repo url. See [Soundfont Server](https://github.com/werckme/soundfont-server).

### `wm-workspace-url`
Uses a workspace url as source. E.g.: "https://sambag.uber.space/api-wm/conductor16thHighHat"


### workspace
#### Using `<werckmeister-workspace>` to use several editors (for example in different tabs)

---

## 🔌 Step 1: Include the Component Script

Add the Werckmeister Components script to your HTML:

```html
<script src="https://unpkg.com/@werckmeister/components/werckmeister-components.js"></script>
```

---

## 🧱 Step 2: Add a `<werckmeister-workspace>` and Editor

Define a workspace `<werckmeister-editor>`. Each editor can contain a werckmeister document.

Example:

```html
<werckmeister-workspace id="workspace"></werckmeister-workspace>

<werckmeister-editor
  id="ed1"
  wm-filename="main.sheet"
  wm-style="height: 700px;"
>
using "chords/default.chords";

tempo: 140;
device: MyDevice webPlayer _useFont="FluidR3-GM";
instrumentDef:lead _onDevice=MyDevice _ch=0 _pc=0;
instrumentDef:rhythm _onDevice=MyDevice _ch=1 _pc=0;
instrumentDef:bass _onDevice=MyDevice _ch=2 _pc=0;

-- melody track
[
instrument: lead;
{
    \p
    r4 e f# g | c'1~ | c'4 d e f# | b2 b2~ |
}
]
</werckmeister-editor>

<a href id="download">Download MIDI</a>
```

---

## ⚙️ Step 3: Register the Editor in JavaScript

Link your editor to the workspace using JavaScript:

```js
const workspace = document.getElementById('workspace');
workspace.registerEditor(document.getElementById('ed1'));
```

You can also hook into events:

```js
workspace.onError = (ex) => console.log("Error:", ex);
workspace.onCompiled = (doc) => console.log("Compiled successfully:", doc);
```

---

## 🎵 MIDI Export

To trigger MIDI file download:

```js
const downloadEl = document.querySelector("#download");
downloadEl.onclick = (ev) => {
    ev.preventDefault();
    workspace.download("myFile.mid");
}
```

## worskapce Options
### wm-css-url
Load a custom CSS file to override the default styling of the editor.

### wm-soundfont-url
Set the repo url. See [Soundfont Server](https://github.com/werckme/soundfont-server).

### wm-onerror
sets an error callback

## Editor options
### wm-style
sets the style content to the underlying editor component
### wm-css-url
Load a custom CSS file to override the default styling of the editor.
### wm-filename
Defines a filename for the editor file. This file is accessable for the compiler.

## Development

Requires Node.js 22. The bundle is built with [esbuild](https://esbuild.github.io/) (`build.mjs`) into `dist/`.

| Command | |
|---|---|
| `npm run serve` | dev server with rebuild on change: http://localhost:1234/test-snippet.html, http://localhost:1234/test-workspace.html |
| `npm run watch` | rebuild `dist/` on change |
| `npm run typecheck` | TypeScript type check |
| `npm run deploy` | type check + production build, `dist/` is ready to publish |

Releases are published to npm by CI on every push to `master` (`1.1.6-<run>`) or `develop`/`feature/*` (`1.1.10-dev-<run>`).

### Testing local changes in werckmeister-online

Link the local build into the frontend without touching its `package.json`/lockfile:

```sh
# werckmeister-component
npm run watch

# werckmeister-online/frontend
npm install --no-save ../../werckmeister-component/dist
npm start
```

Changes are picked up by `ng serve` on reload. A regular `npm install`/`npm ci` in the frontend switches back to the published version.
