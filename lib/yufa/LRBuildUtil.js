const print = console.log.bind()
const print_j = (item, space = 2) => console.log(JSON.stringify(item, null, space))
const copy = (obj) => JSON.parse(JSON.stringify(obj))

/*
// 项
autoMachine.item = {
    'left': {
        'val': 'E'
    },
    'right': {
        'val': ['E', '+', 'T'],
        'idx': 0
    }
}

// 项集
autoMachine.itemSet = [
    item,
    item,
    item
]

autoMachine.itemFamily = {
    '0': itemSet0,
    '1': itemSet1,
    '2': itemSet2
}
*/

/**
 * 获取表达式文法中左部为val的项
 * @param val String
 * @param grammar Object
 * @return Array
 */
const getLeftItemInGrammar = (val, grammar) => {
    let res = []
    for (let i in grammar) {
        if (grammar[i].left.val === val)
            res.push(copy(grammar[i]))
    }
    return res
}

/*
 * 判断两个项是否相等, 第三个参数设置为false则判断文法是否相等
 * @param item1 Object
 * @param item2 Object
 * @param checkIdx Boolean
 * @return Boolean
 */
const itemEqual = (item1, item2, checkIdx = true, checkNext = true) => {
    if (!item1.left || !item1.right || !item1.right.val)
        return false
    if (!item2.left || !item2.right || !item2.right.val)
        return false
    if (item1.left.val !== item2.left.val) 
        return false
    if (JSON.stringify(item1.right.val) !== JSON.stringify(item2.right.val))
        return false
    if (checkIdx && (parseInt(item1.right.idx) !== parseInt(item2.right.idx)))
        return false
    // if (item1.next && item2.next && item1.next !== item2.next) 
    if (checkNext && item1.next !== item2.next)
        return false
    return true
}

/**
 * 判断item项是否在itemSet项集中
 * @param item Object
 * @param itemSet Array
 * @param checkIdx Boolean
 * @return Boolean
 */
const hasItem = (itemSet, item, checkIdx = true) => {
    for (let i of itemSet) {
        if (itemEqual(item, i, checkIdx))
            return true
    }
    return false
}

/*
 * 判断两个项集是否相同
 * @param itemSet1 Array
 * @param itemSet2 Array
 * @param checkIdx Boolean
 * @return Boolean
 */
const itemSetEqual = (itemSet1, itemSet2, checkIdx = true) => {
    if (itemSet1.length !== itemSet2.length) return false
    for (let item of itemSet1) {
        if (!hasItem(itemSet2, item, checkIdx)) return false
    }
    return true
}

/*
 * 判断itemSet 项集是否在itemFamily 项集族中
 * @param itemFamily Array 项集族
 * @param itemSet Array 项集
 * @param checkIdx Boolean
 * @return Boolean
 */
const hasItemSet = (itemFamily, itemSet, checkIdx = true) => {
    for (let i of itemFamily) {
        if (itemSetEqual(itemSet, i, checkIdx)) 
            return true
    }
    return false
}

/**
 * CLOSURE的计算
 * @param grammar Object 表达式文法
 * @param origin_itemSet Array 项集
 * @return Array 经过计算CLOSURE的项集
 * 不会改变原来itemSet的值
 */
const closure = (grammar, origin_itemSet) => {
    let itemSet = copy(origin_itemSet)
    hasChange = true
    // 在某一轮中没有新的项被加入则停止循环
    while (hasChange) {
        hasChange = false
        // 对itemSet 中每个项 A -> a.Bb
        for (let i in itemSet) {
            let item = itemSet[i]
            // . 的位置
            let idx = item.right.idx
            // . 在最后, 即这是规约项, 则跳过
            if (idx >= item.right.val.length) continue
            let head = item.right.val[idx]
            // grammar 中每个产生式 B -> r
            let procs = getLeftItemInGrammar(head, grammar)
            for (let production of procs) {
                // B -> .r
                production.right.idx = 0
                // B -> .r 是否在itemSet 中
                let proInItemSet = hasItem(itemSet, production)
                if (!proInItemSet) {
                    // 不在则加入到itemSet 中
                    itemSet.push(production)
                    hasChange = true
                }
            }
        }
    }
    return itemSet
}

