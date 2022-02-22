const fs = require("fs");
const filePath = `${__dirname}/../dist/index.mjs`;

const contents = fs.readFileSync(filePath, { encoding: "utf-8" });
const updated = `import{createRequire as __rmCreateRequire}from "module";\nvar require=__rmCreateRequire(import.meta.url);\n${contents}`;

fs.writeFileSync(filePath, updated);
