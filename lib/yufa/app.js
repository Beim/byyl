#! /usr/local/bin/node
const fs = require('fs')
const path = require('path')
const print = console.log.bind()
const print_j = (item, space = 2) => console.log(JSON.stringify(item, null, space))

const SOURCE = process.argv[2] || './source.c'
const DFA = fs.readFileSync(path.resolve(__dirname, '../cifa/DFAtable3.json')).toString()
    , source = fs.readFileSync(path.resolve(__dirname, SOURCE)).toString()
    , grammarTable = require('./LRTable.json')
    , transTypeTable = require('./grammar/transTypeTable.js')
const config = require('./grammar/grammar.js')
    , terminators = config.terminators
    , nonTerminators = config.nonTerminators
    , grammar = config.grammar
const lexicalCompile = require('../cifa/lexical.js').lexicalCompile
    , LRRun = require('./util/LRRunUtil.js').LRRun

/*
 * 词法分析
 */

let inRes = lexicalCompile(DFA, source).resArr
inRes = inRes.filter((elem) => {
    return (elem.type !== '1'
        && elem.type !== '2'
        && elem.type !== '94'
        && elem.type !== '95')
})

/*
 * 语法分析
 */
let result = LRRun(grammarTable, terminators, nonTerminators, inRes, transTypeTable, grammar)

if (result.flag < 0) {
    print(result)
} else {
    print_j(result.res)
    if (result.errMsg) 
        print(result.errMsg)
}

