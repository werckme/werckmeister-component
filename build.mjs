// Builds the web component bundle into dist/.
//
//   node build.mjs           production build (minified)
//   node build.mjs --serve   dev server on http://localhost:1234 with rebuild on change
//                            (open /test-snippet.html or /test-workspace.html)
//   node build.mjs --watch   rebuild dist/ on change, e.g. for a linked consumer
import * as esbuild from 'esbuild';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import path from 'node:path';

const outdir = 'dist';
const serve = process.argv.includes('--serve');
const watch = process.argv.includes('--watch');
const dev = serve || watch;

// Runtime files of the werckmeister compiler and the midi player (wasm and
// emscripten loaders). They are looked up next to werckmeister-components.js
// at runtime, so they are copied into dist/ as they are.
const staticPackages = [
    'node_modules/@werckmeister/compilerjs',
    'node_modules/@werckmeister/midiplayer',
];
const skipStaticFiles = new Set(['package.json', 'README.md', 'LICENSE']);

async function copyStaticFiles() {
    await mkdir(outdir, { recursive: true });
    for (const dir of staticPackages) {
        for (const file of await readdir(dir)) {
            if (!skipStaticFiles.has(file)) {
                await cp(path.join(dir, file), path.join(outdir, file), { recursive: true });
            }
        }
    }
}

/** @type {esbuild.BuildOptions} */
const options = {
    entryPoints: ['src/werckmeister-components.ts'],
    outfile: path.join(outdir, 'werckmeister-components.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2018',
    // component templates and styles are inlined as strings
    loader: { '.css': 'text', '.html': 'text' },
    // node-only code paths of the emscripten loaders, never reached in the browser
    external: builtinModules,
    minify: !dev,
    sourcemap: dev,
    logLevel: 'info',
};

if (!dev) {
    await rm(outdir, { recursive: true, force: true });
}
await copyStaticFiles();

if (dev) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    if (serve) {
        const { port } = await ctx.serve({ servedir: '.', port: 1234 });
        console.log(`serving on http://localhost:${port}/test-snippet.html and /test-workspace.html`);
    }
} else {
    await esbuild.build(options);
}
