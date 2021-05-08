const mustache = require('mustache');
const parse5 = require('parse5');
const prettier = require('prettier');
const transformJs = require('./transformJs')

const { info, error } = require('../../utils/log')
const { setUntranslatedText } = require('../../utils')

function isPrimary(str) {
  return /[\u4e00-\u9fa5]+/.test(str);
}

function transformJsExpression(source, lang) {
  const { source: code , isReplace } = transformJs(source, lang)
  if (!isReplace) {
    return source
  } 
  return prettier.format(code, {
    parser: 'babel',
    singleQuote: true,
    semi: false,
  })
}

function replace(value, langs, r) {
  if (!langs[value]) {
    error('html : 缺少翻译 => ' + value)
    setUntranslatedText(value)
    return value
  }
  r.isReplace = true
  info(`html : transform ${value} => ${langs[value]}`)
  return langs[value]
}

function traverseHtml(source, lang) {
  const langs = lang
  function traverse(node, r) {
    // console.log(node)
    // console.log(node.content)
    if (node.nodeName === 'template') {
      node.content.childNodes.forEach(childNode => traverse(childNode, r))
    }
    if (node.childNodes) {
      node.childNodes.forEach(childNode => traverse(childNode, r));
    }
    let value = node.value

    // 处理属性
    node.attrs && node.attrs.forEach(attr => {
      let { name, value } = attr
      if (!isPrimary(value)) return

      if (name.startsWith('v-') || name.startsWith(':') || name.startsWith('@')) {
        // vue 指令
        // v-xx :xx @xx
        // 引号内是js表达式
        const source = transformJsExpression(value, lang)
        if (value !== source) {
          attr.value = source
          r.isReplace = true
        }
      } else {
        // 普通属性
        attr.value = replace(value, langs, r)
      }
      
    })
    let v = ''
    if (node.nodeName === '#text') {
      if (!isPrimary(node.value)) return
      // token 结构：[类型(text|name), 值, 起始位置(包含), 终止位置(不包含)]
      // console.log(node.value)
      const tokens = mustache.parse(node.value);
      // console.log('tokens', tokens)
      for (const token of tokens) {
        if (token[0] === 'text') {
          const key = token[1].trim()
          if (langs[key]) {
            
            v += replace(key)

          } else {
            if (key) {
              error('html : 缺少翻译 => ' + key)
              setUntranslatedText(key)
            } else {
              v += key
            }
          }
        } else if (token[0] === 'name') {
          v += `{{${transformJsExpression(token[1], lang)}}}`
        }
      }
    }
    if (node.value !== v) {
      node.value = v
    }
    return node
  }
  const document = parse5.parse(
    source,
    {
      sourceCodeLocationInfo: true
    }
  )
  const r = {
    isReplace: false
  }
  
  const html = document.childNodes.find(node => node.nodeName === 'html')
  if (html) {
    const body = html.childNodes.find(nd => nd.nodeName === 'body') 
    if (body) {
      const content = parse5.serialize(traverse(body, r))
      return { source: content, isReplace: r.isReplace }
    }
  }
  
}

module.exports = traverseHtml