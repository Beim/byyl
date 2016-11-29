#! /usr/local/bin/node
const fs = require('fs')
const path = require('path')
const print = console.log.bind()
const print_j = (item, space = 2) => console.log(JSON.stringify(item, null, space))

const SOURCE = process.argv[2] || path.resolve(__dirname, './source/source.c')
const DFA3 = fs.readFileSync(path.resolve(__dirname, '../cifa/DFAtable3.json')).toString()
    , source = fs.readFileSync(path.resolve(__dirname, SOURCE)).toString()
    , grammarTable = require('./LRTable.json')
    , transTypeTable = require('./grammar/transTypeTable.js')
const config = require('./grammar/grammar.js')
    , terminators = config.terminators
    , nonTerminators = config.nonTerminators
    , grammar = config.grammar
const lexicalCompile = require('../cifa/lexical.js').lexicalCompile
    , LRRunUtil = require('./util/LRRunUtil.js')
    , optimizer = require('./util/optimizer.js')
    , LRRun = LRRunUtil.LRRun
    , parseEnv = LRRunUtil.parseEnv
    , printCodeStack_3 = LRRunUtil.printCodeStack_3
    , printCodeStack_4 = LRRunUtil.printCodeStack_4
    , optimize = optimizer


const grammarCompile = (DFA, source) => {
    if (!DFA) DFA = DFA3
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
    
    /*
     * 语法分析
     */
    let gramRes = LRRun(grammarTable, terminators, nonTerminators, inRes, transTypeTable, grammar)
    if (gramRes.flag < 0) {
        print(gramRes.errMsg)
    } else {
        let Env = gramRes.s_global.EnvStack[0]
        delete gramRes.s_global
        gramRes.EnvArr = parseEnv(Env)

        for (let env of gramRes.EnvArr) {
            env.code_3_origin = printCodeStack_3(env.codeStack)
            env.code_4_origin = printCodeStack_4(env.codeStack)

            env.codeStack = optimize(env.codeStack, env.top)
            env.code_3 = printCodeStack_3(env.codeStack)
            env.code_4 = printCodeStack_4(env.codeStack)
        }

        /*
        print('\ncode_3_origin: ')
        print_j(gramRes.EnvArr[0].code_3_origin)
        print('\n')
        print('code_3: ')
        print_j(gramRes.EnvArr[0].code_3)
        print()
        */
        if (gramRes.errMsg) 
            print(gramRes.errMsg)

        // fs.writeFileSync(path.resolve(__dirname, './gram.out'), JSON.stringify(gramRes.res, null, 2))
    }

    gramRes.grammarTable = grammarTable
    gramRes.terminators = terminators
    gramRes.nonTerminators = nonTerminators
    return {lexRes, gramRes}
}

grammarCompile(DFA3, source)

module.exports = grammarCompile
