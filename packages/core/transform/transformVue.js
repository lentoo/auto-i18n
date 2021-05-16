const compiler = require("vue-template-compiler");
const transformJs = require("./transformJs");
const transformHtml = require("./transformHtml");
const prettier = require("prettier");

function openTag(sfcBlock) {
  const { type, lang, src, scoped, module, attrs } = sfcBlock;

  let tag = `<${type}`;
  if (lang) tag += ` lang="${lang}"`;
  if (src) tag += ` src="${src}"`;
  if (scoped) tag += " scoped";
  if (module) {
    if (typeof module === "string") tag += ` module="${module}"`;
    else tag += " module";
  }
  for (let k in attrs) {
    if (!["type", "lang", "src", "scoped", "module"].includes(k)) {
      tag += ` ${k}="${attrs[k]}"`;
    }
  }
  tag += ">";

  return tag;
}

function closeTag(sfcBlock) {
  return `</${sfcBlock.type}>`;
}

function combineVue(template, script, styles, customBlocks) {
  return [template, script, ...styles, ...customBlocks]
    .map((sfc) =>
      sfc ? `${openTag(sfc)}\n${sfc.content.trim()}\n${closeTag(sfc)}\n` : ""
    )
    .join("\n");
}

module.exports = function transformVue(source, locales) {
  const sfc = compiler.parseComponent(source, {
    pad: "space",
    deindent: false,
  });
  const { template, script, styles, customBlocks } = sfc;
  let isChange = false;
  // transform template
  if (template) {
    const { source, isReplace } = transformHtml(template.content, locales);
    template.content = source;
    if (isReplace) isChange = true;
  }

  // transform script
  if (script) {
    const { source: jsSource, isReplace } = transformJs(
      script.content,
      locales
    );
    if (isReplace) isChange = true;
    script.content = jsSource;
  }

  let code = combineVue(template, script, styles, customBlocks);

  code = prettier.format(code, {
    // filepath: './.prettierrc.json',
    semi: false,
    singleQuote: true,
    jsxBracketSameLine: true,
    htmlWhitespaceSensitivity: "ignore",
    embeddedLanguageFormatting: "auto",
    // embeddedInHtml: 'off',
    trailingComma: "none",
    branchSpacing: true,
    parser: "vue",
    // insertPragma: true,
    vueIndentScriptAndStyle: true,
  });

  return { source: code, isReplace: isChange };
};
