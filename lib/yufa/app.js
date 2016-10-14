const print = console.log.bind()
const fs = require('fs')
const path = require('path')
const grammarCompile = require('./grammar.js').grammarCompile
const read = (path) => {
    return new Promise((res, rej) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                console.log(err)
                rej(err)
            } else {
                res(data.toString())
            }
        })
    })
}

const terminators = ['id', '+', '*', '(', ')']
const nonTerminators = ['E', 'T', 'F']

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

/**
 * fill blank with 'err'
 * @param table Object
 * @param _terminators Array
 * @param nonTerminators Array
 * @return table Object
 */
const fillGrammarTable = (table, _terminators, nonTerminators) => {
    let terminators = _terminators.concat(['$'])
    for (let i in table.ACTION) {
        for (let j of terminators) {
            if (!table.ACTION[i][j]) {
                table.ACTION[i][j] = 'err'
            }
        }
    }
    for (let i in table.GOTO) {
        for (let j of nonTerminators) {
            if (!table.GOTO[i][j]) {
                table.GOTO[i][j] = 'err'
            }
        }
    }
    return table
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

fillGrammarTable(grammarTable, terminators, nonTerminators)
print(grammarTable)
print(terminators)
