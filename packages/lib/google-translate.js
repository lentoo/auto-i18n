const googleTranslate = require("google-translate-open-api").default;
const { parseMultiple } = require("google-translate-open-api");

module.exports = function translateByGoogle(text, to) {
  const options = {
    tld: "cn",
    to,
    client: "dict-chrome-ex",
  };
  if (Array.isArray(text)) {
    console.log(text);
    return googleTranslate(text, options).then((res) => {
      return { data: parseMultiple(res.data[0]) };
    });
  }
  return googleTranslate(text, options);
};
