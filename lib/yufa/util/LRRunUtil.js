const print = console.log.bind()
const fs = require('fs')
const path = require('path')


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


/**
 * fill blank with 'err'
 * @param table Object
 * @param _terminators Array
 * @param nonTerminators Array
 * @return table Object
 */
const fillGrammarTable = (table, terminators, nonTerminators) => {
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



/**
 * 根据语法分析表, 返回动作与下一个状态
 * flag 1 参数无误
 * flag -1 参数错误
 * type 1 移入 ACTION
 * type 2 规约 ACTION
 * type 3 规约 GOTO
 * type -1 错误
 * type 0 接受
 * @param terminators Array
 * @param nonTerminators Array
 * @param grammarTable Object
 * @return Function
 *      @param state Number
 *      @param symbol String
 *      @return Object
 */
const getMoveStateFunc = (terminators, nonTerminators, grammarTable) => {
    return (state, symbol) => {
        let func
        if (terminators.includes(symbol)) func = grammarTable.ACTION
        else if (nonTerminators.includes(symbol)) func = grammarTable.GOTO
        else return {flag: -1, msg: `symbol error : ${symbol}, ${state}`}
        if (func[state] && func[state][symbol]) {
            let action = func[state][symbol]
            if (action[0] === 's') { // 移入 ACTION
                let nextState = action.slice(1)
                return {
                    flag: 1,
                    type: 1,
                    state: nextState
                }
            } else if (action[0] === 'r') { // 规约 ACTION
                let nextState = action.slice(1)
                return {
                    flag: 1,
                    type: 2,
                    state: nextState
                }
            } else if (action[0] === 'e') { // error
                return {
                    flag: 1,
                    type: -1
                }
            } else if (action[0] === 'a') { // acc
                return {
                    flag: 1,
                    type: 0
                }
            } else if (parseInt(action) !== NaN) {
                return {
                    flag: 1,
                    type: 3,
                    state: action
                }
            } else {
                return {flag: -1, msg: `grammarTable error : ${symbol}, ${state}`}
            }

        } else {
            return {flag: -1, msg: `state or symbol error : ${symbol}, ${state}`}
        }
    }
}

/**
 * 如 : 将type 85 改为 typeName id
 * @param inRes Array
 * @param transTypeTable Object
 * @return inRes Array
 * 会改变inRes的值
 */
const transNumToName = (inRes, transTypeTable) => {
    inRes.push({
        type: '-1',
        buffArr: ['$']
    })
    for (let i in inRes) {
        let name = transTypeTable[inRes[i].type]
        if (!name) return false
        inRes[i].typeName = name
        inRes[i].lexical = inRes[i].buffArr.join('')
        inRes[i].index = i
        inRes[i].isTerminator = 1
        delete inRes[i].buffArr
    }
    return inRes
}

/**
 * @param inRes Array
 * @return Function
 *      @param length Number
 *      @return String
 */
const getReadInputFunc = (inRes, index = 0) => {
    return (length = 0) => {
        if (length > 0) {
            if ((index + length) > inRes.length) 
                return false
            else {
                let res = inRes.slice(index, index + length)
                index += length
                return res
            }
        } else {
            return inRes[index]
        }
    }
}

/**
 * 运行LR语法分析器, 输出结果
 * @param grammar Object 表达式文法
 * @param moveState Function
 * @param readInput Function
 * @return Function
 *      @return Object
 */
const getLRRunFunc = (grammar, moveState, readInput) => {
    return () => {
        // 状态栈
        let stack = [0]
        // 符号栈
        let symbols = []
        // let result = []
        // 保存错误信息
        let errMsg = ''
        let errArr = []
        let acc = false
        while (!acc) {
            let currState = stack[stack.length - 1]
            let symbol = readInput()
            // 读入到末尾
            if (!symbol) break;
            let nextInfo = moveState(currState, symbol.typeName)
            if (nextInfo.flag === 1) {
                if (nextInfo.type === 1) { // 移入 ACTION
                    // 读出符号
                    readInput(1)
                    // 状态入栈
                    stack.push(parseInt(nextInfo.state))
                    // 终结符号入栈
                    symbols.push(symbol)
                } else if (nextInfo.type === 2) { // 规约 ACTION
                    // 获取表达式
                    let g = grammar[nextInfo.state]
                    if (g) {
                        // 需要出栈的长度, 即表达式右部符号数
                        let outLength = g.right.val.length
                        // 将outLength个状态出栈
                        stack = stack.slice(0, -outLength)
                        // 取得符号栈中,outLength 个符号
                        let subSymbol = symbols.slice(-outLength)
                        // 将outLength 个状态出符号栈
                        symbols = symbols.slice(0, -outLength)
                        // stack = stack.slice(0, -(g.right.val.length))
                        // 获取表达式左部
                        let val = g.left.val
                        // 栈顶状态
                        currState = stack[stack.length - 1]
                        // 获得规约信息
                        nextInfo = moveState(currState, val)
                        if (nextInfo.flag === 1) {
                            // GOTO
                            if (nextInfo.type === 3) {
                                stack.push(parseInt(nextInfo.state))
                                symbols.push({
                                    typeName: val,
                                    next: subSymbol,
                                    line: subSymbol[0].line,
                                    isTerminator: 0
                                })
                                // 保存规约结果
                                // result.push(g)
                            } else {
                                return {flag: -1, msg: `Error at line:[${symbol.line}]; type: ${symbol.typeName}; lexical: ${symbol.lexical}; goto error\n`}
                            }
                        } else {
                            return {flag: -1, msg: `Error at line:[${symbol.line}]; type: ${symbol.typeName}; lexical: ${symbol.lexical}; moveState error\n`}
                        }
                    } else {
                        return {flag: -1, msg: `Error at line:[${symbol.line}]; type: ${symbol.typeName}; lexical: ${symbol.lexical}; get grammar error\n`}
                    }
                } else if (nextInfo.type === 0) { // ACK
                    acc = true
                } else if (nextInfo.type === -1) { // 错误状态
                    // return {flag: -1, msg: `error state, currState: ${currState}, symbol: ${JSON.stringify(symbol)}, nextInfo: ${JSON.stringify(nextInfo)}`}
                    errMsg += `Error at line:[${symbol.line}]; type: ${symbol.typeName}; lexical: ${symbol.lexical}; ERROR STATE\n`
                    errArr.push({
                        line: symbol.line,
                        type: symbol.typeName,
                        lexical: symbol.lexical,
                        begin: symbol.begin,
                        end: symbol.end
                    })
                    readInput(1)
                }
            } else {
                return {flag: -1, msg: ' moveState error'}
            }
        }
        if (symbols.length === 1) {
            return {flag: 1, res: symbols[0], errMsg, errArr}
        } else {
            return {flag: -1, msg: 'symbols.length !== 1, maybe grammar error', errMsg, errArr}
        }
    }
}

/**
 * LR语法分析
 * @param grammarTable Object 表达式文法的语法分析表
 * @param terminators Array 终结符号
 * @param nonTerminators Array 非终结符号
 * @param inRes Array 从词法分析器获得的数据
 * @param transTypeTable Object 词法分析器的状态码与语法分析器的终结符号的对应
 * @param grammar Object 表达式文法
 * @return Object 语法分析结果
 */
const LRRun = (grammarTable, terminators, nonTerminators, inRes, transTypeTable, grammar) => {
    fillGrammarTable(grammarTable, terminators, nonTerminators)
    const moveState = getMoveStateFunc(terminators, nonTerminators, grammarTable)
    transNumToName(inRes, transTypeTable)
    const readInput = getReadInputFunc(inRes)
    return getLRRunFunc(grammar, moveState, readInput)()
}

module.exports = {
    read,
    fillGrammarTable,
    getMoveStateFunc,
    transNumToName,
    getReadInputFunc,
    getLRRunFunc,
    LRRun
}

