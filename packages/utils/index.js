const os = require('os')
let isWin = os.platform() === 'win32'


const untranslatedText = []
function setUntranslatedText(text) {
  untranslatedText.push(text)
}
function getUntranslatedText() {
  return untranslatedText
}

function replaceStr (string) {
  var temp = "";
  string = '' + string;
  string = string.replace(/[\'\"]/g, '')
  if (isWin) {
    splitstring = string.split("\\")
    for(i = 0; i < splitstring.length; i++) {
      temp += splitstring[i]
      if (i < splitstring.length - 1) {
         temp += '//';
      }
    }
  } else {
    splitstring = string.split("\\")
    for(i = 0; i < splitstring.length; i++) {
      temp += splitstring[i]
    }
  }
  return temp;
}

module.exports = {
  setUntranslatedText,
  getUntranslatedText,
  replaceStr
}