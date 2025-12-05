// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .wasm and .txt to asset extensions so they get copied as assets
config.resolver.assetExts.push('wasm');
config.resolver.assetExts.push('txt');

// The tic80.js file is a browser-only Emscripten output that tries to use
// Node.js 'fs' module. We need to prevent Metro from trying to bundle it
// as a source file. Instead, rename it to .tic80js so it's treated as an asset.
// Or we can use a custom resolver to handle it.

// For now, let's exclude it from source extensions when in the assets/tic80 folder
// by using a custom resolver
// Block tic80.js from being bundled - it should only be loaded via HTML
// We use blockList instead of custom resolver to avoid interfering with assets
config.resolver.blockList = [
    /assets\/tic80\/tic80\.js$/,
];

module.exports = config;
