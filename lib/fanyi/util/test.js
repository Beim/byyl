const test = require('ava')
const print = console.log.bind()
const print_j = (item, space = 2) => console.log(JSON.stringify(item, null, space))
const copy = (obj) => JSON.parse(JSON.stringify(obj))
const LRBuildUtil = require('./LRBuildUtil.js')
const LRRunUtil = require('./LRRunUtil.js')
const getGrammar = require('../grammar/grammarUtil.js')

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
    '0': {  
        'left': {
            'val': 'Ex'
        },
        'right': {
            'val': ['E']
        }
    },
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

const _itemSet1 = [{
    'left': {
        'val': 'E'
    },
    'right': {
        'val': ['E', '+', 'T'],
        'idx': '1'
    }
}]

const _itemSet2 = [{
    'left': {
        'val': 'E'
    },
    'right': {
        'val': ['E', '+', 'T'],
        'idx': '0'
    }
}]


const grammar1 = {
    '0': {
        'left': {'val': 'Sx'},
        'right': {'val': ['S']}
    },
    '1': {
        'left': {'val': 'S'},
        'right': {'val': ['C', 'C']}
    },
    '2': {
        'left': {'val': 'C'},
        'right': {'val': ['c', 'C']}
    },
    '3': {
        'left': {'val': 'C'},
        'right': {'val': ['d']}
    }
}
const terminators1 = ['$', 'c', 'd']
const nonTerminators1 = ['Sx', 'S', 'C']


test('LRRun with nil', (t) => {
    let grammarMd = `
    Lx -> L
    L -> E
    E -> E + T
    E -> T
    T -> T * F
    T -> F
    F -> ( E )
    F -> digit
    `
    /*
    let grammarMd = `
        Sx -> S
        S -> while ( M C ) N S1 -> t_S
        M -> nil -> t_M
        N -> nil -> t_N
    `
    */
    let {grammar, terminators, nonTerminators} = getGrammar(grammarMd)
    let {itemFamily, gotos} = LRBuildUtil.buildLR1_nil(grammar, terminators, nonTerminators)
    let grammarTable = LRBuildUtil.buildLRTable_1(itemFamily, gotos, grammar, terminators, nonTerminators)
    t.is(grammarTable.flag, 1)
    print(grammarTable)
    let inRes = [
        {
            'typeName': 'digit',
            'lexical': 3,
            'isTerminator': 1
        },
        {
            'typeName': '*',
            'lexical': '*',
            'isTerminator': 1
        },
        {
            'typeName': 'digit',
            'lexical': 5,
            'isTerminator': 1
        },
        {
            'typeName': '+',
            'lexical': '+',
            'isTerminator': 1
        },
        {
            'typeName': 'digit',
            'lexical': 4,
            'isTerminator': 1
        },
        {
            'typeName': '$',
            'lexical': '$',
            'isTerminator': 1
        }
    ]
    /*
    let inRes = [
        {
            'typeName': 'while',
            'lexical': 'while',
            'isTerminator': 1
        },
        {
            'typeName': '(',
            'lexical': '(',
            'isTerminator': 1
        },
        {
            'typeName': 'C',
            'lexical': 'C',
            'isTerminator': 1
        },
        {
            'typeName': ')',
            'lexical': ')',
            'isTerminator': 1
        },
        {
            'typeName': 'S1',
            'lexical': 'S1',
            'isTerminator': 1
        },
        {
            'typeName': '$',
            'lexical': '$',
            'isTerminator': 1
        }
    ]
    */
    const moveState = LRRunUtil.getMoveStateFunc(terminators, nonTerminators, grammarTable)
    const readInput = LRRunUtil.getReadInputFunc(inRes)
    const LRRun = LRRunUtil.getLRRunFunc_nil(grammar, moveState, readInput)
    let res = LRRun()
    print_j(res)
    t.is(res.flag, 1)
})

