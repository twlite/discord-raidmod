import { defineConfig } from "tsup";

export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    minify: false,
    skipNodeModulesBundle: true,
    sourcemap: true,
    target: "ES2020",
    keepNames: true,
    esbuildOptions: (options, ctx) => {
        if (ctx.format === "cjs") {
            options.banner = {
                js: "\"use strict\";"
            };
        }
    }
});