import esbuild from "esbuild";
import builtins from "builtin-modules";
import process from "process";
import fs from "fs";
import { minify } from "csso";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
If you want to view the source, please visit the GitHub repository of this plugin.
*/
`;

const prod = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const sharedOptions = {
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	minify: prod,
	keepNames: true,
	banner: {
		js: banner,
	},
};

async function buildJS() {
	if (watch) {
		const context = await esbuild.context(sharedOptions);
		console.log("Watching for changes...");
		await context.watch();
	} else {
		await esbuild.build(sharedOptions);
	}
}

function buildCSS() {
	const input = fs.readFileSync("src/styles.src.css", "utf-8");
	const output = minify(input).css;
	fs.writeFileSync("styles.css", output);
	console.log("Minified styles.css");
}

async function main() {
	if (prod) {
		buildCSS();
	}
	await buildJS();
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
