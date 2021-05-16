const path = require("path");
const fs = require("fs");
const prettier = require("prettier");

const transformJs = require("./transformJs");
const transformHtml = require("./transformHtml");
const transformVue = require("./transformVue");
const { error } = require("../../utils/log");
function transformFile(file, locales) {
  const extname = path.extname(file);
  const dirname = path.dirname(file);
  const filename = path.basename(file);
  const content = fs.readFileSync(file, {
    encoding: "utf-8",
  });
  let code,
    isChange = false;
  if (extname === ".vue") {
    const { source, isReplace } = transformVue(content, locales);
    code = source;
    isChange = isReplace;
  } else if (extname === ".js") {
    const { source, isReplace } = transformJs(content, locales);
    code = source;
    isChange = isReplace;
    if (isChange) {
      code = prettier.format(code, {
        parser: "babel",
        singleQuote: true,
        semi: false,
      });
    }
  } else {
    error("未支持的文件格式");
    throw new Error("未支持的文件格式");
  }

  return {
    extname,
    dirname,
    filename,
    code,
    isChange,
  };
}

module.exports = {
  transformJs,
  transformHtml,
  transformVue,
  transformFile,
};
