import pkg from "./package.json";
import uglify from "rollup-plugin-uglify-es";
import terser from "@yuloh/rollup-plugin-terser";
import typescript from "@wessberg/rollup-plugin-ts";

export default {
  input: {
    index: "src/index.ts",
    actions: "src/query/actions.ts",
  },
  output: [
    {
      format: "esm",
      // file: pkg.main,
      dir: "dist",
    },
    // {
    //   format: "umd",
    //   name: pkg.name,
    //   file: pkg.browser,
    // },
  ],
  plugins: [typescript() /* terser(), uglify() */],
};
