import esbuild from "esbuild";
import builtins from "builtin-modules";
import process from "process";
import fs from "fs";
import { minify } from "csso";

const banner =
`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
If you want to view the source, please visit the GitHub repository of this plugin.
*/
`;

const prod = process.argv.includes("--production");

const sharedOptions = {
	entryPoints: ["main.ts"],
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
		...builtins
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
	if (prod) {
		await esbuild.build(sharedOptions);
	} else {
		const context = await esbuild.context(sharedOptions);
		await context.watch();
		console.log("Watching for changes...");
	}
}

function buildCSS() {
	const input = fs.readFileSync("styles.src.css", "utf-8");
	const output = minify(input).css;
	fs.writeFileSync("styles.css", output);
	console.log("Minified styles.css");
}

async function main() {
	if (prod) {
		buildCSS();
		await buildJS();
	} else {
		await buildJS(); // watch mode
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});