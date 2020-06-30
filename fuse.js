/* eslint-disable @typescript-eslint/no-var-requires */
const { FuseBox, QuantumPlugin } = require("fuse-box");

const fuse = FuseBox.init({
  homeDir: "src",
  target: "browser@es5",
  output: "dist/$name.js",
  globals: { default: "*" },
  useTypescriptCompiler: true,
  plugins: [
    QuantumPlugin({ uglify: true, treeshake: true, bakeApiIntoBundle: true }),
  ],
});

fuse
  .bundle("webase")
  .instructions(" > index.ts")
  .watch();

fuse.run();
