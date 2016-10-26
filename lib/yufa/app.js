const print = console.log.bind()
const util = require('./util.js')
// const fs = require('fs')
// const path = require('path')
// const grammarCompile = require('./grammar.js').grammarCompile

const terminators = ['$', 'id', '+', '*', '(', ')']
const nonTerminators = ['E', 'T', 'F']

const transTypeTable= {
    "-1": "$",
    "85": "id",
    "39": "*",
    "37": "+"
}

let inRes = [
    {
        type: '85',
        buffArr: ['n', 'u', 'm']
    },
    {
        type: '39',
        buffArr: ['*']
    },
    {
        type: '85',
        buffArr: ['n', 'u', 'm']
    },
    {
        type: '37',
        buffArr: ['+']
    },
    {
        type: '85',
        buffArr: ['n', 'u', 'm']
    }
]

const grammar = {
    '1': { 
        'left': {
            'val': 'E'
        },
        'right': {
            'val': ['E', '+', 'T']
        }
    },
    '2': {
        'left': {
            'val': 'E'
        },
        'right': {
            'val': ['T']
        }
    },
    '3': {
        'left': {
            'val': 'T'
        },
        'right': {
            'val': ['T', '*', 'F']
        }
    },
    '4': {
        'left': {
            'val': 'T'
        },
        'right': {
            'val': ['F']
        }
    },
    '5': {
        'left': {
            'val': 'F'
        },
        'right': {
            'val': ['(', 'E', ')']
        }
    },
    '6': {
        'left': {
            'val': 'F'
        },
        'right': {
            'val': ['id']
        }
    }
}

const grammarTable = {
    ACTION: {
        '0': {
            'id': 's5',
            '(': 's4',
        },
        '1': {
            '+': 's6',
            '$': 'acc',
        },
        '2': {
            '+': 'r2',
            '*': 's7',
            ')': 'r2',
            '$': 'r2'
        },
        '3': {
            '+': 'r4',
            '*': 'r4',
            ')': 'r4',
            '$': 'r4'
        },
        '4': {
            'id': 's5',
            '(': 's4',
        },
        '5': {
            '+': 'r6',
            '*': 'r6',
            ')': 'r6',
            '$': 'r6'
        },
        '6': {
            'id': 's5',
            '(': 's4',
        },
        '7': {
            'id': 's5',
            '(': 's4'
        },
        '8': {
            '+': 's6',
            ')': 's11'
        },
        '9': {
            '+': 'r1',
            '*': 's7',
            ')': 'r1',
            '$': 'r1'
        },
        '10': {
            '+': 'r3',
            '*': 'r3',
            ')': 'r3',
            '$': 'r3'
        },
        '11': {
            '+': 'r5',
            '*': 'r5',
            ')': 'r5',
            '$': 'r5'
        }
    },
    GOTO: {
        '0': {
            'E': '1',
            'T': '2',
            'F': '3'
        },
        '1': {

        },
        '2': {
            
        },
        '3': {
            
        },
        '4': {
            'E': '8',
            'T': '2',
            'F': '3'
        },
        '5': {
            
        },
        '6': {
            'T': '9',
            'F': '3',
        },
        '7': {
            'F': '10'
        },
        '8': {
            
        },
        '9': {
            
        },
        '10': {
            
        },
        '11': {
            
        }
    }
}

util.fillGrammarTable(grammarTable, terminators, nonTerminators)
const moveState = util.getMoveStateFunc(terminators, nonTerminators, grammarTable)
util.transNumToName(inRes, transTypeTable)
const readInput = util.getReadInputFunc(inRes)


let temp = moveState(5, '$')
// print(temp)

temp = readInput()
// print(temp)

let LRRun = util.getLRRunFunc(grammar, moveState, readInput)
temp = LRRun()
print(JSON.stringify(temp, null, 4))
