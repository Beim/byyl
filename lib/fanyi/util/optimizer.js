const LRRunUtil = require('./LRRunUtil.js')
const print = console.log.bind()
const print_j = (obj, num = 2) => console.log(JSON.stringify(obj, null, num))
const copy = (obj) => JSON.parse(JSON.stringify(obj))


/*
 * 利用ifFalse减少goto的数量
 * @param codeStack Array
 * @return codeStack Array
 * 会改变原来的codeStack
 */
const reduceIfGoto = (codeStack) => {
    let minusGoto = (idx) => {
        for (let item of codeStack) {
            let ops = ['ifgoto', 'ifFalse', 'goto']
            if (item && ops.includes(item.op) && item.result.id > idx) {
                if (item.result.minus) {
                    item.result.minus += 1
                } else {
                    item.result.minus = 1
                }
            }
        }
    }
    let delArr = []
    for (let index in codeStack) {
        index = parseInt(index)
        let item = codeStack[index]
        if (item.op === 'ifgoto') {
            let nextItem = codeStack[index + 1]
            // ifFalse
            if (item.result.id === index + 2) {
                delArr.push(index + 1)
                item.op = 'ifFalse'
                item.result.id = nextItem.result.id
            // if
            } else if (nextItem.result.id === index + 2) {
                delArr.push(index + 1)
            }
        }
    }

    for (let i of delArr) {
        minusGoto(i)
        delete codeStack[i]
    }
    for (let item of codeStack) {
        let ops = ['ifgoto', 'ifFalse', 'goto']
        if (item && ops.includes(item.op) && item.result.minus) 
            item.result.id -= item.result.minus
    }

    return codeStack.filter(e => e)
}

/*
 * 将地址指令划分成若干个基本块，
 * 带有基本块的开始和结束的指令的位置，
 * 带有符号表的拷贝
 * @param codeStack Array
 * @param top Array
 * @return blocks Array
 */
const devide = (codeStack, top) => {
    let leaders = {0: true}
    let gotos = ['ifgoto', 'ifFalse', 'goto']
    for (let i in codeStack) {
        i = parseInt(i)
        let item  = codeStack[i]
        if (gotos.includes(item.op)) {
            leaders[i + 1] = true
            leaders[item.result.id] = true
        }
        /*
        if (item.op === 'call') {
            leaders[i + 1] = true
        }
        */
    }


    let blocks = []
    let leadersArr = []
    for (let i in leaders) leadersArr.push(i)
    for (let i in leadersArr) {
        i = parseInt(i)
        let start = leadersArr[i]
        let end = i < leadersArr.length - 1 ? leadersArr[i + 1] : codeStack.length
        blocks.push({
            codes: codeStack.slice(start, end),
            start: parseInt(start),
            end: parseInt(end) - 1,
            next: [],
            prev: [],
            ctop: copy(top)
        })
    }
    return blocks
}

/*
 * 利用基本块构建流图
 * @param blocks Array
 * @return blocks Array
 * 会改变原来的blocks
 */
const linkup = (blocks) => {
    let gotos = ['ifgoto', 'ifFalse', 'goto']
    for (let i = 0; i < blocks.length - 1; i++) {
        if (!blocks[i].next.includes(i + 1))
            blocks[i].next.push(i + 1)
        if (!blocks[i + 1].prev.includes(i))
            blocks[i + 1].prev.push(i)
        let codes = blocks[i].codes
        if (gotos.includes(codes[codes.length - 1].op)) {
            let startIdx = parseInt(codes[codes.length - 1].result.id)
            for (let j in blocks) {
                j = parseInt(j)
                if (blocks[j].start === startIdx) {
                    if (!blocks[i].next.includes(j))
                        blocks[i].next.push(j)
                    if (!blocks[j].prev.includes(i))
                        blocks[j].prev.push(i)
                    break
                }
            }
        }
    }
    return blocks
}

/*
 * 给基本块中的语句附加活跃性和后序使用信息
 * @param blocks Array
 * @return blocks Array
 */
