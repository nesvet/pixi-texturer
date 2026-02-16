# pixi-texturer

**Pack multiple DisplayObjects into one texture atlas** — like a spritesheet, but from dynamic content.

Feed it your Graphics, Text, Sprites, or Containers — get back individual textures and sprites. One call, no manual `generateTexture`, no frame math, no packing logic.

```js
import * as PIXI from "pixi.js";
import { Texturer } from "pixi-texturer";

Texturer.use(PIXI);
// mySprite, myText — your DisplayObjects
const texturer = new Texturer([
	["icon", mySprite],
	["label", myText]
], app.renderer);
const sprite = texturer.newSprite("icon");
```

*Works with PixiJS ^7*

---

## Installation

```sh
npm install pixi-texturer
```

Or with Bun:

```sh
bun add pixi-texturer
```

Requires **PixiJS ^7** (peer dependency). In browser, `baseWidth` defaults to `window.innerWidth`; in Node.js, to `800`.

---

## Contents

- [Installation](#installation)
- [Example](#example)
- [Use Cases](#use-cases)
- [API Reference](#api-reference)
- [Limitations](#limitations)

---

## Example

```js
import * as PIXI from "pixi.js";
import { Texturer } from "pixi-texturer";

Texturer.use(PIXI);

const app = new PIXI.Application();
const graphics = new PIXI.Graphics().circle(0, 0, 20).fill({ color: 0xff0000 });
const text = new PIXI.Text({ text: "Hi", style: { fontSize: 24 } });

const texturer = new Texturer([
	["circle", graphics, { padding: 4 }],
	["label", text]
], app.renderer, { baseWidth: 512 });

document.body.appendChild(app.canvas);
app.stage.addChild(texturer.newSprite("circle"));
```

---

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

---

## API Reference

### Exports

- **Class:** `Texturer`
- **Core types:** `SetEntry`, `EntryOptions`, `TexturerOptions`, `EntrySource`, `GenerateTextureLike`
- **Advanced types:** `Entry`, `SpritesheetData`, `SpritesheetFrameData`, `EntryObject`, `PixiLike`

### Types

**Core**

**TexturerOptions** — constructor options

```
{ baseWidth?, trim?, generateTexture?, preserveContents? }
```

**EntryOptions** — per-entry options

```
{ padding?, paddingTop?, paddingRight?, paddingBottom?, paddingLeft?,
  region?, x?, y?, width?, height?, trim?, pivot?, rotate?, anchor? }
```

**SetEntry** — entry format for `entries` (array or object, see below)

**EntrySource** — valid source types

```
DisplayObject | Texture | HTMLImageElement | HTMLCanvasElement | string
```

**GenerateTextureLike** — renderer interface

```
{ generateTexture(displayObject, options?): RenderTexture }
```

**Advanced**

**Entry** — entry in `list`

```
{ names: string[], item: DisplayObject, displayObject: DisplayObject,
  rectangle: Rectangle | null, texture: Texture | null, options: EntryOptions }
```

**SpritesheetData** — return type of `toSpritesheetData()`

```
{ frames: Record<string, SpritesheetFrameData>, meta: { image, size: {w,h}, scale } }
```

**SpritesheetFrameData** — frame in spritesheet

```
{ frame: {x,y,w,h}, spriteSourceSize: {x,y,w,h}, sourceSize: {w,h}, anchor?, rotated? }
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
- `[source, options?]` — no names, access by index
- `{ name, source, ...options }` or `{ names, source, ...options }` — object format

**source** — `EntrySource`. For string URLs use `setAsync()`.

**Constructor options (TexturerOptions):**

- `baseWidth` (number, default: `window.innerWidth` in browser, `800` in Node.js) — row width for packing
- `trim` (boolean, default: false) — trim transparent edges for all entries
- `generateTexture` (object, default: `{}`) — options passed to `renderer.generateTexture()`
- `preserveContents` (boolean, default: false) — do not destroy the container after render

**Per-entry options (EntryOptions):**

- `padding` (number | [T, R, B?, L?]) — padding around frame; array: [top, right, bottom?, left?]; `[T]` sets top+bottom; `[T,R]` uses bottom=top, left=right
- `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` (number)
- `region` ({x, y, width, height}) — fixed region instead of `getLocalBounds()`
- `x`, `y` (number) — origin offset for bounds
- `width`, `height` (number) — override frame size
- `trim` (boolean) — trim for this entry (overrides global trim)
- `pivot` ({x, y}) — converted to anchor for Texture (when width/height > 0)
- `rotate` (boolean | number) — texture rotation
- `anchor` ({x, y}) — texture anchor

#### Instance properties

| Property | Type | Description |
|----------|------|--------------|
| `renderer` | `GenerateTextureLike` | Renderer passed to constructor |
| `baseWidth` | `number` | Row width for packing |
| `trim` | `boolean` | Global trim |
| `generateTextureOptions` | `Record<string, unknown>` | Options for `generateTexture` |
| `preserveContents` | `boolean` | Do not destroy container after render |
| `names` | `Map<string, Entry>` | Name → entry |
| `items` | `Map<DisplayObject, Entry>` | DisplayObject → entry |
| `list` | `Entry[]` | Array of entries |
| `container` | `Container` | Temporary container (until destroy) |
| `texture` | `RenderTexture` | Atlas texture (after `update()`) |

#### Instance methods

- `set(entries: SetEntry[]): void` — Replaces all entries and calls `update()`.
- `setAsync(entries: SetEntry[]): Promise<void>` — Resolves string URLs via `PIXI.Assets.load()` before calling `set()`. Requires `Texturer.use(PIXI)` with full pixi.js namespace (including Assets).
- `update(): void` — Rebuilds the atlas: packs objects using shelf packing (height-sort), 1px gap between frames, renders to one texture, creates a Texture for each entry.
- `get(key: string | number | DisplayObject): Texture` — Returns `PIXI.Texture`. Key: entry name, index in `list`, or DisplayObject. Throws if not found.
- `newSprite(key: string | number | DisplayObject): Sprite` — Returns `new PIXI.Sprite(texturer.get(key))`.
- `toSpritesheetData(metaImage?: string): SpritesheetData` — Returns `{ frames, meta }` in PixiJS Spritesheet JSON format. Use with `Assets.load()` or export alongside the atlas texture. `metaImage` defaults to `""`.

---

## Limitations

- PixiJS 7+ only
- Container with objects is destroyed after render by default — use `preserveContents: true` if you need it
- In Node.js, `baseWidth` defaults to `800` (no `window.innerWidth`)

---

## Star

If you use pixi-texturer in your workflow, a star means: more visibility for other devs, motivation to keep shipping, and a signal that this tool is worth their time.

---

## License

MIT
