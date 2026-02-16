import type {
	Container,
	Rectangle,
	RenderTexture,
	Sprite,
	Texture
} from "pixi.js";


export type PixiLike = {
	Assets?: { load: (id: string) => Promise<Texture> };
	Container: new () => Container;
	Rectangle: new (x: number, y: number, width: number, height: number) => Rectangle;
	Texture: new (options: { source: unknown; frame?: Rectangle; rotate?: number; defaultAnchor?: { x: number; y: number } }) => Texture;
	Sprite: new (texture: Texture) => Sprite;
};

export type EntryOptions = {
	padding?: number[] | [number, number, number?, number?] | number;
	paddingTop?: number;
	paddingRight?: number;
	paddingBottom?: number;
	paddingLeft?: number;
	region?: { x: number; y: number; width: number; height: number };
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	trim?: boolean;
	pivot?: { x: number; y: number };
	rotate?: boolean | number;
	anchor?: { x: number; y: number };
};

export type TexturerOptions = {
	baseWidth?: number;
	trim?: boolean;
	generateTexture?: Record<string, unknown>;
	preserveContents?: boolean;
};

export type GenerateTextureLike = {
	generateTexture: (options: { target: Container; frame?: Rectangle; [key: string]: unknown }) => RenderTexture;
};

export type Entry = {
	names: string[];
	displayObject: Container;
	rectangle: Rectangle | null;
	texture: Texture | null;
	options: EntryOptions & Required<Pick<EntryOptions, "paddingBottom" | "paddingLeft" | "paddingRight" | "paddingTop">>;
};

export type EntrySource = Container | HTMLCanvasElement | HTMLImageElement | Texture | string;

export type EntryObject = EntryOptions & { name?: string; names?: string[]; source: EntrySource };

/**
 * Entry format for Texturer:
 * - [name, source] or [name, source, options]
 * - [[name1, name2], source] or [[name1, name2], source, options]
 * - [source, options] — no name, access by index only
 * - { name, source } or { names, source } or { source } with optional options
 */
export type SetEntry = EntryObject | [Container | string[] | string, EntryOptions | EntrySource, EntryOptions?];

export type SpritesheetFrameData = {
	frame: { x: number; y: number; w: number; h: number };
	spriteSourceSize: { x: number; y: number; w: number; h: number };
	sourceSize: { w: number; h: number };
	anchor?: { x: number; y: number };
	trimmed?: boolean;
	rotated?: boolean;
};

export type SpritesheetData = {
	frames: Record<string, SpritesheetFrameData>;
	meta: { image: string; size: { w: number; h: number }; scale: string };
};
