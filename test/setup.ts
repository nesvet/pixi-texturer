import type { DisplayObject as PixiDisplayObject, RenderTexture } from "pixi.js";
import { Texturer, type SetEntry } from "../src/index.js";


export const BASE_WIDTH = 512;
export const BASE_WIDTH_NARROW = 120;
export const DEFAULT_INNER_WIDTH = 800;
export const PADDING_UNIFORM = 4;

type Bounds = { x?: number; y?: number; width?: number; height?: number };

class MockDisplayObject {
	getLocalBounds(): Bounds & { width: number; height: number } {
		return { x: 0, y: 0, width: 10, height: 10 };
	}
	
	x = 0;
	y = 0;
}

const destroyedContainers: Container[] = [];

class Container extends MockDisplayObject {
	children?: MockDisplayObject[] = [];
	destroyed?: boolean;
	
	addChild(child: MockDisplayObject): MockDisplayObject {
		this.children ??= [];
		this.children.push(child);
		
		return child;
	}
	
	destroy(_options?: boolean): void {
		destroyedContainers.push(this);
		this.destroyed = true;
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
	baseTexture: unknown;
	frame: TextureFrame;
	rotate?: number;
	anchor?: { x: number; y: number };
	
	constructor(
		baseTexture: unknown,
		frame: TextureFrame,
		_a?: unknown,
		_b?: unknown,
		rotate?: number,
		anchor?: { x: number; y: number }
	) {
		this.baseTexture = baseTexture;
		this.frame = frame;
		this.rotate = rotate;
		this.anchor = anchor;
	}
}

class Sprite {
	texture: Texture;
	
	constructor(texture: Texture) {
		this.texture = texture;
	}
}

(Sprite.prototype as { getLocalBounds?: () => Bounds & { width: number; height: number } }).getLocalBounds = function () {
	const frame = (this as { texture?: { frame?: { width?: number; height?: number } } }).texture?.frame;
	
	return { x: 0, y: 0, width: frame?.width ?? 10, height: frame?.height ?? 10 };
};

const baseTexture = {};

export const mockPixi = {
	Assets: {
		load: (_id: string) => Promise.resolve(new Texture(baseTexture, { width: 10, height: 10 }))
	},
	DisplayObject: MockDisplayObject,
	Container,
	Rectangle,
	Texture,
	Sprite
} as unknown as Parameters<typeof Texturer.use>[0];

export const mockPixiWithoutAssets = {
	DisplayObject: MockDisplayObject,
	Container,
	Rectangle,
	Texture,
	Sprite
} as unknown as Parameters<typeof Texturer.use>[0];

export function createMockTexture(
	frame: { width?: number; height?: number } = { width: 10, height: 10 }
): Texture {
	return new Texture(baseTexture, { width: frame.width ?? 10, height: frame.height ?? 10 });
}

type MockRenderer = {
	generateTexture: (container: unknown, opts?: Record<string, unknown>) => RenderTexture;
	lastOpts?: Record<string, unknown>;
};

export function createMockRenderer(): MockRenderer {
	return {
		generateTexture: (container: unknown, opts?: Record<string, unknown>) =>
			({ baseTexture, ...opts } as unknown as RenderTexture)
	};
}

export function createDisplayObject(
	bounds: Bounds & { width?: number; height?: number } = { x: 0, y: 0, width: 10, height: 10 }
): PixiDisplayObject {
	const obj = new MockDisplayObject();
	
	obj.getLocalBounds = () => ({ x: 0, y: 0, width: 10, height: 10, ...bounds });
	
	return obj as unknown as PixiDisplayObject;
}

type TexturerOptions = { baseWidth?: number; trim?: boolean; preserveContents?: boolean; generateTexture?: Record<string, unknown> };

export function createTexturer(entries: SetEntry[], options: TexturerOptions = {}): Texturer {
	return new Texturer(entries, createMockRenderer(), { baseWidth: BASE_WIDTH, ...options });
}
