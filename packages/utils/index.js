const os = require("os");
let isWin = os.platform() === "win32";

let untranslatedText = [];
function setUntranslatedText(text) {
  untranslatedText.push(text);
}
function getUntranslatedText() {
  return untranslatedText;
}
function rmUntranslatedText(text) {
  untranslatedText = untranslatedText.filter((t) => t !== text);
}

function replaceStr(string) {
  var temp = "";
  string = "" + string;
  string = string.replace(/[\'\"]/g, "");
  if (isWin) {
    splitstring = string.split("\\");
    for (i = 0; i < splitstring.length; i++) {
      temp += splitstring[i];
      if (i < splitstring.length - 1) {
        temp += "//";
      }
    }
  } else {
    splitstring = string.split("\\");
    for (i = 0; i < splitstring.length; i++) {
      temp += splitstring[i];
    }
  }
  return temp;
}

function reconvert(str) {
  str = str.replace(/(\\u)(\w{1,4})/gi, function ($0) {
    return String.fromCharCode(
      parseInt(escape($0).replace(/(%5Cu)(\w{1,4})/g, "$2"), 16)
    );
  });
  str = str.replace(/(&#x)(\w{1,4});/gi, function ($0) {
    return String.fromCharCode(
      parseInt(escape($0).replace(/(%26%23x)(\w{1,4})(%3B)/g, "$2"), 16)
    );
  });
  str = str.replace(/(&#)(\d{1,6});/gi, function ($0) {
    return String.fromCharCode(
      parseInt(escape($0).replace(/(%26%23)(\d{1,6})(%3B)/g, "$2"))
    );
  });
  return str;
}
module.exports = {
  setUntranslatedText,
  getUntranslatedText,
  replaceStr,
  reconvert,
};
