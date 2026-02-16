import type {
	Container,
	RenderTexture,
	Sprite,
	Texture
} from "pixi.js";
import type {
	Entry,
	EntryOptions,
	EntrySource,
	GenerateTextureLike,
	PixiLike,
	SetEntry,
	SpritesheetData,
	TexturerOptions
} from "./types.js";


// eslint-disable-next-line @typescript-eslint/naming-convention -- PixiJS convention
let PIXI: PixiLike | undefined;


function resolveToDisplayObject(source: EntrySource): Container {
	if (source instanceof PIXI!.Container)
		return source;
	
	if (source && typeof source === "object" && "source" in source)
		return new PIXI!.Sprite(source as Texture) as Container;
	
	if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
		const texture = (PIXI!.Texture as unknown as { from: (s: unknown) => Texture }).from(source);
		
		return new PIXI!.Sprite(texture) as Container;
	}
	
	if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
		const texture = (PIXI!.Texture as unknown as { from: (s: unknown) => Texture }).from(source);
		
		return new PIXI!.Sprite(texture) as Container;
	}
	
	if (typeof source === "string")
		throw new Error("String sources require setAsync(); use await texturer.setAsync(entries)");
	
	throw new Error("Only PIXI.Containers are supported");
}


export class Texturer {
	constructor(entries: SetEntry[], renderer: GenerateTextureLike, options: TexturerOptions = {}) {
		
		if (!PIXI)
			throw new Error("Do Texturer.use(PIXI) before using Texturer");
		
		const {
			baseWidth = globalThis.window === undefined ? 800 : globalThis.window.innerWidth,
			trim = false,
			generateTexture: generateTextureOptions = {},
			preserveContents = false
		} = options;
		
		this.renderer = renderer;
		this.baseWidth = baseWidth;
		this.trim = trim;
		this.generateTextureOptions = generateTextureOptions;
		this.preserveContents = preserveContents;
		
		this.set(entries);
	}
	
	renderer: GenerateTextureLike;
	baseWidth: number;
	trim: boolean;
	generateTextureOptions: Record<string, unknown>;
	preserveContents: boolean;
	names = new Map<string, Entry>();
	items = new Map<Container, Entry>();
	list!: Entry[];
	container!: Container;
	texture!: RenderTexture;
	