const attachActiveInfo = (blocks) => {
    for (let block of blocks) {
        for (let sym of block.ctop) {
            if (sym.isTemp) {
                sym.active = false
            }
            else {
                sym.active = true
            }
            sym.subUse = -1
        }
    }

    const getFromTop_no_bind = (top, id) => {
        for (let item of top) {
            if (id === item.id)
                return item
        }
    }

    for (let block of blocks) {
        let ctop = block.ctop
        let getFromTop = getFromTop_no_bind.bind(null, ctop)
        let codes = block.codes

        for (let i = codes.length - 1; i >= 0; i--) {
            let code = codes[i]
            let {result, arg1, arg2, op} = code
            let x, y, z = null
            // 有两个arg
            // x = y op z
            if (arg2 !== undefined) {
                if (op === '=()') {
                    x = getFromTop(result.id)
                    y = getFromTop(arg2.id)
                }
                else if (op === 'call') {
                    x = getFromTop(result.id) 
                }
                else {
                    x = getFromTop(result.id)
                    y = getFromTop(arg1.id)
                    z = getFromTop(arg2.id)
                }
            }
            // 一个arg
            // x = op y
            else {
                if (op === '=') {
                    x = getFromTop(result.id)
                }
                else if (op === '[]=') {
                    let {base, offset} = result
                    x = getFromTop(base.id)
                    y = getFromTop(offset.id)
                    z = getFromTop(arg1.id)
                }
                else if (op === '=[]') {
                    let {base, offset} = arg1
                    x = getFromTop(result.id)
                    y = getFromTop(base.id)
                    z = getFromTop(offset.id)
                }
                else if (op === '++=' || op === '--=' || op === '=++' || op === '=--') {
                    x = getFromTop(result.id)
                    y = getFromTop(arg1.id)
                }
                else if (op === 'goto' || op === 'ifgoto' || op === 'ifFalse' || op === 'return' || op === 'param') {
                    
                }
                else {
                    x = getFromTop(result.id)
                    y = getFromTop(arg1.id)
                }
            }
            if (x) {
                x.active = false
                x.subUse = -1
            }
            if (y) {
                y.active = true
                let idx = i + parseInt(block.start)
                y.subUse = idx
            }
            if (z) {
                z.active = true
                let idx = i + parseInt(block.start)
                z.subUse = idx
            }
        }
    }
    /*
    for (let block of blocks) {
        print(block)
        for (let i of block.ctop) {
            if (i.active) {
                print(`${i.id} is active`)
            }
            else {
                print(`${i.id} not active`)
            }
        }
    }
    */
    return blocks
}