/**
 * LR1 的CLOSURE 的计算
 * @param grammar Object LR1 表达式文法
 * @param first Object first集
 * @param origin_itemSet Array 项集
 * @return Array 经过计算的CLOSURE 项集
 * 不会改变原来itemSet 的值
 */
const closure_1 = (grammar, first, origin_itemSet) => {
    let itemSet = copy(origin_itemSet)
    let hasChange = true

    while (hasChange) {
        hasChange = false
        // itemSet 中每个项 A -> a.Bb, s
        for (let i in itemSet) {
            let item = itemSet[i]
            // . 的位置
            let idx = parseInt(item.right.idx)
            if (idx >= item.right.val.length) continue
            let head = item.right.val[idx]
            // grammar 中每个产生式 B -> r
            let procs = getLeftItemInGrammar(head, grammar)
            for (let production of procs) {
                production.right.idx = 0
                let termiSymbols = []
                if (idx === (item.right.val.length) - 1) {
                    termiSymbols.push(item.next)
                } else {
                    termiSymbols = first[item.right.val[idx + 1]]
                }
                // first(bs) 中每个终结符k
                for (let termiSymbol of termiSymbols) {
                    let production_copy = copy(production)
                    production_copy.next = termiSymbol
                    // B -> .r, k 是否在itemSet 中
                    let proInItemSet = hasItem(itemSet, production_copy)
                    if (!proInItemSet) {
                        // 不在则加入到itemSet 中
                        itemSet.push(production_copy)
                        hasChange = true
                    }
                }
            }

        }
    }
    return itemSet
}

/**
 * @param grammar Object 表达式文法
 * @param itemSet Array 项集
 * @param symbol String 文法符号
 * @return Array 经过GOTO 计算的项集
 */
const goto = (grammar, itemSet, symbol) => {
    let nextItemSet = []
    for (let item of itemSet) {
        if (item.right.idx < item.right.val.length 
            && item.right.val[item.right.idx] === symbol) {
                let item_copy = copy(item)
                item_copy.right.idx = parseInt(item_copy.right.idx) + 1
                nextItemSet.push(item_copy)
        }
    }
    return closure(grammar, nextItemSet)
}

/**
 * LR1 的GOTO计算
 * @param grammar Object LR1 的表达式文法
 * @param first Object first集
 * @param itemSet Array 项集
 * @param symbol String 文法符号
 * @return Array 经过GOTO 计算的项集
 */
const goto_1 = (grammar, first, itemSet, symbol) => {
    let nextItemSet = []
    for (let item of itemSet) {
        if (item.right.idx < item.right.val.length 
            && item.right.val[item.right.idx] === symbol) {
                let item_copy = copy(item)
                item_copy.right.idx = parseInt(item_copy.right.idx) + 1
                nextItemSet.push(item_copy)
        }
    }
    return closure_1(grammar, first, nextItemSet)
}



/**
 * 找出表达式文法中左部符号为symbol 的项
 * @param grammar Object
 * @param symbol String
 * @return String
 */
const hasLeft = (grammar, symbol) => {
    let res = []
    for (let i in grammar) {
        if (grammar[i].left && grammar[i].left.val === symbol) 
            res.push(copy(grammar[i]))
    }
    return res
}

/**
 * 将arr2中的元素合并到arr1中
 * 若arr1 添加了元素则返回true, 否则返回false
 * @param arr1 Array
 * @param arr2 Array
 * @return hasChange Boolean
 * 会改变arr1 的内容
 */
const combine = (arr1, arr2) => {
    let hasChange = false
    for (let c of arr2) {
        if (!arr1.includes(c)) {
            arr1.push(c)
            hasChange = true
        }
    }
    return hasChange
}

