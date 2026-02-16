import {
	afterEach,
	beforeEach,
	describe,
	expect,
	test
} from "bun:test";
import type { RenderTexture } from "pixi.js";
import {
	Texturer,
	type EntrySource,
	type SetEntry,
	type SpritesheetData
} from "../src/index.js";
import {
	BASE_WIDTH,
	BASE_WIDTH_NARROW,
	createDisplayObject,
	createMockRenderer,
	createMockTexture,
	createTexturer,
	DEFAULT_INNER_WIDTH,
	getDestroyedContainersCount,
	mockPixi,
	mockPixiWithoutAssets,
	PADDING_UNIFORM,
	resetDestroyedContainers
} from "./setup.js";


describe("without use()", () => {
	beforeEach(() => {
		Texturer.reset();
	});
	
	test("constructor throws when use() not called", () => {
		expect(() => new Texturer([], createMockRenderer(), {})).toThrow(
			"Do Texturer.use(PIXI) before using Texturer"
		);
	});
});

describe("with use()", () => {
	beforeEach(() => {
		Texturer.use(mockPixi);
		resetDestroyedContainers();
	});
	
	afterEach(() => {
		Texturer.reset();
	});
	
	test("constructor works after use()", () => {
		const obj = createDisplayObject();
		const texturer = createTexturer([ [ "a", obj ] ]);
		const texture = texturer.get("a");
		expect(texture).toBeDefined();
		expect(texture.frame).toBeDefined();
		const sprite = texturer.newSprite("a") as { texture: unknown };
		expect(sprite.texture).toBe(texture);
	});
	
	test("constructor with empty entries creates valid texture", () => {
		const texturer = createTexturer([]);
		expect(() => texturer.get(0)).toThrow();
		expect(texturer.texture.baseTexture).toBeDefined();
		expect((texturer.texture as { region?: unknown }).region).toBeDefined();
	});
	
	describe("set()", () => {
		test("accepts [name, displayObject] format", () => {
			const texturer = createTexturer([ [ "icon", createDisplayObject() ] ]);
			expect(texturer.get("icon")).toBe(texturer.get(0));
		});
		
		test("accepts [[n1, n2], displayObject] format", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ [ [ "a", "b" ], obj ] ]);
			expect(texturer.get("a")).toBe(texturer.get("b"));
		});
		
		test("accepts [displayObject, options] object-first format", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ [ obj, { padding: 2 } ] ]);
			expect(texturer.get(0)).toBe(texturer.get(obj as Parameters<typeof texturer.get>[0]));
		});
		
		test("accepts { name, source } object format", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ { name: "icon", source: obj } ]);
			expect(texturer.get("icon")).toBe(texturer.get(0));
		});
		
		test("accepts { names, source } object format", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ { names: [ "a", "b" ], source: obj } ]);
			expect(texturer.get("a")).toBe(texturer.get("b"));
		});
		
		test("accepts { source } object format, access by index", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ { source: obj } ]);
			expect(texturer.get(0)).toBeDefined();
		});
		
		test("object format with padding", () => {
			const obj = createDisplayObject({ width: 10, height: 10 });
			const texturer = createTexturer([ { name: "x", source: obj, padding: 4 } ]);
			expect(texturer.get("x").frame.width).toBe(18);
			expect(texturer.get("x").frame.height).toBe(18);
		});
		
		test("throws for invalid object format", () => {
			expect(() => createTexturer([ { foo: "bar" } as unknown as SetEntry ])).toThrow(
				"Entry must be [name, source, options?] or { name/names, source, ...options }"
			);
		});
		
		test("throws for string source with hint", () => {
			expect(() => createTexturer([ [ "a", "http://x.png" ] ])).toThrow(
				"String sources require setAsync(); use await texturer.setAsync(entries)"
			);
		});
		
		test("throws for non-DisplayObject", () => {
			expect(() => createTexturer([ [ "x", {} ] ])).toThrow(
				"Only PIXI.DisplayObjects are supported"
			);
		});
		
		test("padding as number sets all sides", () => {
			const obj = createDisplayObject({ width: 10, height: 10 });
			const texturer = createTexturer([ [ "a", obj, { padding: PADDING_UNIFORM } ] ]);
			expect(texturer.get("a").frame.width).toBe(18);
			expect(texturer.get("a").frame.height).toBe(18);
		});
		
		test("padding as [T, R, B, L] array", () => {
			const obj = createDisplayObject({ width: 10, height: 10 });
			const texturer = createTexturer([ [ "a", obj, { padding: [ 1, 2, 3, 4 ] } ] ]);
			expect(texturer.get("a").frame.width).toBe(16);
			expect(texturer.get("a").frame.height).toBe(14);
		});
		
		test("padding as [T, R] uses bottom=top, left=right", () => {
			const obj = createDisplayObject({ width: 10, height: 10 });
			const texturer = createTexturer([ [ "a", obj, { padding: [ 1, 2 ] } ] ]);
			expect(texturer.get("a").frame.width).toBe(14);
			expect(texturer.get("a").frame.height).toBe(12);
		});
		
		test("padding as [T, R, B] uses left=right", () => {
			const obj = createDisplayObject({ width: 10, height: 10 });
			const texturer = createTexturer([ [ "a", obj, { padding: [ 1, 2, 3 ] } ] ]);
			expect(texturer.get("a").frame.width).toBe(14);
			expect(texturer.get("a").frame.height).toBe(14);
		});
		
		test("padding as [T] sets top and bottom, leaves left/right 0", () => {
			const obj = createDisplayObject({ width: 10, height: 10 });
			const texturer = createTexturer([ [ "a", obj, { padding: [ 1 ] } ] ]);
			expect(texturer.get("a").frame.width).toBe(10);
			expect(texturer.get("a").frame.height).toBe(12);
		});
		
		test("padding as empty array leaves default dimensions", () => {
			const obj = createDisplayObject({ width: 10, height: 10 });
			const texturer = createTexturer([ [ "a", obj, { padding: [] } ] ]);
			expect(texturer.get("a").frame.width).toBe(10);
			expect(texturer.get("a").frame.height).toBe(10);
		});
		
		test("throws for duplicate name", () => {
			const obj1 = createDisplayObject();
			const obj2 = createDisplayObject();
			expect(() =>
				createTexturer([
					[ "dup", obj1 ],
					[ "dup", obj2 ]
				])
			).toThrow(/Entry with name.*already exists/);
		});
		
		test("throws for duplicate DisplayObject", () => {
			const obj = createDisplayObject();
			expect(() =>
				createTexturer([
					[ "a", obj ],
					[ "b", obj ]
				])
			).toThrow(/Duplicate DisplayObject at index 1/);
		});
		
		test("with options.region uses region for rectangle", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ [ "a", obj, {
				region: { x: 5, y: 5, width: 20, height: 20 }
			} ] ]);
			const { frame } = texturer.get("a");
			expect(frame.width).toBe(20);
			expect(frame.height).toBe(20);
			expect(obj.x).toBe(-4);
			expect(obj.y).toBe(-4);
		});
		
		test("with options.region allows zero width or height", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ [ "a", obj, {
				region: { x: 0, y: 0, width: 0, height: 10 }
			} ] ]);
			expect(texturer.get("a").frame).toBeDefined();
			expect(texturer.get("a").frame.width).toBe(0);
			expect(texturer.get("a").frame.height).toBe(10);
		});
		
		test("with options.trim uses trimmed bounds", () => {
			const obj = createDisplayObject({ x: 2, y: 2, width: 8, height: 8 });
			const texturer = createTexturer([ [ "a", obj, { trim: true } ] ]);
			expect(texturer.get("a").frame.width).toBe(8);
		});
		
		test("with global trim uses trimmed bounds", () => {
			const obj = createDisplayObject({ x: 2, y: 2, width: 8, height: 8 });
			const texturer = createTexturer([ [ "a", obj ] ], { trim: true });
			expect(texturer.get("a").frame.width).toBe(8);
		});
		
		test("options.trim: false overrides global trim", () => {
			const obj = createDisplayObject({ x: 2, y: 2, width: 8, height: 8 });
			const texturer = createTexturer([ [ "a", obj, { trim: false } ] ], { trim: true });
			expect(texturer.get("a").frame.width).toBe(10);
		});
		
		test("options.x and options.y override origin", () => {
			const obj = createDisplayObject({ x: 0, y: 0, width: 10, height: 10 });
			const texturer = createTexturer([ [ "a", obj, { x: 1, y: 2 } ] ]);
			const { frame } = texturer.get("a");
			expect(frame.width).toBe(10);
			expect(frame.height).toBe(10);
			expect(obj.x).toBe(0);
			expect(obj.y).toBe(-1);
		});
		
		test("options.width and options.height override size", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject(), { width: 50, height: 60 } ] ]);
			expect(texturer.get("a").frame.width).toBe(50);
			expect(texturer.get("a").frame.height).toBe(60);
		});
		
		test("wraps to new row when exceeding baseWidth", () => {
			const obj1 = createDisplayObject({ width: 100, height: 20 });
			const obj2 = createDisplayObject({ width: 100, height: 20 });
			const texturer = createTexturer([
				[ "a", obj1 ],
				[ "b", obj2 ]
			], { baseWidth: BASE_WIDTH_NARROW });
			expect(texturer.get("b").frame.y).toBeGreaterThan(texturer.get("a").frame.y);
		});
		
		test("converts pivot to anchor when width/height > 0", () => {
			const obj = createDisplayObject({ width: 10, height: 20 });
			const texturer = createTexturer([ [ "a", obj, { pivot: { x: 5, y: 10 } } ] ]);
			expect((texturer.get("a") as { anchor?: unknown }).anchor).toEqual({ x: 0.5, y: 0.5 });
		});
		
		test("does not set anchor when width or height is 0", () => {
			const obj = createDisplayObject({ width: 0, height: 10 });
			const texturer = createTexturer([ [ "a", obj, { pivot: { x: 0, y: 5 } } ] ]);
			expect((texturer.get("a") as { anchor?: unknown }).anchor).toBeUndefined();
		});
		
		test("passes rotate and anchor to Texture", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject(), { rotate: true, anchor: { x: 0.5, y: 0.5 } } ] ]);
			expect((texturer.get("a") as { rotate?: unknown }).rotate).toBe(1);
			expect((texturer.get("a") as { anchor?: unknown }).anchor).toEqual({ x: 0.5, y: 0.5 });
		});
		
		test("preserveContents: true keeps container", () => {
			createTexturer([ [ "a", createDisplayObject() ] ], { preserveContents: true });
			expect(getDestroyedContainersCount()).toBe(0);
		});
		
		test("preserveContents: false destroys container", () => {
			createTexturer([ [ "a", createDisplayObject() ] ], { preserveContents: false });
			expect(getDestroyedContainersCount()).toBe(1);
		});
		
		test("with empty array clears and regenerates", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
			expect(texturer.get("a")).toBeDefined();
			texturer.set([]);
			expect(() => texturer.get("a")).toThrow();
			expect(() => texturer.get(0)).toThrow();
			expect(texturer.texture).toBeDefined();
		});
		
		test("replaces entries and regenerates texture", () => {
			const obj1 = createDisplayObject();
			const obj2 = createDisplayObject();
			const texturer = createTexturer([ [ "a", obj1 ] ]);
			texturer.set([ [ "b", obj2 ] ]);
			expect(texturer.get("b")).toBeDefined();
			expect(texturer.get("b")).toBe(texturer.get(0));
			expect(() => texturer.get("a")).toThrow();
		});
	});
	
	describe("Texture as source", () => {
		test("accepts Texture, creates sub-texture", () => {
			const texture = createMockTexture();
			const texturer = createTexturer([ [ "tex", texture ] ]);
			expect(texturer.get("tex")).toBeDefined();
			expect(texturer.get("tex").frame).toBeDefined();
			expect(texturer.get("tex").frame.width).toBe(10);
			expect(texturer.get("tex").frame.height).toBe(10);
		});
		
		test("Texture with options.padding", () => {
			const texture = createMockTexture({ width: 10, height: 10 });
			const texturer = createTexturer([ [ "tex", texture, { padding: 4 } ] ]);
			expect(texturer.get("tex").frame.width).toBe(18);
			expect(texturer.get("tex").frame.height).toBe(18);
		});
		
		test("get by index when source is Texture", () => {
			const texture = createMockTexture();
			const texturer = createTexturer([ [ "tex", texture ] ]);
			expect(texturer.get(0)).toBe(texturer.get("tex"));
		});
	});
	
	describe("setAsync()", () => {
		test("throws when PIXI.Assets not available", async () => {
			Texturer.reset();
			Texturer.use(mockPixiWithoutAssets);
			const texturer = new Texturer([], createMockRenderer(), { baseWidth: BASE_WIDTH });
			await expect(texturer.setAsync([ [ "a", "http://url.png" ] ])).rejects.toThrow(
				"PIXI.Assets is required for setAsync"
			);
			Texturer.reset();
			Texturer.use(mockPixi);
		});
		
		test("resolves string URL and calls set", async () => {
			const texturer = new Texturer([], createMockRenderer(), { baseWidth: BASE_WIDTH });
			await texturer.setAsync([ [ "icon", "url.png" ] ]);
			expect(texturer.get("icon")).toBeDefined();
			expect(texturer.get("icon").frame.width).toBe(10);
		});
		
		test("resolves string in object format", async () => {
			const texturer = new Texturer([], createMockRenderer(), { baseWidth: BASE_WIDTH });
			await texturer.setAsync([ { name: "x", source: "url" } ]);
			expect(texturer.get("x")).toBeDefined();
		});
		
		test("mixed entries: string and DisplayObject", async () => {
			const obj = createDisplayObject();
			const texturer = new Texturer([], createMockRenderer(), { baseWidth: BASE_WIDTH });
			await texturer.setAsync([
				[ "fromUrl", "url.png" ],
				[ "fromObj", obj ]
			]);
			expect(texturer.get("fromUrl")).toBeDefined();
			expect(texturer.get("fromObj")).toBeDefined();
			expect(texturer.get("fromObj")).toBe(texturer.get(obj as Parameters<typeof texturer.get>[0]));
		});
	});
	
	describe("toSpritesheetData()", () => {
		test("returns frames and meta", () => {
			const texturer = createTexturer([ [ "icon", createDisplayObject() ] ]);
			const data = texturer.toSpritesheetData();
			expect(data).toHaveProperty("frames");
			expect(data).toHaveProperty("meta");
			expect(data.meta).toHaveProperty("image");
			expect(data.meta).toHaveProperty("size");
			expect(data.meta).toHaveProperty("scale");
			expect(data.meta.scale).toBe("1");
		});
		
		test("metaImage parameter", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
			const data = texturer.toSpritesheetData("atlas.png");
			expect(data.meta.image).toBe("atlas.png");
		});
		
		test("frame keys from names", () => {
			const texturer = createTexturer([ [ "icon", createDisplayObject() ] ]);
			const data = texturer.toSpritesheetData();
			expect(data.frames).toHaveProperty("icon");
			expect(data.frames.icon.frame).toBeDefined();
		});
		
		test("frame keys from index when no name", () => {
			const texturer = createTexturer([ [ createDisplayObject(), { padding: 0 } ] ]);
			const data = texturer.toSpritesheetData();
			expect(data.frames).toHaveProperty("0");
		});
		
		test("includes anchor when set", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject({ width: 10, height: 20 }), { pivot: { x: 5, y: 10 } } ] ]);
			const data = texturer.toSpritesheetData();
			expect(data.frames.a.anchor).toEqual({ x: 0.5, y: 0.5 });
		});
		
		test("includes rotated when set", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject(), { rotate: true } ] ]);
			const data = texturer.toSpritesheetData();
			expect(data.frames.a.rotated).toBe(true);
		});
		
		test("empty entries", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
			texturer.set([]);
			const data = texturer.toSpritesheetData();
			expect(data.frames).toEqual({});
			expect(data.meta.size.w).toBeGreaterThanOrEqual(0);
			expect(data.meta.size.h).toBeGreaterThanOrEqual(0);
		});
	});
	
	describe("get()", () => {
		test("by name", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ [ "icon", obj ] ]);
			expect(texturer.get("icon")).toBe(texturer.get(0));
		});
		
		test("by index", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ [ "a", obj ] ]);
			expect(texturer.get(0)).toBe(texturer.get("a"));
		});
		
		test("by DisplayObject", () => {
			const obj = createDisplayObject();
			const texturer = createTexturer([ [ "a", obj ] ]);
			expect(texturer.get(obj as Parameters<typeof texturer.get>[0])).toBe(texturer.get("a"));
		});
		
		test("throws when not found", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
			expect(() => texturer.get("missing")).toThrow('No such entry "missing"');
		});
		
		test("throws for out-of-range index", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
			expect(() => texturer.get(999)).toThrow('No such entry "999"');
		});
		
		test("by index 1 when multiple entries", () => {
			const texturer = createTexturer([
				[ "a", createDisplayObject() ],
				[ "b", createDisplayObject() ]
			]);
			expect(texturer.get(1)).toBe(texturer.get("b"));
		});
		
		test("by string index \"0\" returns first entry", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
			expect(texturer.get("0")).toBe(texturer.get(0));
		});
		
		test("by name takes precedence over numeric index", () => {
			const obj1 = createDisplayObject();
			const obj2 = createDisplayObject();
			const texturer = createTexturer([
				[ "a", obj1 ],
				[ "0", obj2 ]
			]);
			expect(texturer.get("0")).toBe(texturer.get(1));
			expect(texturer.get("0")).not.toBe(texturer.get(0));
		});
		
		test("throws for empty string when no such entry", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
			expect(() => texturer.get("")).toThrow(/No such entry/);
		});
		
		test("throws for null", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
			expect(() => texturer.get(null as unknown as Parameters<typeof texturer.get>[0])).toThrow(/No such entry/);
		});
		
		test("throws for undefined", () => {
			const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
			const key: undefined = undefined;
			expect(() => texturer.get(key as unknown as Parameters<typeof texturer.get>[0])).toThrow(/No such entry/);
		});
	});
	
	test("newSprite() returns Sprite with texture", () => {
		const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
		const sprite = texturer.newSprite("a") as { texture: unknown };
		expect(sprite).toBeInstanceOf(mockPixi.Sprite);
		expect(sprite.texture).toBe(texturer.get("a"));
	});
	
	test("newSprite() throws when entry not found", () => {
		const texturer = createTexturer([ [ "a", createDisplayObject() ] ]);
		expect(() => texturer.newSprite("missing")).toThrow('No such entry "missing"');
	});
	
	test("constructor options are stored", () => {
		const obj = createDisplayObject();
		const genOpts = { resolution: 2 };
		const texturer = createTexturer([ [ "a", obj ] ], {
			baseWidth: 256,
			trim: true,
			generateTexture: genOpts,
			preserveContents: true
		});
		expect(texturer.baseWidth).toBe(256);
		expect(texturer.trim).toBe(true);
		expect(texturer.generateTextureOptions).toBe(genOpts);
		expect(texturer.preserveContents).toBe(true);
	});
	
	test("generateTexture receives merged options", () => {
		const renderer = createMockRenderer();
		const generateTexture = (container: unknown, opts?: Record<string, unknown>): RenderTexture => {
			renderer.lastOpts = opts;
			
			return { baseTexture: {} } as unknown as RenderTexture;
		};
		const obj = createDisplayObject();
		const texturer = new Texturer([ [ "a", obj ] ], { generateTexture }, {
			baseWidth: BASE_WIDTH,
			generateTexture: { resolution: 3 }
		});
		expect(texturer.texture).toBeDefined();
		expect(renderer.lastOpts!.resolution).toBe(3);
		expect(renderer.lastOpts!.region).toBeDefined();
	});
});

