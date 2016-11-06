#! /usr/local/bin/node
const fs = require('fs')
const path = require('path')
const print = console.log.bind()
const print_j = (item, space = 2) => console.log(JSON.stringify(item, null, space))

const SOURCE = process.argv[2] || path.resolve(__dirname, './source/3source.c')
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

const grammarCompile = (DFA, source) => {
    /*
     * 词法分析
     */
    let lexRes = lexicalCompile(DFA, source)
    let inRes = JSON.parse(JSON.stringify(lexRes.resArr))
    inRes = inRes.filter((elem) => {
        return (elem.type !== '1'
            && elem.type !== '2'
            && elem.type !== '94'
            && elem.type !== '95')
    })
    print_j(inRes)
    
    /*
     * 语法分析
     */
    let gramRes = LRRun(grammarTable, terminators, nonTerminators, inRes, transTypeTable, grammar)
    if (gramRes.flag < 0) {
        print(gramRes)
    } else {
        print_j(gramRes.res)
        fs.writeFileSync(path.resolve(__dirname, './gram.out'), JSON.stringify(gramRes.res, null, 2))
        if (gramRes.errMsg) 
            print(gramRes.errMsg)
    }
    gramRes.grammarTable = grammarTable
    gramRes.terminators = terminators
    gramRes.nonTerminators = nonTerminators
    return {lexRes, gramRes}
}

// grammarCompile(DFA, source)

module.exports = grammarCompile