test('buildLRTable_1 with nil', (t) => {
    let grammarMd = `
        Sx -> S
        S -> while ( M C ) N S1
        M -> nil
        N -> nil
    `
    let {grammar, terminators, nonTerminators} = getGrammar(grammarMd)
    let {itemFamily, gotos} = LRBuildUtil.buildLR1_nil(grammar, terminators, nonTerminators)
    let res = LRBuildUtil.buildLRTable_1(itemFamily, gotos, grammar, terminators, nonTerminators)
    t.is(res.flag , 1)
})

test('buildLR1_nil with nil', (t) => {
    let grammarMd = `
        Sx -> S
        S -> while ( M C ) N S1
        M -> nil
        N -> nil
    `
    let {grammar, terminators, nonTerminators} = getGrammar(grammarMd)
    let {itemFamily, gotos} = LRBuildUtil.buildLR1_nil(grammar, terminators, nonTerminators)
    let res = LRBuildUtil.displayLR1ItemFamily(itemFamily)
    t.is(itemFamily.length, 11)
})

test('closure_1_nil, just set true', (t) => {
    let grammarMd = `
        Sx -> S
        S -> while ( M C ) N S
        M -> nil
        N -> nil
    `
    let {grammar, terminators, nonTerminators} = getGrammar(grammarMd)
    let first = LRBuildUtil.first_nil(grammar, terminators, nonTerminators)
    let origin_itemSet = [{
        'left': {'val': 'S'},
        'right': {'val': ['while', '(', 'M', 'C', ')', 'N', 'S'], 'idx': '2'},
        'next': '$'
    }]
    let itemSet = LRBuildUtil.closure_1_nil(grammar, first, origin_itemSet)
    t.is(itemSet.length, 2)
})

test('first_nil', (t) => {
    let grammarMd = `
        Sx -> S B C
        S -> nil
        S -> num
        B -> id
        B -> nil
        C -> ah
    `
    let {grammar, terminators, nonTerminators} = getGrammar(grammarMd)
    let first = LRBuildUtil.first_nil(grammar, terminators, nonTerminators)
    t.true(first['Sx'].includes('id'))
    t.true(first['Sx'].includes('ah'))
})

test('item_first', (t) => {
    let grammarMd = `
        Sx -> S B C
        S -> nil
        S -> num
        B -> id
        B -> nil
        C -> ah
    `
    let {grammar, terminators, nonTerminators} = getGrammar(grammarMd)
    let first = LRBuildUtil.first_nil(grammar, terminators, nonTerminators)
    let itemFirst = LRBuildUtil.item_first(first)

    let res1 = itemFirst(['B', 'C'])
    let res2 = itemFirst(['C', 'B'])
    let res3 = itemFirst(['S', 'B'])
    let res4 = itemFirst(['S', 'B', 'ah', 'aaa'])
    // res1 should be [id, ah]
    t.is(res1.length, 2)
    // res2 should be [ah]
    t.is(res2.length, 1)
    // res3 should be [id, num, nil]
    t.is(res3.length, 3)
    // res4 should be [id, num, ah]
    t.is(res4.length, 3)
})

test('follow_nil', (t) => {
    let grammarMd = `
        Sx -> S B C
        S -> nil
        S -> num
        B -> id
        B -> nil
        C -> ah
    `
    let {grammar, terminators, nonTerminators} = getGrammar(grammarMd)
    let first = LRBuildUtil.first_nil(grammar, terminators, nonTerminators)
    let follow = LRBuildUtil.follow_nil(grammar, first, nonTerminators)
    // follow['S'] should be [id, ah]
    t.true(follow['S'].includes('id'))
    t.true(follow['S'].includes('ah'))
})

test('getLeftItemInGrammar', (t) => {
    let val = 'F'
    let res = LRBuildUtil.getLeftItemInGrammar(val, grammar)
    t.is(res.length, 2)
})

