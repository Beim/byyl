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
 * 运行LR语法分析器, 输出结果, 未考虑推导出空的情况
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
 * 运行LR语法分析器, 输出结果, 考虑推导出空的情况
 * @param grammar Object 表达式文法
 * @param moveState Function
 * @param readInput Function
 * @return Function
 *      @return Object
 */
const getLRRunFunc_nil = (grammar, moveState, readInput) => {
    return () => {
        // 状态栈
        let stack = [0]
        // 符号栈
        let symbols = []
        // 翻译过程的全局对象
        let s_global = {}
        // let result = []
        // 保存错误信息
        let errMsg = ''
        let errArr = []
        let acc = false
        while (!acc) {
            let ifNil = false
            let currState = stack[stack.length - 1]
            /*
             * 先以nil测试, 再以下一个符号测试
             *
            let symbol = {
                type: '-2',
                typeName: 'nil',
                lexical: 'nil',
                isTerminator: 1
            }
            // 每次都先读入nil
            let nextInfo = moveState(currState , symbol.typeName)
            let isNilOk = (nextInfo.flag > 0 && nextInfo.type >= 0)
            if (isNilOk) {
                ifNil = true
            } else {
                symbol = readInput()
                // 读入到末尾
                if (!symbol) break;
                nextInfo = moveState(currState, symbol.typeName)
            }
            */

            /*
             * 先以下一个符号测试, 再以nil测试
             */
            let symbol = readInput()
            if (!symbol) {
                print('break!!! symbol not exist, LRRunUtil')
                break;
            }
            let line = symbol.line
            let nextInfo = moveState(currState, symbol.typeName)
            let isSymOk = (nextInfo.flag > 0 && nextInfo.type >= 0)
            if (!isSymOk) {
                symbol = {
                    type: '-2',
                    typeName: 'nil',
                    lexical: 'nil',
                    line,
                    isTerminator: 1
                }
                nextInfo = moveState(currState, symbol.typeName)
                ifNil = true

            }
            /**/

            if (nextInfo.flag === 1) {
                if (nextInfo.type === 1) { // 移入 ACTION
                    // 读出符号
                    if (!ifNil)
                        readInput(1)
                    // 状态入栈
                    stack.push(parseInt(nextInfo.state))
                    // 终结符号入栈
                    symbols.push(symbol)
                } else if (nextInfo.type === 2) { // 规约 ACTION
                    // 获取表达式
                    let g = grammar[nextInfo.state]
                    if (g) {
                        // 动作返回的属性
                        let inh = {}
                        // 规约时执行的动作
                        if (g.act) 
                            inh = g.act(s_global, stack, symbols) || {}
                        // flag 为-1则不执行默认的规约动作
                        if (inh.flag === -1) {
                            continue
                        // 发生错误, 添加错误信息, 不执行默认的规约动作
                        } else if (inh.flag === -2) { 
                            let sbl = inh.symbol || symbol
                            if (sbl.lexical !== undefined) {
                                errMsg += `Error at line: [${sbl.line}]; type: ${sbl.typeName}; lexical: ${sbl.lexical}; ${inh.err}\n`
                                errArr.push(`Error at line: [${sbl.line}]; type: ${sbl.typeName}; lexical: ${sbl.lexical}; ${inh.err}`)
                            } else {
                                errMsg += `Error at line: [${sbl.line}]; type: ${sbl.typeName}; ${inh.err}\n`
                                errArr.push(`Error at line: [${sbl.line}]; type: ${sbl.typeName}; ${inh.err}`)
                            }
                            continue
                        }
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
                                let n = {
                                    typeName: val,
                                    next: subSymbol,
                                    line: subSymbol[0].line,
                                    isTerminator: 0
                                }
                                Object.assign(n, inh)
                                symbols.push(n)
                                /*
                                symbols.push({
                                    typeName: val,
                                    next: subSymbol,
                                    line: subSymbol[0].line,
                                    isTerminator: 0
                                })
                                */
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
                    let symbol = readInput()
                    // return {flag: -1, msg: `error state, currState: ${currState}, symbol: ${JSON.stringify(symbol)}, nextInfo: ${JSON.stringify(nextInfo)}`}
                    errMsg += `Error at line:[${symbol.line}]; type: ${symbol.typeName}; lexical: ${symbol.lexical}; ERROR STATE\n`
                    errArr.push(`Error at line:[${symbol.line}]; type: ${symbol.typeName}; lexical: ${symbol.lexical}; ERROR STATE\n`)
                    /*
                    errArr.push({
                        line: symbol.line,
                        type: symbol.typeName,
                        lexical: symbol.lexical,
                        begin: symbol.begin,
                        end: symbol.end
                    })
                    */
                    readInput(1)
                }
            } else {
                return {flag: -1, msg: ` moveState error, type: ${symbol.typeName}, lexical: ${symbol.lexical}`}
            }
        }
        if (symbols.length === 1) {
            return {flag: 1, res: symbols[0], errMsg, errArr, s_global}
        } else {
            return {flag: -1, msg: 'symbols.length !== 1, maybe grammar error', errMsg, errArr, symbols}
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
    return getLRRunFunc_nil(grammar, moveState, readInput)()
}

const makeEnv = ({name, returnType, top, offset, codeStack, flist, prev, next}) => {
    let nextArr = []
    for (let i of next) nextArr.push(i.name)
    return {name, returnType, top, offset, codeStack, flist, prev: prev ? prev.name : null, next: nextArr}
}

const parseEnv = (Env) => {
    let res = [makeEnv(Env)]
    for (let env of Env.next) {
        res = res.concat(parseEnv(env))
    }
    return res
}

const printCodeStack_3 = (codeStack) => {
    let resArr = []
    const push = (str) => resArr.push(str)
    for (let i in codeStack) {
        let item = codeStack[i]
        let {result, arg1, arg2, op} = item
        // 有两个arg
        if (arg2 !== undefined) {
            // 类型转换
            if (op === '=()') {
                // x = (float) y
                push(`${i}:  ${result.id} = (${arg1}) ${arg2.id}`)
            } else if (op === 'call') {
                // temp = call f, 1
                push(`${i}:  ${result.id} = call ${arg1}, ${arg2}`)

            } else {
                // x = y + z
                push(`${i}:  ${result.id} = ${arg1.id} ${op} ${arg2.id}`)
            }
        // 没有arg2
        } else {
            if (op === '=') {
                // x = y
                push(`${i}:  ${result.id} ${op} ${arg1.id}`)
            } else if (op === '[]=') {
                // {
                //  op: '[]=',
                //  arg1: E.addr,
                //  result: {
                //      base: L.array,
                //      offset: L.addr
                //  }
                // }
                let {base, offset} = result
                // x[i] = y
                push(`${i}:  ${base.id}[${offset.id}] = ${arg1.id}`)

            } else if (op === '=[]') {
                let {base, offset} = arg1
                // x = y[i]
                push(`${i}:  ${result.id} = ${base.id}[${offset.id}]`)

            } else if (op === '++=') {
                // x = ++y
                push(`${i}:  ${result.id} = ++${arg1.id}`)

            } else if (op === '--=') {
                // x = --y
                push(`${i}:  ${result.id} = --${arg1.id}`)

            } else if (op === '=++') {
                // x = y++
                push(`${i}:  ${result.id} = ${arg1.id}++`)

            } else if (op === '=--') {
                // x = y--
                push(`${i}:  ${result.id} = ${arg1.id}--`)

            } else if (op === 'goto') {
                // goto 101
                push(`${i}:  goto ${result.id}`)

            } else if (op === 'ifgoto') {
                // if a < b goto 101
                push(`${i}:  if ${arg1.left.id} ${arg1.op.id} ${arg1.right.id} goto ${result.id}`)

            } else if (op === 'return') {
                // return x;
                push(`${i}:  return ${result.id}`)

            } else if (op === 'param') {
                // param 1
                push(`${i}:  param ${result.id}`)

            } else {
                // x = - b
                push(`${i}:  ${result.id} = ${op} ${arg1.id}`)
            }
            
        }
    }
    return resArr
}

module.exports = {
    read,
    fillGrammarTable,
    getMoveStateFunc,
    transNumToName,
    getReadInputFunc,
    getLRRunFunc,
    getLRRunFunc_nil,
    LRRun,
    parseEnv,
    printCodeStack_3
}

