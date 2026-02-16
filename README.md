# pixi-texturer

[![CI](https://github.com/nesvet/pixi-texturer/actions/workflows/ci.yaml/badge.svg)](https://github.com/nesvet/pixi-texturer/actions/workflows/ci.yaml)
[![npm](https://img.shields.io/npm/v/pixi-texturer)](https://www.npmjs.com/package/pixi-texturer)
[![license](https://img.shields.io/npm/l/pixi-texturer)](LICENSE)

**Pack multiple DisplayObjects into one texture atlas** — like a spritesheet, but from dynamic content.

Feed it your Graphics, Text, Sprites, or Containers — get back individual textures and sprites. One call, no manual `generateTexture`, no frame math, no packing logic.

```js
// mySprite, myText — your DisplayObjects
const texturer = new Texturer([
	[ "icon", mySprite ],
	[ "label", myText ]
], app.renderer);

const sprite = texturer.newSprite("icon");
```

## Installation

```sh
npm install pixi-texturer
```

Or with Bun:

```sh
bun add pixi-texturer
```

Requires **PixiJS ^8** (peer dependency). In browser, `baseWidth` defaults to `window.innerWidth`; in Node.js, to `800`.

## Contents

- [Installation](#installation)
- [Example](#example)
- [Use Cases](#use-cases)
- [Advanced examples](#advanced-examples)
- [API Reference](#api-reference)
- [Limitations](#limitations)
- [Support this project](#support-this-project)
- [Contributing](#contributing)
- [License](#license)

## Example

```js
import * as PIXI from "pixi.js";
import { Texturer } from "pixi-texturer";


Texturer.use(PIXI);

const app = new PIXI.Application();
await app.init({ background: "#1099bb" });

const graphics = new PIXI.Graphics().circle(0, 0, 20).fill({ color: 0xff0000 });
const text = new PIXI.Text({ text: "Hi", style: { fontSize: 24 } });

const texturer = new Texturer([
	[ "circle", graphics, { padding: 4 } ],
	[ "label", text ]
], app.renderer, { baseWidth: 512 });

document.body.appendChild(app.canvas);
app.stage.addChild(texturer.newSprite("circle"));
```

## Use Cases

**→ Dynamic icons and labels**  
Graphics, Text, Container → one texture, fewer draw calls.

**→ Caching complex compositions**  
One render instead of redrawing every frame.

**→ Spritesheet from DisplayObjects**  
Pack arbitrary objects into an atlas.

**→ Mixed sources**  
Graphics, Text, loaded textures, canvas, URLs — one atlas from heterogeneous sources.

**→ Export spritesheet**  
`toSpritesheetData()` → save JSON + atlas image for build pipeline or `Assets.load()`.

**→ Async packing**  
`setAsync()` loads URLs before packing — no manual pre-load.

## Advanced examples

**setAsync — load from URLs**

```js
const texturer = new Texturer([], app.renderer);
await texturer.setAsync([
	[ "icon", "assets/icon.png" ],
	[ "hero", "assets/hero.png", { padding: 4 } ]
]);
app.stage.addChild(texturer.newSprite("icon"));
```

**Mixed sources — DisplayObject + Texture + URL**

```js
const texturer = new Texturer([], app.renderer);
const graphics = new PIXI.Graphics().rect(0, 0, 32, 32).fill(0x00ff00);
const loadedTexture = await PIXI.Assets.load("assets/bg.png");

await texturer.setAsync([
	[ "shape", graphics ],
	[ "bg", loadedTexture ],
	[ "logo", "assets/logo.png" ]
]);
```

**Object format**

```js
const texturer = new Texturer([
	{ name: "icon", source: mySprite, padding: 8 },
	{ names: [ "a", "b" ], source: sharedGraphic }
], app.renderer);
```

**toSpritesheetData — export atlas**

```js
const data = texturer.toSpritesheetData("atlas.png");
// Save data.frames + data.meta + texture as PNG; or use with Assets.load()
```

## API Reference

### Exports

- **Class:** `Texturer`
- **Core types:** `SetEntry`, `EntryOptions`, `TexturerOptions`, `EntrySource`, `GenerateTextureLike`
- **Advanced types:** `Entry`, `SpritesheetData`, `SpritesheetFrameData`, `EntryObject`, `PixiLike`

### Types

**Core**

**TexturerOptions** — constructor options

```ts
{ baseWidth?, trim?, generateTexture?, preserveContents? }
```

**EntryOptions** — per-entry options

```ts
{ padding?, paddingTop?, paddingRight?, paddingBottom?, paddingLeft?,
  region?, x?, y?, width?, height?, trim?, pivot?, rotate?, anchor? }
```

**SetEntry** — entry format for `entries` (array or object, see below)

**EntrySource** — valid source types

```ts
Container | HTMLCanvasElement | HTMLImageElement | Texture | string
```

**GenerateTextureLike** — renderer interface

```ts
{ generateTexture(options: { target: Container; frame?: Rectangle; ... }): RenderTexture }
```

**Advanced**

**Entry** — entry in `list`

```ts
{ names: string[], displayObject: Container, rectangle: Rectangle | null,
  texture: Texture | null, options: EntryOptions }
```

**SpritesheetData** — return type of `toSpritesheetData()`

```ts
{ frames: Record<string, SpritesheetFrameData>, meta: { image, size: {w,h}, scale } }
```

**SpritesheetFrameData** — frame in spritesheet

```ts
{ frame: {x,y,w,h}, spriteSourceSize: {x,y,w,h}, sourceSize: {w,h}, anchor?, trimmed?, rotated? }
```

### Texturer

#### Static methods

- `Texturer.use(pixi: PixiLike): void` — **Must be called before any use.** Pass the full PixiJS namespace (e.g. `import * as PIXI from "pixi.js"`). Used internally for Sprite, Texture, Rectangle, Container.
- `Texturer.reset(): void` — Clears the PIXI reference (for testing or switching PixiJS instances).

#### Constructor

- `new Texturer(entries: SetEntry[], renderer: GenerateTextureLike, options?: TexturerOptions)`

**entries** — array of entries. Each entry (array or object format):

- `[name, source, options?]` — name: string or string[]
- `[[name1, name2], source, options?]` — multiple names for one entry
- `[source, options?]` — no names, access by index only (first element is source)
- `{ name, source, ...options }` or `{ names, source, ...options }` — object format

**source** — `EntrySource`. For string URLs use `setAsync()`.

**Constructor options (TexturerOptions):**

- `baseWidth` (number, default: `window.innerWidth` in browser, `800` in Node.js) — row width for packing
- `trim` (boolean, default: `false`) — trim transparent edges for all entries
- `generateTexture` (object, default: `{}`) — options passed to `renderer.generateTexture()`
- `preserveContents` (boolean, default: `false`) — do not destroy the container after render; objects remain reparented into the container

**Per-entry options (EntryOptions):**

- `padding` (number | [T, R, B?, L?]) — padding around frame; array: [top, right, bottom?, left?]; `[T]` sets top+bottom; `[T,R]` uses bottom=top, left=right
- `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` (number)
- `region` (`{ x, y, width, height }`) — fixed region instead of `getLocalBounds()`
- `x`, `y` (number) — origin offset for bounds
- `width`, `height` (number) — override frame size
- `trim` (boolean) — trim for this entry (overrides global trim)
- `pivot` (`{ x, y }`) — converted to anchor for Texture (when width/height > 0)
- `rotate` (boolean | number) — texture rotation
- `anchor` (`{ x, y }`) — texture anchor

#### Instance properties

| Property | Type | Description |
|----------|------|--------------|
| `renderer` | `GenerateTextureLike` | Renderer passed to constructor |
| `baseWidth` | `number` | Row width for packing |
| `trim` | `boolean` | Global trim |
| `generateTextureOptions` | `Record<string, unknown>` | Options for `generateTexture` |
| `preserveContents` | `boolean` | Do not destroy container after render |
| `names` | `Map<string, Entry>` | Name → entry |
| `items` | `Map<Container, Entry>` | Container → entry |
| `list` | `Entry[]` | Array of entries |
| `container` | `Container` | Temporary container (until destroy) |
| `texture` | `RenderTexture` | Atlas texture (after `update()`) |

#### Instance methods

- `set(entries: SetEntry[]): void` — Replaces all entries and calls `update()`.
- `setAsync(entries: SetEntry[]): Promise<void>` — Resolves string URLs via `PIXI.Assets.load()` before calling `set()`. Requires `Texturer.use(PIXI)` with full pixi.js namespace (including Assets).
- `update(): void` — Rebuilds the atlas: packs objects using shelf packing (height-sort), 1px gap between frames, renders to one texture, creates a Texture for each entry.
- `get(key: string | number | Container): Texture` — Returns `PIXI.Texture`. Key: entry name, index in `list`, or Container. Throws if not found.
- `newSprite(key: string | number | Container): Sprite` — Returns `new PIXI.Sprite(texturer.get(key))`.
- `toSpritesheetData(metaImage?: string): SpritesheetData` — Returns `{ frames, meta }` in PixiJS Spritesheet JSON format. Use with `Assets.load()` or export alongside the atlas texture. `metaImage` defaults to `""`.

## Limitations

- PixiJS 8+ only
- Container with objects is destroyed after render by default — use `preserveContents: true` if you need it
- With `preserveContents: true`, the container and its children remain in memory; objects are already reparented and positioned
- In Node.js, `baseWidth` defaults to `800` (no `window.innerWidth`)

## Support this project

**pixi-texturer is free, open-source, and maintained by one developer.**

If it saves you time or improves your PixiJS workflow:
- ⭐️ Star the repo — it genuinely helps discoverability
- 💙 Support on [Patreon](https://www.patreon.com/nesvet) — priority features & long-term maintenance

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE)