test('itemEqual', (t) => {
    let itemEqual = LRBuildUtil.itemEqual
    let item1 = copy(grammar[1])
    let item2 = copy(grammar[1])
    item1.right.idx = 0
    item2.right.idx = 0
    t.true(itemEqual(item1, item2))
    item2.right.idx = 1
    t.false(itemEqual(item1, item2))

    item1 = {
        'left': {'val': '1'}
    }
    t.false(itemEqual(item1, item2))
    item1 = {
        'right': {'val': '1'}
    }
    t.false(itemEqual(item2, item1))

    item1 = {
        'left': {'val': 'C'},
        'right': {'val': 'd', 'idx': 0},
        'next': 'd'
    }
    item2 = copy(item1)
    t.true(itemEqual(item1, item2))
    item2.next = 's'
    t.false(itemEqual(item1, item2))
    
})

test('hasItem', (t) => {
    let hasItem = LRBuildUtil.hasItem
    let item = copy(grammar[1])
    item.right.idx = 1
    t.true(hasItem(_itemSet1, item))
    t.false(hasItem(_itemSet2, item))


    item.next = '+'
    t.false(hasItem(_itemSet1, item))
    let itemSet = copy([item])
    t.true(hasItem(itemSet, item))
})

test('itemSetEqual', (t) => {
    let itemSetEqual = LRBuildUtil.itemSetEqual
    t.true(itemSetEqual(_itemSet1, _itemSet1))
    t.false(itemSetEqual(_itemSet1, _itemSet2))
})

test('hasItemSet', (t) => {
    let hasItemSet = LRBuildUtil.hasItemSet
    let itemFamily = [_itemSet1, _itemSet2]
    t.true(hasItemSet(itemFamily, _itemSet1))
    t.true(hasItemSet(itemFamily, _itemSet2))
    let _itemSet3 = copy(_itemSet1)
    _itemSet3[0].right.idx = 3
    t.false(hasItemSet(itemFamily, _itemSet3))
})

test('closure', (t) => {
    let itemSet = LRBuildUtil.closure(grammar, _itemSet2)
    t.is(itemSet.length, 6)

    itemSet = LRBuildUtil.closure(grammar, _itemSet1)
    t.is(itemSet.length, 1)

    itemSet = [copy(grammar[0])]
    itemSet[0].right.idx = 0
    itemSet = LRBuildUtil.closure(grammar, itemSet)
    t.is(itemSet.length, 7)
})

test('closure_1', (t) => {
    let closure_1 = LRBuildUtil.closure_1
        , first 
        , item
        , itemSet

    first = LRBuildUtil.first(grammar1, terminators1, nonTerminators1)
    item = {
        'left': {'val': 'Sx'},
        'right': {'val': ['S'], 'idx': '0'},
        'next': '$'
    }
    itemSet = LRBuildUtil.closure_1(grammar1, first, [item])
    t.is(itemSet.length, 6)
})

test('goto', (t) => {
    let goto = LRBuildUtil.goto
        , itemSet
        , res
    itemSet = copy(_itemSet1)
    res = goto(grammar, itemSet, '+')
    t.is(res.length, 5)
})

test('goto_1', (t) => {
    let goto_1 = LRBuildUtil.goto_1
        , first = LRBuildUtil.first(grammar1, terminators1, nonTerminators1)
        , itemSet
        , item
        , res
    item = {
        'left': {'val': 'Sx'},
        'right': {'val': ['S'], 'idx': '0'},
        'next': '$'
    }
    itemSet = LRBuildUtil.closure_1(grammar1, first, [item])
    res = goto_1(grammar1, first, itemSet, 'c')
    t.is(res.length, 6)
})

test('combine', (t) => {
    let combine = LRBuildUtil.combine
        , arr1 = [1, 2, 3]
        , arr2 = [4, 5]
        , res
    res = combine(arr1, arr2)
    t.true(res)
    t.is(arr1[3], 4)

    res = combine(arr1, arr1)
    t.false(res)
})