const buildDAG = (block) => {
    // 存储dag条目
    // <resArr, op, arg1Idx, arg2Idx>
    let DagArr = []
    // 逆序获取dag中resArr包含sym的条目的idx
    // 如果没有则新建
    const getDagIdx = (sym) => {
        // 寻找
        for (let idx = DagArr.length - 1; idx >= 0; idx--) {
            item = DagArr[idx]
            let found = false
            for (let s of item.resArr) {
                if (s.id === sym.id) {
                    found = true
                    break
                }
            }
            if (found) {
                return idx
            }
        }
        // 未找到， 则创建
        DagArr.push({
            resArr: [sym],
            op: 0,
            arg1Idx: -1,
            arg2Idx: -1,
            arg3Idx: -1,
            arg4Idx: -1
        })
        return DagArr.length - 1
    }
    // <op, arg1Idx, arg2Idx>
    let vcArr = []
    // 从vcArr中寻找op,arg1Idx, arg2Idx都相等的项
    // 返回对应的idx
    // 未找到则返回undefined
    const getVcIdx = (op, arg1Idx, arg2Idx, arg3Idx, arg4Idx) => {
        // print(op, arg1Idx, arg2Idx)
        // print(vcArr)
        for (let vc of vcArr) {
            let found = vc.op === op && vc.arg1Idx === arg1Idx
            if (arg2Idx !== undefined)
                found = found && vc.arg2Idx === arg2Idx
            if (arg3Idx !== undefined) 
                found = found && vc.arg3Idx === arg3Idx
            if (arg4Idx !== undefined)
                found = found && vc.arg4Idx === arg4Idx
            // let found = vc.op === op && vc.arg1Idx === arg1Idx && vc.arg2Idx === arg2Idx && vc.arg3Idx === arg3Idx
            if (found) {
                if (vc.killed) 
                    return undefined
                else 
                    return vc.idx
            }
        }
    }
    let originIdxs = {}
    const setOriginIdxs = (originIdx, idx) => {
        // originIdxs[originIdx] = idx
        if (!originIdxs[idx])
            originIdxs[idx] = [originIdx]
        else 
            originIdxs[idx].push(originIdx)
    }
    // 将result加入到idx对应的dag中的resArr中
    // 如果resArr中有与result.id相同的项， 则不加入
    const pushResToDag = (idx, result) => {
        let resArr = DagArr[idx].resArr
        let hasSame = false
        for (let s of resArr) {
            if (result.id === s.id) {
                hasSame = true
                break
            }
        }
        if (!hasSame) {
            resArr.push(result)
        }
        
    }
    const killArrUsed = (arrIdx) => {
        for (let vc of vcArr) {
            let found = vc.op === '=[]' && vc.arg1Idx === arrIdx
            if (found) {
                vc.killed = true
            }
        }
    }
    for (let [cidx, code] of block.codes.entries()) {
        // originIdx 为原来codeStack中的位置
        let originIdx = cidx + block.start
        let {result, arg1, arg2, op} = code
        // 有两个arg
        if (arg2 !== undefined) {
            // x = (float) y
            if (op === '=()') {
                let arg1Idx = getDagIdx({id: arg1})
                let arg2Idx = getDagIdx(arg2)
                let vcIdx = getVcIdx(op, arg1Idx, arg2Idx)
                if (vcIdx === undefined) {
                    DagArr.push({
                        resArr: [result],
                        op, arg1Idx, arg2Idx
                    })
                    vcArr.push({
                        idx: DagArr.length - 1,
                        op, arg1Idx, arg2Idx
                    })
                    setOriginIdxs(originIdx, DagArr.length - 1)
                }
                else {
                    pushResToDag(vcIdx, result)
                    setOriginIdxs(originIdx, vcIdx)
                }

            }
            else if (op === 'call') {
                let arg1Idx = getDagIdx({id: arg1})
                let arg2Idx = getDagIdx({id: arg2})
                DagArr.push({
                    resArr: [result],
                    op, arg1Idx, arg2Idx
                })
                vcArr.push({
                    idx: DagArr.length - 1,
                    op, arg1Idx, arg2Idx
                })
                setOriginIdxs(originIdx, DagArr.length - 1)
            }
            // x = y + z
            else {
                let arg1Idx = arg1 ? getDagIdx(arg1) : -1
                let arg2Idx = arg2 ? getDagIdx(arg2) : -1
                /*
                print(arg1Idx, arg2Idx)
                print(DagArr[arg1Idx])
                */

                let arg1Obj = DagArr[arg1Idx].resArr[0]
                let arg2Obj = DagArr[arg2Idx].resArr[0]
                let sameConst = !isNaN(arg1Obj.id) && !isNaN(arg2Obj.id)
                sameConst = sameConst && arg1Obj.type.name === arg2Obj.type.name
                if (sameConst) {
                    let arg3Obj = copy(arg1Obj)
                    let value1 = parseFloat(arg1Obj.id)
                    let value2 = parseFloat(arg2Obj.id)
                    let noZeroErr = true
                    if (op === '+') {
                        arg3Obj.id = value1 + value2 + ''
                    }
                    else if (op === '-') {
                        arg3Obj.id = value1 - value2 + ''
                    }
                    else if (op === '*') {
                        arg3Obj.id = value1 * value2 + ''
                    }
                    else if (op === '/') {
                        if (value2 != 0) {
                            arg3Obj.id = value1 / value2 + ''
                        }
                        else {
                            noZeroErr = false
                        }
                    }
                    if (noZeroErr) {
                        let arg3Idx = getDagIdx(arg3Obj)
                        pushResToDag(arg3Idx, result)
                        setOriginIdxs(originIdx, arg3Idx)
                    }
                    // print(arg3Obj)
                }
                else {
                    let vcIdx = getVcIdx(op, arg1Idx, arg2Idx)
                    // 满足交换律
                    if (vcIdx === undefined && ['+', '*'].includes(op)) 
                        vcIdx = getVcIdx(op, arg2Idx, arg2Idx)
                    // 不存在已经计算过的节点
                    if (vcIdx === undefined) {
                        DagArr.push({
                            resArr: [result],
                            op, arg1Idx, arg2Idx
                        })
                        vcArr.push({
                            idx: DagArr.length - 1,
                            op, arg1Idx, arg2Idx
                        })
                        setOriginIdxs(originIdx, DagArr.length - 1)
                    }
                    // 存在已经计算过的节点
                    else {
                        pushResToDag(vcIdx, result)
                        setOriginIdxs(originIdx, vcIdx)
                    }
                }

            }
        }
        // 一个arg
        else {
            if (op === '=') {
                let arg1Idx = arg1 ? getDagIdx(arg1) : -1
                // let arg2Idx = arg2 ? getDagIdx(arg2) : -1
                pushResToDag(arg1Idx, result)
                setOriginIdxs(originIdx, arg1Idx)
            }
            // x[i] = y
            else if (op === '[]=') {
                let {base, offset} = result
                // x
                let arg1Idx = getDagIdx(base)
                // i
                let arg2Idx = getDagIdx(offset)
                // y
                let arg3Idx = getDagIdx(arg1)
                let vcIdx = getVcIdx(op, arg1Idx, arg2Idx, arg3Idx)
                // 不存在已经计算过的节点
                if (vcIdx === undefined) {
                    DagArr.push({
                        resArr: [],
                        op, arg1Idx, arg2Idx, arg3Idx
                    })
                    vcArr.push({
                        idx: DagArr.length - 1,
                        op, arg1Idx, arg2Idx, arg3Idx
                    })
                    setOriginIdxs(originIdx, DagArr.length - 1)
                }
                // 存在已经计算过的节点
                else {
                    
                }
                // 杀死对数组x的使用的节点
                killArrUsed(arg1Idx)
            }
            // x = y[i]
            else if (op === '=[]') {
                let {base, offset} = arg1
                let arg1Idx = getDagIdx(base)
                let arg2Idx = getDagIdx(offset)
                let vcIdx = getVcIdx(op, arg1Idx, arg2Idx)
                if (vcIdx === undefined) {
                    DagArr.push({
                        resArr: [result],
                        op, arg1Idx, arg2Idx
                    })
                    vcArr.push({
                        idx: DagArr.length - 1,
                        op, arg1Idx, arg2Idx,
                        killed: false
                    })
                    setOriginIdxs(originIdx, DagArr.length - 1)
                }
                else {
                    pushResToDag(vcIdx, result)
                    setOriginIdxs(originIdx, arg1Idx)
                }

                
            }
            else if (op === 'goto') {
                let arg1Idx = getDagIdx(result)
                DagArr.push({
                    resArr: [],
                    op, arg1Idx
                })
                setOriginIdxs(originIdx, DagArr.length - 1)
            }
            else if (op === 'ifFalse' || op === 'ifgoto') {
                let arg1Idx = getDagIdx(arg1.left)
                let arg2Idx = getDagIdx(arg1.op)
                let arg3Idx = getDagIdx(arg1.right)
                let arg4Idx = getDagIdx(result)
                DagArr.push({
                    resArr: [],
                    op, arg1Idx, arg2Idx, arg3Idx, arg4Idx
                })
                setOriginIdxs(originIdx, DagArr.length - 1)
            }
            else if (op === 'return') {
                let arg1Idx = getDagIdx(result)
                DagArr.push({
                    resArr: [],
                    op, arg1Idx
                })
                setOriginIdxs(originIdx, DagArr.length - 1)
            }
            else if (op === 'param') {
               let arg1Idx = getDagIdx(result) 
                DagArr.push({
                    resArr: [],
                    op, arg1Idx
                })
                setOriginIdxs(originIdx, DagArr.length - 1)

            }
            else if (op === 'exit') {
                DagArr.push({
                    op: 'exit'
                })
                setOriginIdxs(originIdx, DagArr.length - 1)
            }
            // x = - b
            else {
                
            }
            
        }
    }
    block.DagArr = DagArr
    block.vcArr = vcArr
    block.originIdxs = originIdxs
    // print(DagArr)
    // for (let item of DagArr) {
    //     print(item)
    // }
    // print('-------\n')
    // print(vcArr)
    // print('-------\n')
    return block
}

