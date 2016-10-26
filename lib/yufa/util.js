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
        inRes[i].buffStr = inRes[i].buffArr.join('')
        inRes[i].index = i
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
 *      @return result Array
 */
const getLRRunFunc = (grammar, moveState, readInput) => {
    return () => {
        let stack = [0]
        let result = []
        let acc = false
        while (!acc) {
            let currState = stack[stack.length - 1]
            let symbol = readInput()
            let nextInfo = moveState(currState, symbol.typeName)
            if (nextInfo.flag === 1) {
                if (nextInfo.type === 1) { // 移入 ACTION
                    readInput(1)
                    stack.push(parseInt(nextInfo.state))
                } else if (nextInfo.type === 2) { // 规约 ACTION
                    // 获取表达式
                    let g = grammar[nextInfo.state]
                    if (g) {
                        // 将表达式右部长度的状态出栈
                        stack = stack.slice(0, -(g.right.val.length))
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
                                // 保存规约结果
                                result.push(g)
                            } else {
                                return {flag: -1, msg: 'goto error'}
                            }
                        } else {
                            return {flag: -1, msg: 'moveState error'}
                        }
                    } else {
                        return {flag: -1, msg: `get grammar error`}
                    }
                } else if (nextInfo.type === 0) { // ACK
                    acc = true
                } else if (nextInfo.type === -1) { // 错误状态
                    return {flag: -1, msg: `error state`}
                }
            } else {
                return {flag: -1, msg: ' moveState error'}
            }
        }
        return result
    }
}

module.exports = {
    read,
    fillGrammarTable,
    getMoveStateFunc,
    transNumToName,
    getReadInputFunc,
    getLRRunFunc
}