test('hasLeft', (t) => {
    let hasLeft = LRBuildUtil.hasLeft
        , res = 1

    res = hasLeft(grammar, 'Ex')
    t.is(res[0].right.val[0], 'E')
})

test('first', (t) => {
    let first = LRBuildUtil.first
        , res = 1

    res = first(grammar, terminators, nonTerminators)
    t.is(res.E.length, 2)
})

test('follow', (t) => {
    let follow = LRBuildUtil.follow
        , first = LRBuildUtil.first
        , firstObj
        , res
    firstObj = first(grammar, terminators, nonTerminators)
    res = follow(grammar, firstObj, nonTerminators)
    t.is(res['F'].length, 4)
})


test('buildLR0', (t) => {
    let buildLR0 = LRBuildUtil.buildLR0
    
    let {itemFamily, gotos} = buildLR0(grammar, terminators, nonTerminators)
    t.is(itemFamily.length, 12)
    let obj = {'id': '1', '(': '2', 'F': '11'}
    for (let i in obj) {
        t.is(gotos[8][i], obj[i])
    }
})

test('buildLR1', (t) => {
    let buildLR1 = LRBuildUtil.buildLR1
        , displayLR1ItemFamily = LRBuildUtil.displayLR1ItemFamily

    let {itemFamily, gotos} = buildLR1(grammar1, terminators1, nonTerminators1)
    t.is(itemFamily.length, 10)
    let obj = {'c': '6', 'd': '7', 'C': '9'}
    for (let i in obj) {
        t.is(gotos[6][i], obj[i])
    }
    let res = displayLR1ItemFamily(itemFamily)
    // print(res)
    // print_j(itemFamily[2])
    // print(gotos)
})

test('filter', (t) => {
    let buildLR1 = LRBuildUtil.buildLR1
        , filter = LRBuildUtil.filter
    
    let {itemFamily, gotos} = buildLR1(grammar1, terminators1, nonTerminators1)
    let itemSet = itemFamily[1]
    let res = filter(itemSet, 'd')
    t.is(res.type1.length, 2)
    t.is(res.type2.length, 0)

    itemSet = itemFamily[2]
    res = filter(itemSet, 'd')
    t.is(res.type1.length, 0)
    t.is(res.type2.length, 1)
})

test('buildLRTable_1', (t) => {
    let buildLRTable_1 = LRBuildUtil.buildLRTable_1
        , buildLR1 = LRBuildUtil.buildLR1
    
    let {itemFamily, gotos} = buildLR1(grammar1, terminators1, nonTerminators1)
    let res = buildLRTable_1(itemFamily, gotos, grammar1, terminators1, nonTerminators1)
    t.is(res.flag, 1)
    let obj = {
        'c': 's1',
        'd': 's2'
    }
    for (let i in obj) {
        t.is(res.ACTION[0][i], obj[i])
    }
    obj = {
        'S': '3',
        'C': '4'
    }
    for (let i in obj) {
        t.is(res.GOTO[0][i], obj[i])
    }
    /*
    if (res.flag > 0) {
        print(res.ACTION)
        print(res.GOTO)
    } else {
        print(res.msg)
    }
    */
})

test('RUN!!!', (t) => {
    let buildLRTable_1 = LRBuildUtil.buildLRTable_1
        , buildLR1 = LRBuildUtil.buildLR1

    let {itemFamily, gotos} = buildLR1(grammar, terminators, nonTerminators)
    let res = buildLRTable_1(itemFamily, gotos, grammar, terminators, nonTerminators)
    let grammarTable = {
        ACTION: res.ACTION,
        GOTO: res.GOTO
    }
    
    let result = LRRunUtil.LRRun(grammarTable, terminators, nonTerminators, inRes, transTypeTable, grammar)
    t.is(result.flag, 1)
})