const buildDAGs = (blocks) => {
    return blocks.map((block) => buildDAG(block))
}

const rebuildCodeFromDag = (block) => {
    /*
    print(block.DagArr)
    print('-----------\n\n')
    */
    let DagArr = block.DagArr
    let originIdxs = block.originIdxs
    let ncodes = []
    const gen = (result, op, arg1, arg2, originIdxArr) => {
        ncodes.push({
            result, op, arg1, arg2, originIdxArr
        })
    }
    const genCopy = (resArr, originIdxArr) => {
        for (let [idx, result] of resArr.entries()) {
            if (idx === 0) continue
            if (result.isTemp) continue
            gen(result, '=', resArr[0], undefined, originIdxArr)
        }
    }
    for (let [dIdx, item] of DagArr.entries()) {
        let {resArr, op, arg1Idx, arg2Idx, arg3Idx, arg4Idx} = item
        let originIdxArr = originIdxs[dIdx] || []
        // a0
        if (op === 0) {
            if (resArr.length > 0) {
                genCopy(resArr, originIdxArr)
            }
        }
        else {
            // 有两个arg
            if (arg2Idx >= 0) {
                if (op === '=()') {
                    let arg1 = DagArr[arg1Idx].resArr[0].id
                    let arg2 = DagArr[arg2Idx].resArr[0]
                    gen(resArr[0], op, arg1, arg2, originIdxArr)
                    genCopy(resArr, originIdxArr)
                }
                else if (op === 'call') {
                    let arg1 = DagArr[arg1Idx].resArr[0].id
                    let arg2 = DagArr[arg2Idx].resArr[0].id
                    gen(resArr[0], op, arg1, arg2, originIdxArr)
                }
                // base: arg1Idx, offset: arg2Idx, arg1: arg3Idx
                // x[i] = y
                else if (op === '[]=') {
                    let base = DagArr[arg1Idx].resArr[0]
                    let offset = DagArr[arg2Idx].resArr[0]
                    let arg1 = DagArr[arg3Idx].resArr[0]
                    gen({base, offset}, op, arg1, undefined, originIdxArr)

                }
                // result: resArr[0], base: arg1Idx, offset: arg2Idx
                // x = y[i]
                else if (op === '=[]') {
                    let base = DagArr[arg1Idx].resArr[0]
                    let offset = DagArr[arg2Idx].resArr[0]
                    gen(resArr[0], op, {base, offset}, undefined, originIdxArr)
                    genCopy(resArr, originIdxArr)
                }
                else if (op === 'ifFalse' || op === 'ifgoto') {
                    // print('lalalala\n\n')
                    let left = DagArr[arg1Idx].resArr[0]
                    let iop = DagArr[arg2Idx].resArr[0]
                    let right = DagArr[arg3Idx].resArr[0]
                    let result = DagArr[arg4Idx].resArr[0]
                    gen(result, op, {left, op: iop, right}, undefined, originIdxArr)
                }
                // x = y + z
                else {
                    let arg1 = DagArr[arg1Idx].resArr[0]
                    let arg2 = DagArr[arg2Idx].resArr[0]
                    // gen(op, arg1, arg2, resArr[0])
                    gen(resArr[0], op, arg1, arg2, originIdxArr)
                    genCopy(resArr, originIdxArr)
                }
            }
            // 一个arg
            else {
                if (op === '=') {
                    /*
                    pushResToDag(arg1Idx, result)
                    setOriginIdxs(originIdx, arg1Idx)
                    */
                }
                else if (op === 'goto') {
                    let result = DagArr[arg1Idx].resArr[0]
                    gen(result, op, undefined, undefined, originIdxArr)
                }
                else if (op === 'return') {
                    let result = DagArr[arg1Idx].resArr[0]
                    gen(result, op, undefined, undefined, originIdxArr)
                }
                else if (op === 'param') {
                    let result = DagArr[arg1Idx].resArr[0]
                    gen(result, op, undefined, undefined, originIdxArr)
                }
                else if (op === 'exit') {
                    gen(undefined, op, undefined, undefined, originIdxArr)
                }
                // x = - b
                else {
                    
                }
            }
        }
    }
    block.ncodes = ncodes
    return block
}