/*
 * 计算first 集合
 * 未考虑 推导出空的情况
 * @param grammar Object
 * @param terminators Array
 * @param nonTerminators Array
 * @return Object
 */
const first = (grammar, terminators, nonTerminators) => {
    let first = {}
    for(let i of terminators) first[i] = [i]
    for (let i of nonTerminators) first[i] = []

    let hasChange = true
    while (hasChange) {
        hasChange = false
        for (let X of nonTerminators) {
            let items = hasLeft(grammar, X)
            for (let item of items) {
                let Y = item.right.val[0]
                let changed = combine(first[X], first[Y])
                if (changed) hasChange = true
            }
        }
    }
    return first
}

const follow = (grammar, first, nonTerminators) => {
    let follow = {}
    for (let i of nonTerminators) follow[i] = []
    let startSymbol = grammar[0].left.val
    follow[startSymbol] = ['$']
    let isNonterminator = (x) => nonTerminators.includes(x)

    let hasChange = true
    while (hasChange) {
        hasChange = false
        for (let i in grammar) {
            let left = grammar[i].left.val
            let right = grammar[i].right.val
            for (let j in right) {
                j = parseInt(j)
                if (isNonterminator(right[j])) {
                    if (j < (right.length - 1)) {
                        let changed = combine(follow[right[j]], first[right[j + 1]])
                        if (changed) hasChange = true
                    } else if (j === (right.length - 1)) {
                        let changed = combine(follow[right[j]], follow[left])
                        if (changed) hasChange = true
                    }
                }
            }
        }
    }
    return follow
}

/**
 * 构造LR0自动机
 * @param grammar Object
 * @param terminators Array
 * @param nonTerminators Array
 * @return Object{Array, Object}
 */
const buildLR0 = (grammar, terminators, nonTerminators, firstOne = 0) => {
    // 所有的文法符号
    let symbols = terminators.concat(nonTerminators)
    // 开始的文法表达式对应的项
    let firstItem = copy(grammar[firstOne])
    if (!firstItem) return {flag: -1, msg: `Can't find the first item`}
    firstItem.right.idx = '0'
    // 项集族
    let itemFamily = [ closure(grammar, [firstItem]) ]

    let hasChange = true
    while (hasChange) {
        hasChange = false
        for (let i in itemFamily) {
            for (let symbol of symbols) {
                let nextItemSet = goto(grammar, itemFamily[i], symbol)
                if (nextItemSet && nextItemSet.length > 0
                    && !hasItemSet(itemFamily, nextItemSet)) {
                        itemFamily.push(nextItemSet)
                        hasChange = true
                }
            }
        }
    }

    // 计算goto
    let gotos = {}
    for (let i in itemFamily) {
        for (let symbol of symbols) {
            let nextItemSet = goto(grammar, itemFamily[i], symbol)
            for (let j in itemFamily) {
                if (itemSetEqual(itemFamily[j], nextItemSet)) {
                    if (!gotos[i]) gotos[i] = {}
                    gotos[i][symbol] = j
                    break
                }
            }
        }
    }
    return {itemFamily, gotos}
}

/**
 * 构造LR1 自动机
 * @param grammar Object
 * @param terminators Array
 * @param nonTerminators Array
 * @return Object{Array, Object}
 */
const buildLR1 = (grammar, terminators, nonTerminators, firstOne = 0) => {
    // first 集
    let FIRST = first(grammar, terminators, nonTerminators)
    // 所有的文法符号
    let symbols = terminators.concat(nonTerminators)
    // 开始的文法表达式对应的项
    let firstItem = copy(grammar[firstOne])
    if (!firstItem) return {flag: -1, msg: `Can't find the first item`}
    firstItem.right.idx = '0'
    firstItem.next = '$'
    // 项集族
    let itemFamily = [ closure_1(grammar, FIRST, [firstItem]) ]

    let hasChange = true
    while (hasChange) {
        hasChange = false
        for (let i in itemFamily) {
            for (let symbol of symbols) {
                let nextItemSet = goto_1(grammar, FIRST, itemFamily[i], symbol)
                if (nextItemSet && nextItemSet.length > 0 ) {

                    if (!hasItemSet(itemFamily, nextItemSet)) {
                        itemFamily.push(nextItemSet)
                        hasChange = true
                    }
                }
            }
        }
    }

    // 计算goto
    let gotos = {}
    for (let i in itemFamily) {
        for (let symbol of symbols) {
            let nextItemSet = goto_1(grammar, FIRST, itemFamily[i], symbol)
            for (let j in itemFamily) {
                if (itemSetEqual(itemFamily[j], nextItemSet)) {
                    if (!gotos[i]) gotos[i] = {}
                    gotos[i][symbol] = j
                    break
                }
            }
        }
    }
    return {itemFamily, gotos}
    
}

