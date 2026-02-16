import type { Container as PixiContainer, RenderTexture } from "pixi.js";
import { Texturer, type SetEntry } from "../src/index.js";


export const BASE_WIDTH = 512;
export const BASE_WIDTH_NARROW = 120;
export const DEFAULT_INNER_WIDTH = 800;
export const PADDING_UNIFORM = 4;

type Bounds = { x?: number; y?: number; width?: number; height?: number };

const destroyedContainers: Container[] = [];

class Container {
	x = 0;
	y = 0;
	children: unknown[] = [];
	
	getLocalBounds(): Bounds & { width: number; height: number } {
		return { x: 0, y: 0, width: 10, height: 10 };
	}
	
	addChild(child: unknown): unknown {
		this.children.push(child);
		
		return child;
	}
	
	destroy(_options?: { children?: boolean }): void {
		destroyedContainers.push(this);
	}
}

export function resetDestroyedContainers(): void {
	destroyedContainers.length = 0;
}

export function getDestroyedContainersCount(): number {
	return destroyedContainers.length;
}

class Rectangle {
	x: number;
	y: number;
	width: number;
	height: number;
	
	constructor(x: number, y: number, width: number, height: number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}

type TextureFrame = { x?: number; y?: number; width?: number; height?: number };

class Texture {
	source: unknown;
	frame: TextureFrame;
	rotate?: number;
	anchor?: { x: number; y: number };
	
	constructor(options: { source: unknown; frame?: TextureFrame; rotate?: number; defaultAnchor?: { x: number; y: number } }) {
		this.source = options.source;
		this.frame = options.frame ?? { width: 10, height: 10 };
		this.rotate = options.rotate;
		this.anchor = options.defaultAnchor;
	}
}

class Sprite {
	texture: Texture;
	
	constructor(texture: Texture) {
		this.texture = texture;
	}
}

(Sprite.prototype as unknown as { getLocalBounds?: () => Bounds & { width: number; height: number } }).getLocalBounds = function () {
	const frame = (this as { texture?: { frame?: { width?: number; height?: number } } }).texture?.frame;
	
	return { x: 0, y: 0, width: frame?.width ?? 10, height: frame?.height ?? 10 };
};

const textureSource = {};

export const mockPixi = {
	Assets: {
		load: (_id: string) => Promise.resolve(new Texture({ source: textureSource, frame: { width: 10, height: 10 } }))
	},
	Container,
	Rectangle,
	Texture,
	Sprite
} as unknown as Parameters<typeof Texturer.use>[0];

export const mockPixiWithoutAssets = {
	Container,
	Rectangle,
	Texture,
	Sprite
} as unknown as Parameters<typeof Texturer.use>[0];

export function createMockTexture(
	frame: { width?: number; height?: number } = { width: 10, height: 10 }
): Texture {
	return new Texture({ source: textureSource, frame: { width: frame.width ?? 10, height: frame.height ?? 10 } });
}

type MockRenderer = {
	generateTexture: (options: { target: unknown; frame?: unknown; [key: string]: unknown }) => RenderTexture;
	lastOpts?: Record<string, unknown>;
};

export function createMockRenderer(): MockRenderer {
	const renderer: MockRenderer = {
		generateTexture: (options: Record<string, unknown>) => {
			renderer.lastOpts = options;
			const { target: _target, frame, ...rest } = options;
			
			return { source: textureSource, frame, ...rest } as unknown as RenderTexture;
		}
	};
	
	return renderer;
}

export function createDisplayObject(
	bounds: Bounds & { width?: number; height?: number } = { x: 0, y: 0, width: 10, height: 10 }
): PixiContainer {
	const obj = new Container();
	obj.getLocalBounds = () => ({ x: 0, y: 0, width: 10, height: 10, ...bounds });
	
	return obj as unknown as PixiContainer;
}

type TexturerOptions = { baseWidth?: number; trim?: boolean; preserveContents?: boolean; generateTexture?: Record<string, unknown> };

export function createTexturer(entries: SetEntry[], options: TexturerOptions = {}): Texturer {
	return new Texturer(entries, createMockRenderer(), { baseWidth: BASE_WIDTH, ...options });
}