const rebuildCodeFromDags = (blocks) => {
    return blocks.map(block => rebuildCodeFromDag(block))
}

const reviseGoto = (codeStack) => {
    const transOriginToCurr = (originIdx) => {
        for (let [idx, code] of codeStack.entries()) {
            if (code.originIdxArr.includes(originIdx)) {
                return idx
            }
        }
        return -1
    }

    for (let [idx, code] of codeStack.entries()) {
        let gotos = ['ifgoto', 'ifFalse', 'goto']
        if (gotos.includes(code.op)) {
            let originIdx = code.result.id
            let currIdx = transOriginToCurr(originIdx)
            if (currIdx < 0) {
                throw 'transOriginToCurr ERROR; curr not found'
            }
            else {
                code.result.id = currIdx
            }
        }
    }
} 

/*
 * 优化, 返回优化结果
 * @param codeStack Array
 * @param top Array
 * @return ncodeStack Array
 * 会改变原来的codeStack
 */
const optimize = (codeStack, top) => {
    let ncodeStack = []
    codeStack = reduceIfGoto(codeStack)
    let blocks = devide(codeStack, top)
    let blocksWithDag = buildDAGs(blocks)
    let blocksWithRebuildCode = rebuildCodeFromDags(blocksWithDag)
    
    // 组合成新的codeStack
    for (let item of blocksWithRebuildCode) {
        ncodeStack = ncodeStack.concat(item.ncodes)
    }
    reviseGoto(ncodeStack)
    // blocks = attachActiveInfo(blocks)
    // blocks = linkup(blocks)


    return ncodeStack
}

module.exports = optimize