	set(entries: SetEntry[]): void {
		
		this.names.clear();
		this.items.clear();
		
		const normalized = entries.map((entry): [Container | string[] | string, EntryOptions | EntrySource, EntryOptions?] => {
			
			if (Array.isArray(entry))
				return entry;
			
			if (entry && typeof entry === "object" && "source" in entry) {
				const obj = entry;
				const { source, name, names, ...options } = obj;
				const resolvedNames = name === undefined ? (names ?? []) : [ name ];
				
				return [ resolvedNames, source, options ];
			}
			
			throw new Error("Entry must be [name, source, options?] or { name/names, source, ...options }");
		});
		
		this.list = normalized.map(([ names, item, options = {} ], i) => {
			
			let resolvedNames: string[];
			let resolvedSource: EntrySource;
			let resolvedOptions: EntryOptions;
			
			if (typeof names === "object" && !Array.isArray(names)) {
				resolvedOptions = (typeof item === "object" && item !== null && !Array.isArray(item) ? { ...item } : {}) as EntryOptions;
				resolvedSource = names as unknown as EntrySource;
				resolvedNames = [];
			} else if (typeof names === "string") {
				resolvedNames = [ names ];
				resolvedSource = item as EntrySource;
				resolvedOptions = { ...options };
			} else {
				resolvedNames = names;
				resolvedSource = item as EntrySource;
				resolvedOptions = { ...options };
			}
			
			if (resolvedOptions.padding)
				if (typeof resolvedOptions.padding === "number") {
					resolvedOptions.paddingTop = resolvedOptions.padding;
					resolvedOptions.paddingRight = resolvedOptions.padding;
					resolvedOptions.paddingBottom = resolvedOptions.padding;
					resolvedOptions.paddingLeft = resolvedOptions.padding;
				} else if (Array.isArray(resolvedOptions.padding)) {
					const [ paddingTop, paddingRight, paddingBottom = paddingTop, paddingLeft = paddingRight ] = resolvedOptions.padding;
					if (paddingTop !== undefined)
						resolvedOptions.paddingTop = paddingTop;
					if (paddingRight !== undefined)
						resolvedOptions.paddingRight = paddingRight;
					if (paddingBottom !== undefined)
						resolvedOptions.paddingBottom = paddingBottom;
					if (paddingLeft !== undefined)
						resolvedOptions.paddingLeft = paddingLeft;
				}
			
			const displayObject = resolveToDisplayObject(resolvedSource);
			
			const entry: Entry = {
				names: resolvedNames,
				displayObject,
				rectangle: null,
				texture: null,
				options: {
					paddingTop: 0,
					paddingRight: 0,
					paddingBottom: 0,
					paddingLeft: 0,
					...resolvedOptions
				}
			};
			
			if (resolvedNames.length) {
				if (resolvedNames.some(name => this.names.has(name)))
					throw new Error(`Entry with name [ "${resolvedNames.join(", ")}" ] already exists`);
				
				for (const name of resolvedNames)
					this.names.set(name, entry);
			}
			
			const sourceAsContainer = resolvedSource as Container;
			if (sourceAsContainer instanceof PIXI!.Container) {
				if (this.items.has(sourceAsContainer))
					throw new Error(`Duplicate DisplayObject at index ${i}`);
				
				this.items.set(sourceAsContainer, entry);
			}
			
			return entry;
		});
		
		this.update();
		
	}
	
	async setAsync(entries: SetEntry[]): Promise<void> {
		
		if (!PIXI?.Assets)
			throw new Error("PIXI.Assets is required for setAsync; ensure you pass the full pixi.js namespace to Texturer.use()");
		
		const resolved = await Promise.all(entries.map(async (entry): Promise<SetEntry> => {
			
			if (Array.isArray(entry)) {
				const [ names, item, options = {} ] = entry;
				
				if (typeof item === "string") {
					const texture = await PIXI!.Assets!.load(item);
					
					return [ names, texture, options ];
				}
				
				return entry;
			}
			
			if (entry && typeof entry === "object" && "source" in entry) {
				const obj = entry;
				
				if (typeof obj.source === "string") {
					const texture = await PIXI!.Assets!.load(obj.source);
					
					return { ...obj, source: texture };
				}
				
				return entry;
			}
			
			return entry;
		}));
		
		this.set(resolved);
		
	}
	
