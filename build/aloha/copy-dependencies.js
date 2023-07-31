const fs = require("fs-extra");

const tempPath = "src/lib";
const destinationPath =
  "target/build-profile-with-common-extra-plugins/rjs-output/lib";

const dependencies = ["aloha/ecma5shims"];

for (const dependency of dependencies) {
  fs.copySync(
    `${tempPath}/${dependency}.js`,
    `${destinationPath}/${dependency}.js`,
  );
}
