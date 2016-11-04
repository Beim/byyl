const fs = require('fs')
const path = require('path')
const print_j = (e) => console.log(JSON.stringify(e, null, 4))
const acts = require('./acts.js')

const getGrammar = (grammarMd) => {
    let grammar = {}
    
    // 去掉空行
    grammarMd = grammarMd.toString().split('\n').filter(e => e)
    
    let grammarObj = {}
        , terminatorsObj = {}
        , nonTerminatorsObj = {}
        , terminators = ['$']
        , nonTerminators = []
    
    grammarMd.forEach((value, index) => {
        value = value.trim()
        if (value && value[0] !== '#') {
            value = value.split(' -> ')
            let left = {val: value[0].trim()}
            let right = {val: value[1].split(' ').filter(e => e)}
            let act = null
            if (value[2]) act = acts(value[2].trim())
            // 保存所有的非终结符到对象中
            nonTerminatorsObj[left.val] = 1
            // 存入所有的非终结符和终结符 到对象中
            right.val.forEach((v) => {terminatorsObj[v] = 1})
            // 保存文法
            grammarObj[index] = {left, right, act}
        }
    })
    
    // 将非终结符存入数组中
    for (let i in nonTerminatorsObj) 
        nonTerminators.push(i)
    
    // 将终结符存入数组中
    for (let i in terminatorsObj)
        if (!nonTerminatorsObj[i])
            terminators.push(i)
    
    grammar.terminators = terminators
    grammar.nonTerminators = nonTerminators
    grammar.grammar = grammarObj

    return grammar
}

module.exports = getGrammar

/*
 * grammar的格式如下
 *
let grammar = {
    terminators: [
        '$',
        'proc', 'id', ';', 'integer', 'real', '[', 'num', ']', 'record',
        '=', '+', '-', '*', '/', '(', ')', '++', '--',
        'if', '{', '}', 'else', 'while', 'void', 'return', 'do',
        'or', 'and', 'not', 'true', 'false',
        '<', '<=', '==', '!=', '>', '>=',
        'call', ',',
        '@',
    ],

    nonTerminators: [
        'Px', 'P', 'Sa', 'Pa',
        'Da', 'D', 'T', 'X', 'C', 'IDlist', 'Df', 'DFlist',
        'S', 'E', 'Ea', 'R', 'Ra', 'Y', 'L',
        'B', 'Ba', 'N', 'Na', 'M', 'V', 'relop',
        'Elist', 'F'
    ],

    grammar: {
        '0': {
            'left': {'val': 'Px'},
            'right': {'val': ['P']}
        },
        '1': {
            'left': {'val': 'P'},
            'right': {'val': ['Da']}
        },
    }
}
*/
