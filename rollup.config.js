import pkg from "./package.json";
import terser from "@"
import typescript from "rollup-plugin-typescript2";

export default {
  input: "src/index.ts",
  output: [
    {
      format: "esm",
      file: pkg.main,
    },
    {
      format: "umd",
      name: pkg.name,
      file: pkg.browser,
    },
  ],
  plugins: [typescript()]
};
