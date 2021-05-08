const path = require('path')
const fs = require('fs')
const glob = require('glob')
const inquirer = require("inquirer")

const {
  transformVue,
  transformJs
} = require('./core/transform')
const {
  info,
  error: errorLog
} = require('./utils/log')

const { replaceStr } = require('./utils')

const DEFAULT_CONFIG_PATH = path.resolve(process.cwd(), './auto-i18n.config.js')
const config_exists = fs.existsSync(DEFAULT_CONFIG_PATH)
const config = config_exists ? require(DEFAULT_CONFIG_PATH) : {}
const locales = {}


function getDirectoryFiles(directory) {
  let p = path.resolve(directory, '**' ,`*.{${config.extName.join(',')}}`)
  return glob.sync(p, {
    ignore: config.exclude || []
  })
}

function loadLocalesInfo() {
  const LANG_DIR = path.join(process.cwd(), './locales')
  let files = fs.readdirSync(LANG_DIR)
  if (!files.length) {
    throw new Error('没有语言包')
  }
  return inquirer.prompt([
    {
      type: 'list',
      message: '请选择语言文件',
      name: 'lang_file',
      choices: [
        ...files
      ]
    },
  ]).then(results => {
    try {
      console.log(LANG_DIR + '/' + results.lang_file)
      const _locales = require( LANG_DIR + '/' + results.lang_file)
      Object.assign(locales, _locales)
    } catch (error) {
      errorLog(error)
    }
  })
}

function promptDirectory() {
  function checkFileExits(filepath) {
    return fs.existsSync(filepath)
  }
  return inquirer.prompt([
    {
      type: "input",
      name: "file_path",
      message: "请输入要替换字符的 文件/文件夹 路径",
      filter(input) {
        return replaceStr( input.trim() )
      },
      validate(filepath) {
        return checkFileExits(filepath) ? true : "路径不存在"
      }
    }
  ])
}
function isDirectory(filepath) {
  const stat = fs.statSync(filepath)
  return stat.isDirectory()
}
async function run() {
  const {
    entry,
    output
  } = config

  await loadLocalesInfo()
  const directory_result = await promptDirectory()
  const file_path = directory_result.file_path
  
  const files = isDirectory(file_path) ? getDirectoryFiles(file_path) : [file_path]

  for (const file of files) {
    const extname = path.extname(file)
    const dirname = path.dirname(file)
    const filename = path.basename(file)
    const content = fs.readFileSync(file, {
      encoding: 'utf-8'
    })
    let code, isChange = false
    if (extname === '.vue') {
      const { source, isReplace } = transformVue(content, locales)
      code = source
      isChange = isReplace
    } else if (extname === '.js') {
      const { source, isReplace } = transformJs(content, locales)
      code = source
      isChange = isReplace
      if (isReplace) {
        code = prettier.format(code, {
          parser: 'babel',
          singleQuote: true,
          semi: false,
        })
      }
    }

    if (!isChange) {
      info('文件 ' + file + ' 无需翻译、跳过')
      continue
    }

    const new_file_name = 'new_' + filename
    const new_file_path = path.resolve(dirname, new_file_name)
    info('翻译生成文件路径:' + new_file_path)
    fs.writeFileSync(new_file_path, code)
    info('请检查生成文件是否正确')
    const prompt = await inquirer.prompt([
      {
        type: 'confirm',
        message: '是否进行文件替换',
        name: 'pass'
      }
    ])
    if (prompt.pass) {
      fs.unlinkSync(file)
      fs.renameSync(new_file_path, path.resolve(dirname, filename))
    } else {
      fs.unlinkSync(new_file_path)
    }
  }
}

run()