/*
 * @param itemFamily Array
 * @return res String
 */
const displayLR1ItemFamily = (itemFamily) => {
    let res = ''
    for (let i in itemFamily) {
        let set = itemFamily[i]
        res += `I${i}: \n`
        for (let item of set) {
            res += `${item.left.val} -> ${item.right.val.join('')} , ${item.right.idx} , ${item.next}\n`
        }
        res += '\n'
    }
    return res
}

/*
 * 筛选出和symbol 相关的移入项和规约项
 * @param itemSet Array 项集
 * @param symbol String 终结符
 * @return Object{Array, Array}
 */
const filter = (itemSet, symbol) => {
    // 移入项
    let type1 = []
    // 规约项
    let type2 = []
    for (let item of itemSet) {
        let idx = parseInt(item.right.idx)
        // A -> p. , a
        if (idx === item.right.val.length){
            if (item.next === symbol) {
                type2.push(item)
            }
        // A -> p.aq , b  
        } else if (idx < item.right.val.length) {
            if (item.right.val[idx] === symbol) {
                type1.push(item)
            }
        }
    }
    return {type1, type2}
}

const buildLRTable_1 = (itemFamily, gotos, grammar, terminators, nonTerminators) => {
    let accItem = copy(itemFamily[0][0])
    accItem.right.idx = accItem.right.val.length
    let ACTION = {}
        , GOTO = {}
    for (let i in itemFamily) {
        ACTION[i] = {}
        GOTO[i] = {}
    }
    for (let i in itemFamily) {
        let itemSet = itemFamily[i]
        for (let terminator of terminators) {
            let time = 0
            let {type1, type2} = filter(itemSet, terminator)
            if (type1.length > 0) {
                if (gotos[i] && (gotos[i][terminator] !== undefined)) {
                    ACTION[i][terminator] = 's' + gotos[i][terminator]
                    time++
                }
            }
            if (type2.length > 0) {
                if (type2[0].left.val !== accItem.left.val) {
                    let seq = -1
                    for (let j in grammar) {
                        if (itemEqual(grammar[j], type2[0], false, false)) {
                            seq = j
                        }
                    }
                    if (seq > 0) {
                        ACTION[i][terminator] = 'r' + seq
                        time++
                    }
                }
            }
            if (hasItem(itemSet, accItem)) {
                ACTION[i]['$'] = 'acc'
                /*
                if (terminator === '$' && time > 1)
                    time++
                */
            }
            if (time > 1) return {flag: -1, msg: `conflict! ACTION[${i}][${terminator}]`}
        }

        for (let nonTerminator of nonTerminators) {
            if (gotos[i] && (gotos[i][nonTerminator] !== undefined)) {
                GOTO[i][nonTerminator] = gotos[i][nonTerminator]
            }
        }
    }
    return {
        flag: 1,
        ACTION,
        GOTO
    }
}


module.exports = {
    getLeftItemInGrammar,
    itemEqual,
    hasItem,
    itemSetEqual,
    hasItemSet,
    closure,
    closure_1,
    goto,
    goto_1,
    hasLeft,
    combine,
    first,
    follow,
    buildLR0,
    buildLR1,
    displayLR1ItemFamily,
    filter,
    buildLRTable_1,
}
