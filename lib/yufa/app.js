const print = console.log.bind()
const print_j = (item, space = 2) => console.log(JSON.stringify(item, null, space))
const LRBuildUtil = require('./LRBuildUtil.js')
const LRRunUtil = require('./LRRunUtil.js')

// 从词法分析器获得的数据
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

const transTypeTable= {
    "-1": "$",
    "85": "id",
    "39": "*",
    "37": "+"
}

const terminators = ['$', 'id', '+', '*', '(', ')']
const nonTerminators = ['E', 'T', 'F']


// 表达式文法
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

// 表达式文法的语法分析表
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



temp = LRBuildUtil.buildLR0(grammar, terminators, nonTerminators)
print_j(temp)

let itemSet1 = [{
    'left': {
        'val': 'E'
    },
    'right': {
        'val': ['E', '+', 'T'],
        'idx': '1'
    }
}]

let itemSet = [{
    'left': {
        'val': 'E'
    },
    'right': {
        'val': ['E', '+', 'T'],
        'idx': '0'
    }
}]



// temp = LRBuildUtil.itemSetEqual(itemSet, itemSet1)
// print(temp)

// let temp = LRBuildUtil.itemEqual(grammar[1], itemSet[0], false)
// print(temp)


// itemSet = LRBuildUtil.closure(grammar, itemSet)
// print_j(itemSet)

/*
itemSet = [
    {
        'left': {
            'val': 'E'
        },
        'right': {
            'val': ['E', '+', 'T'],
            'idx': '1'
        }
    }
]
temp = LRBuildUtil.goto(grammar, itemSet, '+')
print_j(temp)
*/





/*
let temp = LRRunUtil.LRRun(grammarTable, terminators, nonTerminators, inRes, transTypeTable, grammar)
print(JSON.stringify(temp, null, 2))
*/

/**
 * 输入 grammarTable, terminators, nonTerminators,
 *      inRes, transTypeTable
 *      grammar
 *  输出语法分析结果
 */
/*
LRRunUtil.fillGrammarTable(grammarTable, terminators, nonTerminators)
const moveState = LRRunUtil.getMoveStateFunc(terminators, nonTerminators, grammarTable)
LRRunUtil.transNumToName(inRes, transTypeTable)
const readInput = LRRunUtil.getReadInputFunc(inRes)


let temp = moveState(5, '$')
// print(temp)

temp = readInput()
// print(temp)

let LRRun = LRRunUtil.getLRRunFunc(grammar, moveState, readInput)
temp = LRRun()
print(JSON.stringify(temp, null, 2))
*/
