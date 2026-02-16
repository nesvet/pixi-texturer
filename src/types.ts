import type {
	DisplayObject,
	Rectangle,
	RenderTexture,
	Texture
} from "pixi.js";


export type PixiLike = {
	Assets?: { load: (id: string) => Promise<Texture> };
	DisplayObject: new (...args: unknown[]) => DisplayObject;
	Container: new () => { addChild: (child: DisplayObject) => DisplayObject; destroy: (options?: boolean) => void };
	Rectangle: new (x: number, y: number, width: number, height: number) => Rectangle;
	Texture: new (
		baseTexture: unknown,
		frame?: Rectangle,
		orig?: Rectangle,
		trim?: Rectangle,
		rotate?: number,
		anchor?: { x: number; y: number }
	) => Texture;
	Sprite: new (texture: Texture) => unknown;
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
	generateTexture: (displayObject: unknown, options?: { region?: Rectangle; [key: string]: unknown }) => RenderTexture;
};

export type Entry = {
	names: string[];
	item: DisplayObject;
	displayObject: DisplayObject;
	rectangle: Rectangle | null;
	texture: Texture | null;
	options: EntryOptions & Required<Pick<EntryOptions, "paddingBottom" | "paddingLeft" | "paddingRight" | "paddingTop">>;
};

export type EntrySource = DisplayObject | HTMLCanvasElement | HTMLImageElement | Texture | string;

export type EntryObject = EntryOptions & { name?: string; names?: string[]; source: EntrySource };

export type SetEntry = EntryObject | [DisplayObject | string[] | string, EntryOptions | EntrySource, EntryOptions?];

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
