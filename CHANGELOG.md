# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-02-16

### Added

- Advanced examples in README (setAsync, mixed sources, object format, toSpritesheetData)

### Changed

- **BREAKING**: Requires PixiJS ^8 (was ^7).
- **BREAKING**: DisplayObject → Container. Types and API (`get`, `newSprite`, `items` Map) now use `Container`. Entry: removed `item`, use `displayObject` only.
- **BREAKING**: Custom `generateTexture`: signature changed from `(displayObject, { region })` to `({ target, frame })`
- **BREAKING**: Texture API: `baseTexture` → `source`, `region` → `frame`

### Fixed

- Options normalization for object entry format

## [1.1.0] - 2026-02-16

### Added

- `setAsync()` — load assets from URLs via PIXI.Assets
- `toSpritesheetData(metaImage)` — export spritesheet JSON
- Entry object format: `{ name/names, source, ...options }`
- Entry sources: `Texture`, `HTMLImageElement`, `HTMLCanvasElement`
- Entry options: `region`, `x`, `y`, `width`, `height`, `pivot`, `rotate`, `anchor`
- Node.js: `baseWidth` defaults to 800 when `window` is absent
- TypeScript type definitions
- Unit test suite
- CI workflow (lint, typecheck, test, build)

### Changed

- Migrated to TypeScript
- Publish workflow: trigger on GitHub Release instead of push to main
- Output: `lib/` → `dist/`

### Removed

- `lib/` (compiled JS output)

[Unreleased]: https://github.com/nesvet/pixi-texturer/compare/2.0.0...HEAD
[2.0.0]: https://github.com/nesvet/pixi-texturer/compare/1.1.0...2.0.0
[1.1.0]: https://github.com/nesvet/pixi-texturer/releases/tag/1.1.0