describe("constructor baseWidth", () => {
	let originalWindow: { innerWidth: number } | undefined;
	
	beforeEach(() => {
		Texturer.use(mockPixi);
		originalWindow = (globalThis as { window?: { innerWidth: number } }).window;
		(globalThis as { window?: { innerWidth: number } }).window = { innerWidth: DEFAULT_INNER_WIDTH };
	});
	
	afterEach(() => {
		(globalThis as { window?: { innerWidth: number } }).window = originalWindow;
		Texturer.reset();
	});
	
	test("uses window.innerWidth when baseWidth omitted", () => {
		const texturer = new Texturer([ [ "a", createDisplayObject() ] ], createMockRenderer(), {});
		expect(texturer.baseWidth).toBe(DEFAULT_INNER_WIDTH);
	});
});

describe("exports", () => {
	test("index exports Texturer", () => {
		expect(Texturer).toBeDefined();
	});
	
	test("index exports types", () => {
		const sampleSpritesheet: SpritesheetData = {
			frames: {},
			meta: { image: "", size: { w: 0, h: 0 }, scale: "1" }
		};
		expect(sampleSpritesheet.meta.scale).toBe("1");
		const _entrySource: EntrySource = createDisplayObject();
		const _setEntry: SetEntry = [ "a", createDisplayObject() ];
		expect(_setEntry[0]).toBe("a");
	});
});
