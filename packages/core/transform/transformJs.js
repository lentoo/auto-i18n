
const babel = require('@babel/core');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const { setUntranslatedText } = require('../../utils')
const { info, error } = require('../../utils/log')


function makeVisitor(lang, r) {
  const langs = lang
  return {
    StringLiteral(path) {
      const { node } = path;
      const { value } = node;
      switch (path.parent.type) {
        case 'ObjectProperty': 
        case 'ConditionalExpression': 
        case 'VariableDeclarator': {
          const reg = /[\u4e00-\u9fa5]+/
          
          if (!reg.test(value)) break;
          
          if (langs[value.trim()]) {
            // console.log('value', value.trim())
            info(`js : transform ${value} => ${langs[value]}`)
            node.value = langs[value]
            r.isReplace = true
          } else {
            if (value.trim()) {
              error('js : 缺少翻译 => ' + value)
              setUntranslatedText(value.trim())
            }
          }
        }
        break
      }
      path.skip()
    },
    TemplateLiteral(path) {
      const { node } = path

      const tempArr = [...node.quasis, ...node.expressions]
      tempArr.sort((a, b) => a.start - b.start);

      let value = ''
      tempArr.forEach(nd => {
        if (nd.type === 'TemplateElement') {
          value += nd.value.cooked
        }
        if (nd.type === 'Identifier') {
          value += '${' + nd.name + '}'
        }
      })
      if (langs[value]) {
        const quasis = []
        const expressions = []
        if (langs[value].includes(' ')) {
          const arr = langs[value].split(' ')
          let v = ''
          console.log(`js : transform ${value} => ${langs[value]}`)
          arr.forEach(text => {
            if (text.startsWith('$')) {

              quasis.push(t.templateElement({
                raw: v,
                cooked: v
              }))
              v = ''
              expressions.push(t.identifier(text.slice(2, -1)))
              v += ' '
            } else {
              v += text + ' '
            }
          })
          if (v != '') {
            quasis.push(t.templateElement({
              raw: v,
              cooked: v
            }))
            v = ''
          }
          node.quasis = quasis
          node.expressions = expressions
        } else {
          if (value.trim()) {
            error('js : 缺少翻译 => ' + value)
            setUntranslatedText(value.trim())
          }
        }
      }
    }
  }
}

module.exports = function(source, lang) {

  const transformOptions = {
    sourceType: 'module',
    ast: true,
    configFile: false,
    presets: [],
    plugins: [
      // pluginSyntaxJSX,
      // pluginSyntaxProposalOptionalChaining,
      // pluginSyntaxClassProperties,
      // [pluginSyntaxDecorators, { decoratorsBeforeExport: true }],
      // pluginSyntaxObjectRestSpread,
      // pluginSyntaxAsyncGenerators,
      // pluginSyntaxDoExpressions,
      // pluginSyntaxDynamicImport,
      // pluginSyntaxExportExtensions,
      // pluginSyntaxFunctionBind,
      // ...babelPlugins,
    ],
  };

  const ast = babel.parseSync(source, transformOptions)
  const r = {
    isReplace: false
  }
  traverse(ast, makeVisitor(lang, r))

  let { code } = generate(ast, { retainLines: false, decoratorsBeforeExport: true }, source)
  // console.log('code', code)
  return { source: code, isReplace: r.isReplace }
}