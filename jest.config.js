const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
	testEnvironment: "jsdom",
	transform: {
		...tsJestTransformCfg,
	},
	coverageProvider: "v8",
	coverageDirectory: "coverage",
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/__tests__/**", "!node_modules/**"],
};
