#! /usr/local/bin/node
const fs = require('fs')
const path = require('path')
const print = console.log.bind()
const print_j = (item, space = 2) => console.log(JSON.stringify(item, null, space))
const read = (path) => fs.readFileSync(path)

const LRBuildUtil = require(path.resolve(__dirname, './util/LRBuildUtil.js'))
const buildLR1 = LRBuildUtil.buildLR1 // 构建LR1 文法的自动机的函数
    , buildLRTable_1 = LRBuildUtil.buildLRTable_1 // 构建LR1 文法的状态表的函数


const config = require(path.resolve(__dirname, './grammar/grammar.js'))
    // 终结符
    , terminators = config.terminators
    // 非终结符
    , nonTerminators = config.nonTerminators
    // 表达式文法
    , grammar = config.grammar

/*
 * 构建LR1 文法自动机
 */

let time0 = new Date()

let {itemFamily, gotos} = buildLR1(grammar, terminators, nonTerminators)

/*
 * 构建LR1 文法状态表
 */
let time1 = new Date()

let res = buildLRTable_1(itemFamily, gotos, grammar, terminators, nonTerminators)

let time2 = new Date()

if (res.flag > 0) {
    // print(res)
    print(`build automachine cost : ${Math.floor((time1 - time0) / 1000)}s`)
    print(`build table cost : ${Math.floor((time2 - time1) / 1000)}s`)
    fs.writeFileSync(path.resolve(__dirname, './LRTable.json'), JSON.stringify(res, null, 4))
} else {
    print(res.msg)
}
