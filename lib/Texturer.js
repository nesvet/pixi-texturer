let PIXI;


export class Texturer {
	constructor(entries, renderer, options = {}) {
		
		if (!PIXI)
			throw new Error("Do Texturer.use(PIXI) before using Texturer");
		
		const {
			baseWidth = window.innerWidth,
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
	
	names = new Map();
	
	items = new Map();
	
	set(entries) {
		
		this.names.clear();
		this.items.clear();
		
		this.list = entries.map(([ names, item, options = {} ], i) => {
			if (typeof names == "object" && !Array.isArray(names)) {
				options = item ?? {};
				item = names;
				names = [];
			} else if (typeof names == "string")
				names = [ names ];
			
			let displayObject;
			if (item instanceof PIXI.DisplayObject)
				displayObject = item;
			else
				throw new Error("Only PIXI.DisplayObjects are supported");
			
			if (options.padding)
				if (typeof options.padding == "number") {
					options.paddingTop = options.padding;
					options.paddingRight = options.padding;
					options.paddingBottom = options.padding;
					options.paddingLeft = options.padding;
				} else if (Array.isArray(options.padding)) {
					const [ paddingTop, paddingRight, paddingBottom = paddingTop, paddingLeft = paddingRight ] = options.padding;
					if (paddingTop !== undefined)
						options.paddingTop = paddingTop;
					if (paddingRight !== undefined)
						options.paddingRight = paddingRight;
					if (paddingBottom !== undefined)
						options.paddingBottom = paddingBottom;
					if (paddingLeft !== undefined)
						options.paddingLeft = paddingLeft;
				}
			
			
			const entry = {
				names,
				item,
				displayObject,
				rectangle: null,
				texture: null,
				options: {
					paddingTop: 0,
					paddingRight: 0,
					paddingBottom: 0,
					paddingLeft: 0,
					...options
				}
			};
			
			if (names)
				if (this.names.hasAny(names))
					throw new Error(`Entry with name of [ "${names.join(", ")}" ] is already exists`);
				else
					for (const name of names)
						this.names.set(name, entry);
			
			if (this.items.has(item))
				throw new Error(`Entry with index ${i} is already exists`);
			else
				this.items.set(item, entry);
			
			return entry;
		});
		
		this.update();
		
	}
	
	update() {
		
		this.container = new PIXI.Container();
		
		let x = 1, y = 1, rowHeight = 0, totalWidth = 0;
		
		for (const entry of this.list) {
			this.container.addChild(entry.displayObject);
			
			const { options } = entry;
			let width, height, lx, ly;
			
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
			if (options.width)
				width = options.width;
			if (options.height)
				height = options.height;
			
			width += options.paddingLeft + options.paddingRight;
			height += options.paddingTop + options.paddingBottom;
			
			const x2 = x + width;
			if (x > 1 && x2 > this.baseWidth) {
				if (totalWidth < x2)
					totalWidth = Math.ceil(x2);
				x = 1;
				y += rowHeight + 1;
				rowHeight = Math.ceil(height);
			} else if (rowHeight < height)
				rowHeight = Math.ceil(height);
			
			entry.rectangle = new PIXI.Rectangle(x, y, width, height);
			
			entry.displayObject.x = x - lx + options.paddingLeft;
			entry.displayObject.y = y - ly + options.paddingTop;
			
			x += Math.ceil(width) + 1;
		}
		
		if (totalWidth < x)
			totalWidth = x;
		
		totalWidth++;// @HACK See below
		
		const totalHeight = y + rowHeight + 1;// @HACK See below
		
		/*
		 * @HACK Increasing totalWidth and totalHeight by 1 for strange rounding bug
		 * When resolution is, for example, 1.25, texture.height might be slightly lower than required height
		 * So increasing totalHeight by 1 resulting texture.height is guaranteed (hope so) fit required height
		 */
		
		this.texture = this.renderer.generateTexture(this.container, {
			...this.generateTextureOptions,
			region: new PIXI.Rectangle(0, 0, totalWidth, totalHeight)
		});
		
		for (const entry of this.list) {
			if (entry.options.pivot)
				entry.options.anchor = {
					x: entry.options.pivot.x / entry.rectangle.width,
					y: entry.options.pivot.y / entry.rectangle.height
				};
			
			entry.texture = new PIXI.Texture(this.texture.baseTexture, entry.rectangle, undefined, undefined, entry.options.rotate, entry.options.anchor);
		}
		
		if (!this.preserveContents)
			this.container.destroy(true);
		
	}
	
	get(key) {
		const entry = this.names.get(key) ?? this.list[key] ?? this.items.get(key);
		if (!entry)
			throw new Error(`No such entry "${key}"`);
		
		return entry.texture;
	}
	
	newSprite(key) {
		return new PIXI.Sprite(this.get(key));
	}
	
	
	static use(pixi) {
		PIXI = pixi;
		
	}
	
}