	update(): void {
		
		this.container = new PIXI!.Container();
		
		const withDims = this.list.map((entry, index) => {
			
			const { options } = entry;
			let width: number;
			let height: number;
			let lx: number;
			let ly: number;
			
			if (options.region)
				({ x: lx, y: ly, width, height } = options.region);
			else {
				const localBounds = entry.displayObject.getLocalBounds();
				if (options.trim || (this.trim && options.trim !== false))
					({ x: lx, y: ly, width, height } = localBounds);
				else {
					lx = 0;
					ly = 0;
					width = localBounds.x + localBounds.width;
					height = localBounds.y + localBounds.height;
				}
			}
			
			if (options.x !== undefined)
				lx = options.x;
			if (options.y !== undefined)
				ly = options.y;
			if (options.width !== undefined)
				({ width } = options);
			if (options.height !== undefined)
				({ height } = options);
			
			width += options.paddingLeft + options.paddingRight;
			height += options.paddingTop + options.paddingBottom;
			
			return { entry, index, width, height, lx, ly };
		});
		
		withDims.sort((a, b) => {
			const dh = b.height - a.height;
			
			return dh === 0 ? a.index - b.index : dh;
		});
		
		let x = 1;
		let y = 1;
		let rowHeight = 0;
		let totalWidth = 0;
		
		for (const { entry, width, height, lx, ly } of withDims) {
			this.container.addChild(entry.displayObject);
			
			const { options } = entry;
			const x2 = x + width;
			
			if (x > 1 && x2 > this.baseWidth) {
				if (totalWidth < x2)
					totalWidth = Math.ceil(x2);
				x = 1;
				y += rowHeight + 1;
				rowHeight = Math.ceil(height);
			} else if (rowHeight < height)
				rowHeight = Math.ceil(height);
			
			entry.rectangle = new PIXI!.Rectangle(x, y, width, height);
			
			entry.displayObject.x = x - lx + options.paddingLeft;
			entry.displayObject.y = y - ly + options.paddingTop;
			
			x += Math.ceil(width) + 1;
		}
		
		if (totalWidth < x)
			totalWidth = x;
		
		totalWidth++;
		const totalHeight = y + rowHeight + 1;
		
		/*
		 * @HACK +1 to totalWidth/totalHeight: guard against texture dimensions being slightly smaller than required.
		 * PixiJS may truncate fractional sizes (GenerateTextureSystem | 0) or suffer float precision loss
		 * with non-integer resolution (e.g. 1.33). Extra pixel ensures last row/column is not cropped.
		 */
		
		this.texture = this.renderer.generateTexture({
			...this.generateTextureOptions,
			target: this.container,
			frame: new PIXI!.Rectangle(0, 0, totalWidth, totalHeight)
		});
		
		for (const entry of this.list) {
			const rect = entry.rectangle!;
			
			if (entry.options.pivot && rect.width && rect.height) {
				const { x: pivotX, y: pivotY } = entry.options.pivot;
				entry.options.anchor = {
					x: pivotX / rect.width,
					y: pivotY / rect.height
				};
			}
			
			const rotate = entry.options.rotate === true ? 1 : typeof entry.options.rotate === "number" ? entry.options.rotate : undefined;
			entry.texture = new PIXI!.Texture({
				source: this.texture.source,
				frame: rect,
				rotate,
				defaultAnchor: entry.options.anchor
			});
		}
		
		if (!this.preserveContents)
			this.container.destroy({ children: true });
		
	}
	
	toSpritesheetData(metaImage = ""): SpritesheetData {
		
		const frames: Record<string, SpritesheetData["frames"][string]> = {};
		
		for (let i = 0; i < this.list.length; i++) {
			const entry = this.list[i];
			const rect = entry.rectangle!;
			const frameData: SpritesheetData["frames"][string] = {
				frame: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
				spriteSourceSize: { x: 0, y: 0, w: rect.width, h: rect.height },
				sourceSize: { w: rect.width, h: rect.height }
			};
			if (entry.options.anchor)
				frameData.anchor = entry.options.anchor;
			if (entry.options.rotate)
				frameData.rotated = true;
			
			const key = entry.names[0] ?? String(i);
			frames[key] = frameData;
		}
		
		const w = this.texture?.width ?? 0;
		const h = this.texture?.height ?? 0;
		
		return {
			frames,
			meta: { image: metaImage, size: { w, h }, scale: "1" }
		};
	}
	
	get(key: Container | number | string): Texture {
		const entry = this.names.get(key as string) ?? this.list[key as number] ?? this.items.get(key as Container);
		
		if (!entry)
			throw new Error(`No such entry "${typeof key === "object" ? "[DisplayObject]" : String(key)}"`);
		
		return entry.texture!;
	}
	
	newSprite(key: Container | number | string): Sprite {
		return new PIXI!.Sprite(this.get(key));
	}
	
	
	static use(pixi: PixiLike): void {
		PIXI = pixi;
	}
	
	static reset(): void {
		PIXI = undefined;
	}
}
