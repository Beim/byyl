const fs = require('fs')
const path = require('path')
const getGrammar = require('./grammarUtil.js')

let grammarMd = fs.readFileSync(path.resolve(__dirname, './grammar.md'))
module.exports = getGrammar(grammarMd)
