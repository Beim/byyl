const copy = (obj) => JSON.parse(JSON.stringify(obj))
const print = console.log.bind()
const print_j = (obj, num = 2) => console.log(JSON.stringify(obj, null, num))

const typeWidth = {
    'void': 0,
    'short': 2,
    'integer': 4,
    'float': 8,
    'char': 2,
}

const addableArr = ['short', 'integer', 'float']


/*
 * compare if type1 and type2 have same name and width
 * @param type Object
 * @return Object
 */
const typeEqual = (type1, type2) => {
    if (type1.name !== type2.name || type1.width !== type2.width) {
        return {
            flag: -1,
            err: `can not convert ${type2.name}(${type2.width}) to ${type1.name}(${type1.width})`
        }
    } else {
        return {flag: 1}
    }
}

const addable = (...args) => {
    for (let type of args) {
        if (!addableArr.includes(type.name))
            return {flag: false, type: type}
    }
    return {flag: true}
}

const printCodeStack = (codeStack) => {
    for (let i in codeStack) {
        let item = codeStack[i]
        let {result, arg1, arg2, op} = item
        // 有两个arg
        if (arg2 !== undefined) {
            // 类型转换
            if (op === '=()') {
                // x = (float) y
                print(`${i}:  ${result.id} = (${arg1}) ${arg2.id}`)
            } else if (op === 'call') {
                // temp = call f, 1
                print(`${i}:  ${result.id} = call ${arg1}, ${arg2}`)

            } else {
                // x = y + z
                print(`${i}:  ${result.id} = ${arg1.id} ${op} ${arg2.id}`)
            }
        // 没有arg2
        } else {
            if (op === '=') {
                // x = y
                print(`${i}:  ${result.id} ${op} ${arg1.id}`)
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
                print(`${i}:  ${base.id}[${offset.id}] = ${arg1.id}`)

            } else if (op === '=[]') {
                let {base, offset} = arg1
                // x = y[i]
                print(`${i}:  ${result.id} = ${base.id}[${offset.id}]`)

            } else if (op === '++=') {
                // x = ++y
                print(`${i}:  ${result.id} = ++${arg1.id}`)

            } else if (op === '--=') {
                // x = --y
                print(`${i}:  ${result.id} = --${arg1.id}`)

            } else if (op === '=++') {
                // x = y++
                print(`${i}:  ${result.id} = ${arg1.id}++`)

            } else if (op === '=--') {
                // x = y--
                print(`${i}:  ${result.id} = ${arg1.id}--`)

            } else if (op === 'goto') {
                // goto 101
                print(`${i}:  goto ${result.id}`)

            } else if (op === 'ifgoto') {
                // if a < b goto 101
                print(`${i}:  if ${arg1.left.id} ${arg1.op.id} ${arg1.right.id} goto ${result.id}`)

            } else if (op === 'return') {
                // return x;
                print(`${i}:  return ${result.id}`)

            } else if (op === 'param') {
                // param 1
                print(`${i}:  param ${result.id}`)

            } else {
                // x = - b
                print(`${i}:  ${result.id} = ${op} ${arg1.id}`)
            }
            
        }
    }
}

/*
 * return a type of 'type', and assign obj to the type
 * @param type String
 * @param obj Object
 * @return Object
 * {
 *  name: type,
 *  ...obj
 * }
 */
const getType = (type, obj = {}) => Object.assign(copy(obj), {name: type, width: typeWidth[type]})

/*
 * return a same type with the one which has bigger width between t1 and t2
 * @param t1 Object
 * @param t2 Object
 * @param type Object (has different address with t1 and t2)
 */
const getTypeMax = (t1, t2) => {
    let type = copy(t1.width > t2.width ? t1 : t2)
    return type
}

/*
 * return a type of array
 * @param value String
 * @param type String
 * @return Object
 * {
 *  name: array,
 *  sub: {
 *      value: value,
 *      type: type
 *  }
 * }
 */
const array = (value, type, width) => getType('array', {sub: {value, type, width}})

/*
 * return a type of record
 * @param top Array p241所示符号表
 * @return Object
 * {
 *  name: record,
 *  top: [
 *      {..}, {..}
 *  ]
 * }
 */
const record = (sub) => getType('record', {sub})

module.exports = (acType) => {
    /*
     * 语义动作
     * @param s_global Object
     * @param stack Array
     * @param symbols Array
     * @return Object (返回的属性附加给表达式左部的符号)
     * 若返回 {flag: -1}, 不执行默认的规约动作
     * 若返回 {flag: -2, err: [String]}, 保存错误信息, 不执行默认的规约动作
     */
    return (s_global, stack, symbols) => {
        // 获取离符号栈顶部num 位置的symbol
        const symTop = (num = 0) => symbols[symbols.length - 1 - num]
        // symbols 和stack 同时出栈num个元素, 默认为1
        const symPop = (num = 1) => {
            stack.splice(-num, num)
            symbols.splice(-num, num)
        }
        // 申请一个临时变量
        // r_addr: 和临时变量相同类型的addr
        const getTemp = (r_addr) => {
            if (r_addr.width === undefined) 
                r_addr.width = r_addr.type.width
            let top = s_global['top']
            let lastElem = top[top.length - 1]
            let idx = top.length
            let offset = lastElem ? lastElem.offset + lastElem.width : 0

            let addr = {
                id: `t_${idx}`,
                type: copy(r_addr.type),
                width: r_addr.width,
                isTemp: true,
                offset
            }
            top.push(addr)
            // 增加全局的偏移量
            addOffset(r_addr.width)
            return addr
        }

        // 当前环境的符号表top 中加入obj
        // obj = {id, type, width, offset}
        const topPush = (obj) => {
            if (obj['offset'] === undefined) obj['offset'] = s_global['offset']
            s_global['top'].push(obj)
        }
        
        // 返回当前环境的top栈中id对应的指针, 如果没有, 则返回undefined
        // recurse为0 则只在当前环境中查找
        // recurse为1 则在上层环境中查找
        const getAddrFromTop = (id, recurse = 0) => {
            let EnvStack = s_global['EnvStack']
            let tEnv = EnvStack[EnvStack.length - 1]

            if (recurse === 0) {
                let top = tEnv.top
                return top.find(elem => elem.id === id.lexical)
            } else if (recurse === 1) {
                // let addr = top.find(elem => elem.id === id.lexical)
                let addr = undefined
                while (!addr) {
                    let top = tEnv.top
                    addr = top.find(elem => elem.id === id.lexical)
                    if (!tEnv.prev) break
                    else tEnv = tEnv.prev
                }
                return addr
            }
        }
        // @param name String
        // @param recurse Number
        // recurse 为0则只在当前环境查找函数定义
        // recurse 为1则递归查找
        // @param funcDef Object
        const getFuncFromTop = (name, recurse = 0) => {
            if (recurse === 0) {
                let next = topEnv().next
                return next.find(elem => elem.name === name)
            } else {
                let tEnv = topEnv()
                let funcDef = undefined
                while (!funcDef) {
                    let next = tEnv.next
                    funcDef = next.find(elem => elem.name === name)
                    tEnv = tEnv.prev
                    if (!tEnv) break
                }
                return funcDef
            }
        }
        // @param code 地址码{op, arg1, arg2, result}
        // codeStack中添加一条地址码
        const gen = (code) => s_global['codeStack'].push(code)

        // 返回t1和t2中更宽的地址
        const widen = (addr, t1, t2) => {
            let type = getTypeMax(t1, t2)
            if (typeEqual(addr.type, type).flag === 1) 
                return addr
            else {
                // let type = getTypeMax(t1, t2)
                let tempAddr = getTemp({type, width: type.width})
                gen({
                    op: '=()',
                    arg1: type.name,
                    arg2: addr,
                    result: tempAddr
                })
                return tempAddr
            }
        }

        // 返回codeStack栈中下一条指令的地址 (即top.length)
        const nextinstr = () => s_global['codeStack'].length

        // 返回一个数组, 数组中保存了需要回填的指令序号
        // @param instr Number
        const makelist = (instr) => [instr]

        // 返回一个数组, 该数组为传入的各个参数(数组)合并所成
        // @param args Array(Array)
        const mergelist = (...args) => args.reduce((prev, curr) => {
            if (prev && curr) return prev.concat(curr)
            else if (prev) return prev
            else return curr
        })

        // 回填
        const backpatch = (list, instr) => {
            for (let i of list) {
                let code = s_global['codeStack'][i]
                code.result.id = instr
            }
        }
        
        // top 为当前环境符号表 top = [{id, type, offset}, ...]
        if (!s_global['top']) s_global['top'] = []
        // 偏移量
        if (s_global['offset'] === undefined) s_global['offset'] = 0
        // codeStack = [] 三地址码存储栈
        if (!s_global['codeStack']) s_global['codeStack'] = []
        // paramlist = [] 存储函数调用时的参数
        if (!s_global['paramlist']) s_global['paramlist'] = []
        const pushParam = (param) => {
            s_global['paramlist'].push(param)
        }
        const clearParam = () => s_global['paramlist'] = []
        const getParam = () => s_global['paramlist']
        // flist = [] 形参列表
        if (!s_global['flist']) s_global['flist'] = []
        const pushFlist = (elem) => {
            s_global['flist'].push(elem)
        }
        const clearFlist = () => s_global['flist'] = []
        const getFlist = () => s_global['flist']
        

        /*
        // Env 保存各层环境的符号表  Env = [top, ...]
        if (!s_global['Env']) s_global['Env'] = []
        // Stack = [offset, ...]
        if (!s_global['Stack']) s_global['Stack'] = []
        */

        // 创建环境表, 保存当前环境的各个栈
        // @param returnType Object
        // @param name String
        // @param prev Object
        const maketable = (name = '', returnType = getType('void'), prev = null) => {
            return {
                name, 
                returnType,
                top: s_global['top'],
                offset: s_global['offset'],
                codeStack: s_global['codeStack'],
                flist: s_global['flist'],
                prev,
                next: []
            }
        }

        /*
        // 更新EnvStack的顶部元素的offset为offset, 默认值为当前offset
        const updateOffset = (offset = s_global['offset']) => {
            let EnvStack = s_global['EnvStack']
            EnvStack[EnvStack.length - 1].offset = offset
            return offset
        }
        */

        // 初始化当前环境
        const initEnv = (top, offset, codeStack, flist) => {
            s_global['top'] = top || []
            s_global['offset'] = offset || 0
            s_global['codeStack'] = codeStack || []
            s_global['flist'] = flist || []
        }

        // 1. 将EnvStack栈顶元素的next加入env
        // 2. env的prev指向EnvStack栈顶元素
        // 3. 将env压入EnvStack栈
        const saveEnv = (env) => {
            let EnvStack = s_global['EnvStack']
            EnvStack[EnvStack.length - 1].next.push(env)
            env.prev = EnvStack[EnvStack.length - 1]
            EnvStack.push(env)
        }
        // 获取EnvStack栈顶部的环境
        const topEnv = () => {
            let EnvStack = s_global['EnvStack']
            return EnvStack[EnvStack.length - 1]
        }
        // 将EnvStack顶部环境出栈
        const popEnv = () => s_global['EnvStack'].pop()
        // 将EnvStack栈顶的环境复制到当前环境
        const recoverEnv = () => {
            let EnvStack = s_global['EnvStack']
            let tEnv = EnvStack[EnvStack.length - 1]
            s_global['top'] = tEnv.top
            s_global['offset'] = tEnv.offset
            s_global['codeStack'] = tEnv.codeStack
            s_global['flist'] = tEnv.flist
        }
        // 同时更改EnvStack栈顶环境和当前环境(相同)的offset
        const addOffset = (offset) => {
            let EnvStack = s_global['EnvStack']
            let top = EnvStack[EnvStack.length - 1]
            top.offset += offset
            s_global['offset'] = top.offset
        }

        // 保存环境的栈
        // if (!s_global['EnvStack']) s_global['EnvStack'] = []
        if (!s_global['EnvStack']) {
            let obj = {
                name: '__global__',
                returnType: {name: 'void', width: 0},
                top: s_global['top'],
                offset: s_global['offset'],
                codeStack: s_global['codeStack'],
                flist: s_global['flist'],
                prev: null,
                next: []
            }
            s_global['EnvStack'] = [obj]
        }

        const actObj = {

            'P-945': () => {
                gen({
                    op: 'exit'
                })
                let exitList = []
                let gotos = ['ifgoto', 'goto']
                for (let [idx, item] of s_global['codeStack'].entries()) {
                    if (gotos.includes(item.op)) {
                        if (parseInt(item.result.id) < 0) {
                            exitList.push(idx)
                        }
                    }
                }
                backpatch(exitList, s_global['codeStack'].length - 1)

                /*
                let codeStack = s_global.codeStack
                print('codeStack: ')
                printCodeStack(codeStack)
                print()
                */

                /*
                print('top: ')
                print(s_global.top)
                print()
                */
            },

            'test': () => {
                print('111')
            },

            // start of 271
            // Sa -> return E ; -> Sa5-271
            // Elist -> E -> Elist1-271
            'Elist1-271': () => {
                let E = symTop()
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }

                pushParam(E.addr)
            },
            // Elist -> Elist , E -> Elist2-271
            'Elist2-271': () => {
                let E = symTop()
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }

                pushParam(E.addr)
            },
            // Ef -> id ( Elist ) -> Ef1-271
            'Ef1-271': () => {
                let Elist = symTop(1)
                if (Elist.err) {
                    return {symbol: Elist.symbol, err: Elist.err}
                }
                // 获取参数列表, 并还原全局变量
                let paramlist = getParam()
                clearParam()
                let id = symTop(3)

                // 从top栈中递归查找id
                let ifDef = getAddrFromTop(id, 1)
                if (!ifDef) {
                    return {symbol: id, err: `${id.lexical} is not defined`}
                }
                if (ifDef.type.name !== 'function') {
                    return {symbol: id, err: `${id.lexical} is not a function`}
                }

                // 递归查找函数定义
                let funcDef = getFuncFromTop(ifDef.id, 1)
                if (!funcDef) {
                    return {symbol: id, err: `${id.lexical} is defined, but func not found`}
                }

                // 检查形参列表和实参列表长度是否匹配
                if (funcDef.flist.length !== paramlist.length)
                    return {symbol: id, err: `function ${id.lexical} needs [${funcDef.flist.length}] arguments, not [${paramlist.length}]`}
                // 检查形参和实参类型是否匹配
                for (let i in funcDef.flist) {
                    let f = funcDef.flist[i]
                    let p = paramlist[i]
                    let typeEq = typeEqual(f.type, p.type)
                    if (typeEq.flag < 0) {
                        return {symbol: id, err: typeEq.err}
                    }
                }

                for (let i of paramlist) {
                    gen({
                        op: 'param',
                        result: i
                    })
                }
                let addr = getTemp({
                    type: copy(funcDef.returnType),
                    width: funcDef.returnType.width
                })
                gen({
                    op: 'call',
                    arg1: funcDef.name,
                    arg2: paramlist.length,
                    result: addr
                })
                return {addr}
            },
            // E -> Ef -> E4-271
            'E4-271': () => {
                let Ef = symTop()
                if (Ef.err) {
                    return {symbol: Ef.symbol, err: Ef.err}
                }
                return {addr: Ef.addr}
            },
            // Sa -> return E ; -> Sa5-271
            'Sa5-271': () => {
                let E = symTop(1)
                if (E.err) {
                    symPop(3)
                    return {flag: -2, symbol: E.symbol, err: E.err}
                }

                // 检查返回值类型和设置的类型是否一致
                let E_type = E.addr.type
                let returnType = topEnv().returnType
                let typeEq = typeEqual(E_type, returnType)
                if (typeEq.flag < 0) {
                    symPop(3)
                    return {flag: -2, symbol: E, err: `return ${E_type.name}[${E_type.width}] rather than ${returnType.name}[${returnType.width}]`}
                }

                gen({
                    op: 'return',
                    result: E.addr
                })
                return {nextlist: []}
            },
            // Sa -> Ef ; -> Sa6-271
            'Sa6-271': () => {
                let Ef = symTop(1)
                if (Ef.err) {
                    symPop(2)
                    return {flag: -2, symbol: Ef.symbol, err: Ef.err}
                }
                return {nextlist: []}
            },
            // Da -> T id FN ( Flist ) { D S } -> Da1-271
            // FN -> nil -> FN1->271
            'nFN1-271': () => {
                let T = symTop(2)
                let id = symTop(1)

                let ifDef = getAddrFromTop(id)
                if (ifDef) {
                    return {symbol: id, err: `${id.lexical} is already defined`}
                }

                // 初始化环境, 将环境打包后入栈
                initEnv()
                let t = maketable(id.lexical, T.type)
                saveEnv(t)
            },
            // Da -> T id FN ( Flist ) { D S } -> Da1-271
            'Da1-271': () => {
                let FN = symTop(7)
                if (FN.err) {
                    symPop(10)
                    return {flag: -2, symbol: FN.symbol, err: FN.err}
                }
                let id = symTop(8)
                // 获取函数的offset
                let funcOffset = s_global['offset']
                let flist = s_global['flist']
                // 函数环境出栈
                popEnv()
                // 根据EnvStack恢复环境
                recoverEnv()

                topPush({
                    id: id.lexical,
                    type: {name: 'function', width: funcOffset},
                    width: funcOffset
                })
                addOffset(funcOffset)
            },
            // Flist -> Flist , T id -> Flist1-271
            'Flist1-271': () => {
                let T = symTop(1)
                let id = symTop()

                let f = {
                    id: id.lexical,
                    type: copy(T.type),
                    width: T.width
                }
                topPush(f)
                pushFlist(f)
                /*
                topPush({
                    id: id.lexical,
                    type: copy(T.type),
                    width: T.width
                })
                */
                addOffset(T.width)
            },
            // Flist -> T id -> Flist2-271
            'Flist2-271': () => {
                let T = symTop(1)
                let id = symTop()

                let f = {
                    id: id.lexical,
                    type: copy(T.type),
                    width: T.width,
                }
                topPush(f)
                pushFlist(f)

                /*
                topPush({
                    id: id.lexical,
                    type: copy(T.type),
                    width: T.width
                })
                */
                addOffset(T.width)
            },
            // end of 271

            // start of 267
            // S -> Sa -> S3-267
            // Sa -> if ( Bo ) M Sb -> Sa2-267
            'Sa2-267': () => {
                let Bo = symTop(3)
                let Sb = symTop()
                let M = symTop(1)

                backpatch(Bo.truelist, M.instr)
                let nextlist = mergelist(Bo.falselist, Sb.nextlist)
                return {nextlist}
            },
            // Sa -> if ( Bo ) M Sb N else M Sb -> Sa3-267
            'Sa3-267': () => {
                let Bo = symTop(7)
                let M1 = symTop(5)
                let Sb1 = symTop(4)
                let N = symTop(3)
                let M2 = symTop(1)
                let Sb2 = symTop()

                backpatch(Bo.truelist, M1.instr)
                backpatch(Bo.falselist, M2.instr)
                let nextlist = mergelist(Sb1.nextlist, N.nextlist, Sb2.nextlist)
                return {nextlist}
            },
            // Sa -> while M ( Bo ) M Sb -> Sa4-267
            'Sa4-267': () => {
                let M1 = symTop(5)
                let Bo = symTop(3)
                let M2 = symTop(1)
                let Sb = symTop()

                backpatch(Bo.truelist, M2.instr)
                backpatch(Sb.nextlist, M1.instr)
                let nextlist = Bo.falselist
                gen({
                    op: 'goto',
                    result: {id: M1.instr}
                })
                return {nextlist}
            },
            // Sa -> do M Sb while M ( Bo ) ; -> Sa7-267
            'Sa7-267': () => {
                let M1 = symTop(7)
                let Sb = symTop(6)
                let M2 = symTop(4)
                let Bo = symTop(2)

                backpatch(Bo.truelist, M1.instr)
                backpatch(Sb.nextlist, M2.instr)
                let nextlist = Bo.falselist
                // 由于按顺序执行, 因此此处不需要再goto
                /*
                gen({
                    op: 'goto',
                    result: {id: nextlist}
                })
                */
                return {nextlist}
            },
            'pass-nextlist-267': () => {
                let Sa = symTop()
                return {nextlist: Sa.nextlist}
            },
            // S -> S M Sa -> S4-267
            'S4-267': () => {
                let S1 = symTop(2)
                let Sa = symTop()
                let M = symTop(1)

                backpatch(S1.nextlist, M.instr)
                return {nextlist: Sa.nextlist}
            },
            // N -> nil -> N1-267
            'N1-267': () => {
                let nextlist = makelist(nextinstr())
                gen({
                    op: 'goto',
                    result: {id: -1}
                })
                return {nextlist}
            },
            // Sa -> A ; -> Sa1-267
            'Sa1-267': () => {
                let A = symTop(1)
                if (A.err) {
                    symPop(2)
                    return {flag: -2, symbol: A.symbol, err: A.err}
                }
                return {nextlist: []}
            },
            // Sb -> { S } -> Sb1-267
            'Sb1-267': () => {
                let S = symTop(1)
                return {nextlist: S.nextlist}
            },
            // end of 267

            // start of 264
            // M -> nil -> nM1-264
            'nM1-264': () => {
                let instr = nextinstr()
                return {instr}
            },
            // BV -> true -> BV1-264
            'BV1-264': () => {
                let truelist = makelist(nextinstr())
                let falselist = []
                gen({
                    op: 'goto',
                    result: {id: -1}
                })
                return {truelist, falselist}
            },
            // BV -> false -> BV2-264
            'BV2-264': () => {
                let falselist = makelist(nextinstr())
                let truelist = []
                gen({
                    op: 'goto',
                    result: {id: -1}
                })
                return {falselist, truelist}
            },
            // BV -> ( Bo ) -> BV3-264
            'BV3-264': () => {
                let Bo = symTop(1)
                return {
                    truelist: Bo.truelist,
                    falselist: Bo.falselist
                }
            },
            // BM -> not BV -> BM2-264
            'BM2-264': () => {
                let BV = symTop()
                return {
                    truelist: BV.falselist,
                    falselist: BV.truelist
                }
            },
            'pass-list-264': () => {
                let top = symTop()
                return {
                    truelist: top.truelist,
                    falselist: top.falselist
                }
            },
            // Bo -> Bo or M Boa -> Bo1-264
            'Bo1-264': () => {
                let Bo1 = symTop(3)
                let M = symTop(1)
                let Boa = symTop()

                backpatch(Bo1.falselist, M.instr)
                return {
                    truelist: mergelist(Bo1.truelist, Boa.truelist),
                    falselist: Boa.falselist
                }
            },
            // BN -> BN and M BNa -> BN1-264
            'BN1-264': () => {
                let BN1 = symTop(3)
                let M = symTop(1)
                let BNa = symTop()

                backpatch(BN1.truelist, M.instr)
                return {
                    truelist: BNa.truelist,
                    falselist: mergelist(BN1.falselist, BNa.falselist)
                }
            },
            // BM -> E relop E -> BM1-264
            'BM1-264': () => {
                let E1 = symTop(2)
                let E2 = symTop()
                let relop = symTop(1)

                let truelist = makelist(nextinstr())
                let falselist = makelist(nextinstr() + 1)
                gen({
                    op: 'ifgoto',
                    arg1: {
                        left: E1.addr,
                        op: relop.addr,
                        right: E2.addr
                    },
                    result: {id: -1}
                })
                gen({
                    op: 'goto',
                    result: {id: -1}
                })
                return {truelist, falselist}
            },
            // relop -> < -> relop-264
            'relop-264': () => {
                let relop = symTop()
                return {addr: {id: relop.lexical}}
            },
            // end of 264
            // start of 246
            // OLD!! Sa -> L = E ; -> S2-246
            // A -> L = E -> A2-246
            'A2-246': () => {
                let L = symTop(2)
                let E = symTop()

                if (L.err) {
                    return {symbol: L.symbol, err: L.err}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }

                let typeEq = typeEqual(L.addr.type, E.addr.type)
                if (typeEq.flag !== 1) {
                    let symbol = symTop(1)
                    return {symbol, err: typeEq.err}
                }

                let base = L.array
                let offset = L.addr

                gen({
                    op: '[]=',
                    arg1: E.addr,
                    result: {base, offset}
                })
            },
            // Y -> L -> Y7-246
            'Y7-246': () => {
                let L = symTop()
                if (L.err) {
                    return {symbol: L.symbol, err: L.err}
                }
                let Y_addr = getTemp(L.addr)

                let base = L.array
                let offset = L.addr
                gen({
                    op: '=[]',
                    arg1: {base, offset},
                    result: Y_addr
                })
                return {addr: Y_addr}
            },
            // L -> id [ E ] -> L1-246
            'L1-246': () => {
                let E = symTop(1)
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                if (E.addr.type.name !== 'integer') {
                    return {symbol: E, err: `id[E], E must be a integer`}
                }

                let id = symTop(3)
                let L_array = getAddrFromTop(id, 1)
                // 没找到id
                if (!L_array) {
                    return {symbol: id, err: `${id.lexical} is not defined`}
                }
                if (L_array.type.name !== 'array') {
                    return {symbol: id, err: `${id.lexical} is not Array`}
                }

                let L_type = L_array.type.sub.type
                let L_addr = getTemp(L_array.type.sub)

                gen({
                    op: '*',
                    arg1: E.addr,
                    // arg2: L_type.width,
                    arg2: {id: L_type.width, type: getType('integer')},
                    result: L_addr
                })
                return {
                    array: L_array,
                    type: L_type,
                    addr: L_addr
                }
            },
            // L -> id [ E ] -> L1-246
            // L -> L [ E ] -> L2-246
            'L2-246': () => {
                let L1 = symTop(3)
                if (L1.err) {
                    return {symbol: L1.symbol, err: L1.err}
                }
                let E = symTop(1)
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                if (E.addr.type.name !== 'integer') {
                    return {symbol: E, err: `id[E], E must be a integer`}
                }

                let L_array = L1.array
                let L_type = L1.type.sub.type

                let t = getTemp(L1.addr.type.sub)
                let L_addr = getTemp(L1.addr.type.sub)

                // 每个数组元素的宽度w1, 第i1个元素的开始地址为
                // base + i1 * w1
                gen({
                    op: '*',
                    arg1: E.addr,
                    // arg2: L_type.width,
                    arg2: {id: L_type.width, type: getType('integer')},
                    result: t
                })
                gen({
                    op: '+',
                    arg1: L1.addr,
                    arg2: t,
                    result: L_addr
                })
                return {
                    array: L_array,
                    type: L_type,
                    addr: L_addr
                }
            },
            // end of 246

            // start of 244
            // OLD!! Sa -> id = E ; -> S1-244
            // A -> id = E -> A1-244
            'A1-244': () => {
                let id = symTop(2)
                let E = symTop()

                // 先在当前环境查找 , 若没找到则到上层环境查找
                let id_addr = getAddrFromTop(id, 1)
                // id未定义
                if (!id_addr) {
                    let symbol = symTop(2)
                    // 将错误传递到上层
                    return {symbol, err: `${id.lexical} is not defined`}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }

                let E_addr = E.addr
                let typeEq = typeEqual(id_addr.type, E_addr.type)
                // 类型不相同
                if (typeEq.flag !== 1) {
                    // 令'=' 为错误发生位置
                    let symbol = symTop(1)
                    // 将错误传递到上层
                    return {symbol, err: typeEq.err}
                }

                gen({
                    op: '=',
                    arg1: E_addr,
                    result: id_addr
                })
            },
            // A -> id += E -> A3-244
            'A3-244': () => {
                let id = symTop(2)
                let E = symTop()

                let id_addr = getAddrFromTop(id, 1)
                if (!id_addr) {
                    return {symbol: id, err: `${id.lexical} is not defined`}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                let addableType = addable(id_addr.type, E.addr.type)
                if (addableType.flag === false) {
                    return {symbol: id, err: `${addableType.type.name} is not operable`}
                }
                let E_type = getTypeMax(id_addr.type, E.addr.type)
                let typeEq = typeEqual(E_type, id_addr.type)
                if (typeEq.flag !== 1) {
                    return {symbol: id, err: typeEq.err}
                }
                let a1 = widen(id_addr, id_addr.type, E.addr.type)
                let a2 = widen(E.addr, E.addr.type, id_addr.type)
                let temp_addr = getTemp(a1)
                gen({
                    op: '+',
                    arg1: a1,
                    arg2: a2,
                    result: temp_addr
                })
                gen({
                    op: '=',
                    arg1: temp_addr,
                    result: id_addr
                })
            },
            // A -> id -= E -> A4-244
            'A4-244': () => {
                let id = symTop(2)
                let E = symTop()

                let id_addr = getAddrFromTop(id, 1)
                if (!id_addr) {
                    return {symbol: id, err: `${id.lexical} is not defined`}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                let addableType = addable(id_addr.type, E.addr.type)
                if (addableType.flag === false) {
                    return {symbol: id, err: `${addableType.type.name} is not operable`}
                }
                let E_type = getTypeMax(id_addr.type, E.addr.type)
                let typeEq = typeEqual(E_type, id_addr.type)
                if (typeEq.flag !== 1) {
                    return {symbol: id, err: typeEq.err}
                }
                let a1 = widen(id_addr, id_addr.type, E.addr.type)
                let a2 = widen(E.addr, E.addr.type, id_addr.type)
                let temp_addr = getTemp(a1)
                gen({
                    op: '-',
                    arg1: a1,
                    arg2: a2,
                    result: temp_addr
                })
                gen({
                    op: '=',
                    arg1: temp_addr,
                    result: id_addr
                })
            },
            // A -> id *= E -> A5-244
            'A5-244': () => {
                let id = symTop(2)
                let E = symTop()

                let id_addr = getAddrFromTop(id, 1)
                if (!id_addr) {
                    return {symbol: id, err: `${id.lexical} is not defined`}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                let addableType = addable(id_addr.type, E.addr.type)
                if (addableType.flag === false) {
                    return {symbol: id, err: `${addableType.type.name} is not operable`}
                }
                let E_type = getTypeMax(id_addr.type, E.addr.type)
                let typeEq = typeEqual(E_type, id_addr.type)
                if (typeEq.flag !== 1) {
                    return {symbol: id, err: typeEq.err}
                }
                let a1 = widen(id_addr, id_addr.type, E.addr.type)
                let a2 = widen(E.addr, E.addr.type, id_addr.type)
                let temp_addr = getTemp(a1)
                gen({
                    op: '*',
                    arg1: a1,
                    arg2: a2,
                    result: temp_addr
                })
                gen({
                    op: '=',
                    arg1: temp_addr,
                    result: id_addr
                })
            },
            // A -> id /= E -> A6-244
            'A6-244': () => {
                let id = symTop(2)
                let E = symTop()

                let id_addr = getAddrFromTop(id, 1)
                if (!id_addr) {
                    return {symbol: id, err: `${id.lexical} is not defined`}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                let addableType = addable(id_addr.type, E.addr.type)
                if (addableType.flag === false) {
                    return {symbol: id, err: `${addableType.type.name} is not operable`}
                }
                let E_type = getTypeMax(id_addr.type, E.addr.type)
                let typeEq = typeEqual(E_type, id_addr.type)
                if (typeEq.flag !== 1) {
                    return {symbol: id, err: typeEq.err}
                }
                let a1 = widen(id_addr, id_addr.type, E.addr.type)
                let a2 = widen(E.addr, E.addr.type, id_addr.type)
                let temp_addr = getTemp(a1)
                gen({
                    op: '/',
                    arg1: a1,
                    arg2: a2,
                    result: temp_addr
                })
                gen({
                    op: '=',
                    arg1: temp_addr,
                    result: id_addr
                })
            },
            // A -> L += E -> A7-246
            'A7-246': () => {
                let L = symTop(2)
                let E = symTop()
                if (L.err) {
                    return {symbol: L.symbol, err: L.err}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                let addableType = addable(L.addr.type, E.addr.type)
                if (addableType.flag === false) {
                    return {symbol: E, err: `${addableType.type.name} is not operable`}
                }
                let E_type = getTypeMax(L.addr.type, E.addr.type)
                let typeEq = typeEqual(E_type, L.addr.type)
                if (typeEq.flag !== 1) {
                    return {symbol: E, err: typeEq.err}
                }

                let base = L.array
                let offset = L.addr
                let temp1_addr = getTemp(L.addr)
                gen({
                    op: '=[]',
                    arg1: {base, offset},
                    result: temp1_addr
                })
                // let a1 = widen(L.addr, L.addr.type, E.addr.type)
                let a2 = widen(E.addr, E.addr.type, L.addr.type)
                let temp2_addr = getTemp(a2)
                gen({
                    op: '+',
                    arg1: temp1_addr,
                    arg2: a2,
                    result: temp2_addr,
                })
                gen({
                    op: '[]=',
                    arg1: temp2_addr,
                    result: {base,offset}
                })
            },
            // A -> L -= E -> A8-246
            'A8-246': () => {
                let L = symTop(2)
                let E = symTop()
                if (L.err) {
                    return {symbol: L.symbol, err: L.err}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                let addableType = addable(L.addr.type, E.addr.type)
                if (addableType.flag === false) {
                    return {symbol: E, err: `${addableType.type.name} is not operable`}
                }
                let E_type = getTypeMax(L.addr.type, E.addr.type)
                let typeEq = typeEqual(E_type, L.addr.type)
                if (typeEq.flag !== 1) {
                    return {symbol: E, err: typeEq.err}
                }

                let base = L.array
                let offset = L.addr
                let temp1_addr = getTemp(L.addr)
                gen({
                    op: '=[]',
                    arg1: {base, offset},
                    result: temp1_addr
                })
                // let a1 = widen(L.addr, L.addr.type, E.addr.type)
                let a2 = widen(E.addr, E.addr.type, L.addr.type)
                let temp2_addr = getTemp(a2)
                gen({
                    op: '-',
                    arg1: temp1_addr,
                    arg2: a2,
                    result: temp2_addr,
                })
                gen({
                    op: '[]=',
                    arg1: temp2_addr,
                    result: {base,offset}
                })
            },
            // A -> L *= E -> A9-246
            'A9-246': () => {
                let L = symTop(2)
                let E = symTop()
                if (L.err) {
                    return {symbol: L.symbol, err: L.err}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                let addableType = addable(L.addr.type, E.addr.type)
                if (addableType.flag === false) {
                    return {symbol: E, err: `${addableType.type.name} is not operable`}
                }
                let E_type = getTypeMax(L.addr.type, E.addr.type)
                let typeEq = typeEqual(E_type, L.addr.type)
                if (typeEq.flag !== 1) {
                    return {symbol: E, err: typeEq.err}
                }

                let base = L.array
                let offset = L.addr
                let temp1_addr = getTemp(L.addr)
                gen({
                    op: '=[]',
                    arg1: {base, offset},
                    result: temp1_addr
                })
                // let a1 = widen(L.addr, L.addr.type, E.addr.type)
                let a2 = widen(E.addr, E.addr.type, L.addr.type)
                let temp2_addr = getTemp(a2)
                gen({
                    op: '*',
                    arg1: temp1_addr,
                    arg2: a2,
                    result: temp2_addr,
                })
                gen({
                    op: '[]=',
                    arg1: temp2_addr,
                    result: {base,offset}
                })
            },
            // A -> L /= E -> A10-246
            'A10-246': () => {
                let L = symTop(2)
                let E = symTop()
                if (L.err) {
                    return {symbol: L.symbol, err: L.err}
                }
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }
                let addableType = addable(L.addr.type, E.addr.type)
                if (addableType.flag === false) {
                    return {symbol: E, err: `${addableType.type.name} is not operable`}
                }
                let E_type = getTypeMax(L.addr.type, E.addr.type)
                let typeEq = typeEqual(E_type, L.addr.type)
                if (typeEq.flag !== 1) {
                    return {symbol: E, err: typeEq.err}
                }

                let base = L.array
                let offset = L.addr
                let temp1_addr = getTemp(L.addr)
                gen({
                    op: '=[]',
                    arg1: {base, offset},
                    result: temp1_addr
                })
                // let a1 = widen(L.addr, L.addr.type, E.addr.type)
                let a2 = widen(E.addr, E.addr.type, L.addr.type)
                let temp2_addr = getTemp(a2)
                gen({
                    op: '/',
                    arg1: temp1_addr,
                    arg2: a2,
                    result: temp2_addr,
                })
                gen({
                    op: '[]=',
                    arg1: temp2_addr,
                    result: {base,offset}
                })
            },
            // E -> E + Ea -> E2-244
            'E2-244': () => {
                let E1 = symTop(2)
                let Ea = symTop()
                if (E1.err) {
                    return {symbol: E1.symbol, err: E1.err}
                }
                if (Ea.err) {
                    return {symbol: Ea.symbol, err: Ea.err}
                }

                let addableType = addable(E1.addr.type, Ea.addr.type)
                // 不可加类型
                if (addableType.flag === false) {
                    return {symbol: E1, err: `${addableType.type.name} is not operable`}
                }

                let E_type = getTypeMax(E1.addr.type, Ea.addr.type)
                // 如果E1 和Ea 都是常数, 则直接计算结果并复制给E
                if (!isNaN(E1.addr.id) && !isNaN(Ea.addr.id)) {
                    let E_addr = getTemp({type: E_type, width: E_type.width})
                    E1.addr.id = parseFloat(E1.addr.id) + parseFloat(Ea.addr.id) + ''
                    gen({
                        op: '=',
                        arg1: E1.addr,
                        result: E_addr
                    })
                    return {addr: E_addr}
                }

                // 转换为更大宽度
                let a1 = widen(E1.addr, E1.addr.type, Ea.addr.type)
                let a2 = widen(Ea.addr, Ea.addr.type, E1.addr.type)
                // 以转换后更大宽度的类型创建临时变量
                let E_addr = getTemp(a1)
                gen({
                    op: '+',
                    arg1: a1,
                    arg2: a2,
                    result: E_addr
                })
                return {addr: E_addr}
            },
            // E -> E - Ea -> E3-244
            'E3-244': () => {
                let E1 = symTop(2)
                let Ea = symTop()
                if (E1.err) {
                    return {symbol: E1.symbol, err: E1.err}
                }
                if (Ea.err) {
                    return {symbol: Ea.symbol, err: Ea.err}
                }

                let addableType = addable(E1.addr.type, Ea.addr.type)
                // 不可加类型
                if (addableType.flag === false) {
                    return {symbol: E1, err: `${addableType.type.name} is not operable`}
                }

                let E_type = getTypeMax(E1.addr.type, Ea.addr.type)
                // 如果E1 和Ea 都是常数, 则直接计算结果并复制给E
                if (!isNaN(E1.addr.id) && !isNaN(Ea.addr.id)) {
                // if (!(parseFloat(E1.addr.id) !== NaN || parseFloat(Ea.addr.id) !== NaN)) {
                    let E_addr = getTemp({type: E_type, width: E_type.width})
                    E1.addr.id = parseFloat(E1.addr.id) - parseFloat(Ea.addr.id) + ''
                    gen({
                        op: '=',
                        arg1: E1.addr,
                        result: E_addr
                    })
                    return {addr: E_addr}
                }

                // 转换为更大宽度
                let a1 = widen(E1.addr, E1.addr.type, Ea.addr.type)
                let a2 = widen(Ea.addr, Ea.addr.type, E1.addr.type)
                // 以转换后更大宽度的类型创建临时变量
                let E_addr = getTemp(a1)
                gen({
                    op: '-',
                    arg1: a1,
                    arg2: a2,
                    result: E_addr
                })
                return {addr: E_addr}
            },
            // E -> Ea -> E1-244
            'E1-244': () => {
                let Ea = symTop()
                if (Ea.err) {
                    return {symbol: Ea.symbol, err: Ea.err}
                }

                let addr = Ea.addr
                return {addr}
            },
            // Ea -> R -> Ea8-244
            'Ea8-244': () => {
                let R = symTop()
                if (R.err) {
                    return {symbol: R.symbol, err: R.err}
                }

                let addr = R.addr
                return {addr}
            },
            // R -> R * Ra -> R1-244
            'R1-244': () => {
                let R1 = symTop(2)
                let Ra = symTop()
                if (R1.err) {
                    return {symbol: R1.symbol, err: R1.err}
                }
                if (Ra.err) {
                    return {symbol: Ra.symbol, err: Ra.err}
                }

                let addableType = addable(R1.addr.type, Ra.addr.type)
                // 不可加类型
                if (addableType.flag === false) {
                    return {symbol: E1, err: `${addableType.type.name} is not operable`}
                }

                let R_type = getTypeMax(R1.addr.type, Ra.addr.type)
                // 如果E1 和Ea 都是常数, 则直接计算结果并复制给E
                // if (!(parseFloat(R1.addr.id) !== NaN || parseFloat(Ra.addr.id) !== NaN)) {
                if (!isNaN(R1.addr.id) && !isNaN(Ra.addr.id)) {
                    let R_addr = getTemp({type: R_type, width: R_type.width})
                    R1.addr.id = parseFloat(R1.addr.id) * parseFloat(Ra.addr.id) + ''
                    gen({
                        op: '=',
                        arg1: R1.addr,
                        result: R_addr
                    })
                    return {addr: R_addr}
                }

                // 转换为更大宽度
                let a1 = widen(R1.addr, R1.addr.type, Ra.addr.type)
                let a2 = widen(Ra.addr, Ra.addr.type, R1.addr.type)
                // 以转换后更大宽度的类型创建临时变量
                let R_addr = getTemp(a1)
                gen({
                    op: '*',
                    arg1: a1,
                    arg2: a2,
                    result: R_addr
                })
                return {addr: R_addr}
            },
            // R -> R / Ra -> R2-244
            'R2-244': () => {
                let R1 = symTop(2)
                let Ra = symTop()
                if (R1.err) {
                    return {symbol: R1.symbol, err: R1.err}
                }
                if (Ra.err) {
                    return {symbol: Ra.symbol, err: Ra.err}
                }

                let addableType = addable(R1.addr.type, Ra.addr.type)
                // 不可加类型
                if (addableType.flag === false) {
                    return {symbol: E1, err: `${addableType.type.name} is not operable`}
                }

                let R_type = getTypeMax(R1.addr.type, Ra.addr.type)
                /*
                // 如果E1 和Ea 都是常数, 则直接计算结果并复制给E
                // if (!(parseFloat(R1.addr.id) !== NaN || parseFloat(Ra.addr.id) !== NaN)) {
                if (!isNaN(R1.addr.id) && !isNaN(Ra.addr.id)) {
                    let R_addr = getTemp({type: R_type, width: R_type.width})
                    R1.addr.id = parseFloat(R1.addr.id) / parseFloat(Ra.addr.id) + ''
                    gen({
                        op: '=',
                        arg1: R1.addr,
                        result: R_addr
                    })
                    return {addr: R_addr}
                }
                */

                // 转换为更大宽度
                let a1 = widen(R1.addr, R1.addr.type, Ra.addr.type)
                let a2 = widen(Ra.addr, Ra.addr.type, R1.addr.type)
                // 以转换后更大宽度的类型创建临时变量
                let R_addr = getTemp(a1)
                gen({
                    op: '/',
                    arg1: a1,
                    arg2: a2,
                    result: R_addr
                })
                return {addr: R_addr}
            },
            // R -> Ra -> R3-244
            'R3-244': () => {
                let Ra = symTop()
                if (Ra.err) {
                    return {symbol: Ra.symbol, err: Ra.err}
                }

                let addr = Ra.addr
                return {addr}
            },
            // Ra -> Y -> Ra1-244
            'Ra1-244': () => {
                let Y = symTop()
                if (Y.err) {
                    return {symbol: Y.symbol, err: Y.err}
                }

                let addr = Y.addr
                return {addr}
            },
            // Sa -> ++ Y ; -> Ra6-244
            'Ra6-244': () => {
                // 与Ra2-244类似
                let Y1 = symTop(1)
                if (Y1.err) {
                    return {flag: -2, symbol: Y1.symbol, err: Y1.err}
                }
                if (!isNaN(Y1.addr.id)) {
                    symPop(3)
                    return {flag: -2, symbol: Y1, err: ` Invalid left-hand side expression in postfix operation`}
                }
                let tname = Y1.addr.type.name

                if (tname !== 'integer' && tname !== 'float' && tname !== 'short') {
                    symPop(3)
                    return {
                        flag: -2,
                        err: `can not ++ ${tname}`
                    }
                } else {
                    gen({
                        op: '+',
                        arg1: Y1.addr,
                        arg2: {id: '1', type: Y1.addr.type},
                        result: Y1.addr
                    })
                }

                return {nextlist: []}
            },
            // Sa -> -- Y ; -> Ra7-244
            'Ra7-244': () => {
                let Y1 = symTop(1)
                if (Y1.err) {
                    return {flag: -2, symbol: Y1.symbol, err: Y1.err}
                }
                if (!isNaN(Y1.addr.id)) {
                    symPop(3)
                    return {flag: -2, symbol: Y1, err: ` Invalid left-hand side expression in postfix operation`}
                }
                let tname = Y1.addr.type.name

                if (tname !== 'integer' && tname !== 'float' && tname !== 'short') {
                    symPop(3)
                    return {
                        flag: -2,
                        err: `can not ++ ${tname}`
                    }
                } else {
                    gen({
                        op: '-',
                        arg1: Y1.addr,
                        arg2: {id: '1', type: Y1.addr.type},
                        result: Y1.addr
                    })
                }
                return {nextlist: []}
            },
            // Sa -> Y ++ ; -> Ra8-244
            'Ra8-244': () => {
                let Y1 = symTop(2)
                if (Y1.err) {
                    return {flag: -2, symbol: Y1.symbol, err: Y1.err}
                }
                if (!isNaN(Y1.addr.id)) {
                    symPop(3)
                    return {flag: -2, symbol: Y1, err: ` Invalid left-hand side expression in postfix operation`}
                }
                let tname = Y1.addr.type.name

                if (tname !== 'integer' && tname !== 'float' && tname !== 'short') {
                    symPop(3)
                    return {
                        flag: -2,
                        err: `can not ++ ${tname}`
                    }
                } else {
                    gen({
                        op: '+',
                        arg1: Y1.addr,
                        arg2: {id: '1', type: Y1.addr.type},
                        result: Y1.addr
                    })
                }
                return {nextlist: []}
            },
            //Sa -> Y -- ; -> Ra9-244
            'Ra9-244': () => {
                let Y1 = symTop(2)
                if (Y1.err) {
                    return {flag: -2, symbol: Y1.symbol, err: Y1.err}
                }
                if (!isNaN(Y1.addr.id)) {
                    symPop(3)
                    return {flag: -2, symbol: Y1, err: ` Invalid left-hand side expression in postfix operation`}
                }
                let tname = Y1.addr.type.name

                if (tname !== 'integer' && tname !== 'float' && tname !== 'short') {
                    symPop(3)
                    return {
                        flag: -2,
                        err: `can not ++ ${tname}`
                    }
                } else {
                    gen({
                        op: '-',
                        arg1: Y1.addr,
                        arg2: {id: '1', type: Y1.addr.type},
                        result: Y1.addr
                    })
                }
                return {nextlist: []}
            },
            // Ra -> ++ Y -> Ra2-244
            'Ra2-244': () => {
                let Y1 = symTop()
                if (Y1.err) {
                    return {symbol: Y1.symbol, err: Y1.err}
                }
                if (!isNaN(Y1.addr.id)) {
                    return {symbol: Y1, err: ` Invalid left-hand side expression in postfix operation`}
                }
                let tname = Y1.addr.type.name

                if (tname !== 'integer' && tname !== 'float' && tname !== 'short') {
                    symPop(2)
                    return {
                        flag: -2,
                        err: `can not ++ ${tname}`
                    }
                } else {
                    let Ra_addr = getTemp(Y1.addr)
                    /*
                    gen({
                        op: '++=',
                        arg1: Y1.addr,
                        result: Ra_addr
                    })
                    */
                    gen({
                        op: '+',
                        arg1: Y1.addr,
                        arg2: {id: '1', type: Y1.addr.type},
                        result: Y1.addr
                    })
                    gen({
                        op: '=',
                        arg1: Y1.addr,
                        result: Ra_addr
                    })
                    return {addr: Ra_addr}
                }
            },
            // Ra -> -- Y -> Ra3-244
            'Ra3-244': () => {
                let Y1 = symTop()
                if (Y1.err) {
                    return {symbol: Y1.symbol, err: Y1.err}
                }
                if (!isNaN(Y1.addr.id)) {
                    return {symbol: Y1, err: ` Invalid left-hand side expression in postfix operation`}
                }
                let tname = Y1.addr.type.name

                if (tname !== 'integer' && tname !== 'float' && tname !== 'short') {
                    symPop(2)
                    return {
                        flag: -2,
                        err: `can not -- ${tname}`
                    }
                } else {
                    let Ra_addr = getTemp(Y1.addr)
                    /*
                    gen({
                        op: '--=',
                        arg1: Y1.addr,
                        result: Ra_addr
                    })
                    */
                    gen({
                        op: '-',
                        arg1: Y1.addr,
                        arg2: {id: '1', type: Y1.addr.type},
                        result: Y1.addr
                    })
                    gen({
                        op: '=',
                        arg1: Y1.addr,
                        result: Ra_addr
                    })
                    return {addr: Ra_addr}
                }
            },
            // Ra -> Y ++ -> Ra4-244
            'Ra4-244': () => {
                let Y1 = symTop(1)
                if (Y1.err) {
                    return {symbol: Y1.symbol, err: Y1.err}
                }
                if (!isNaN(Y1.addr.id)) {
                    return {symbol: Y1, err: ` Invalid left-hand side expression in postfix operation`}
                }
                let tname = Y1.addr.type.name

                if (tname !== 'integer' && tname !== 'float' && tname !== 'short') {
                    symPop(2)
                    return {
                        flag: -2,
                        err: `can not ++ ${tname}`
                    }
                } else {
                    let Ra_addr = getTemp(Y1.addr)
                    /*
                    gen({
                        op: '=++',
                        arg1: Y1.addr,
                        result: Ra_addr
                    })
                    */
                    gen({
                        op: '=',
                        arg1: Y1.addr,
                        result: Ra_addr
                    })
                    gen({
                        op: '+',
                        arg1: Y1.addr,
                        arg2: {id: '1', type: Y1.addr.type},
                        result: Y1.addr
                    })
                    return {addr: Ra_addr}
                }
            },
            // Ra -> Y -- -> Ra5-244
            'Ra5-244': () => {
                let Y1 = symTop(1)
                if (Y1.err) {
                    return {symbol: Y1.symbol, err: Y1.err}
                }
                if (!isNaN(Y1.addr.id)) {
                    return {symbol: Y1, err: ` Invalid left-hand side expression in postfix operation`}
                }
                let tname = Y1.addr.type.name

                if (tname !== 'integer' && tname !== 'float' && tname !== 'short') {
                    symPop(2)
                    return {
                        flag: -2,
                        err: `can not -- ${tname}`
                    }
                } else {
                    let Ra_addr = getTemp(Y1.addr)
                    /*
                    gen({
                        op: '=--',
                        arg1: Y1.addr,
                        result: Ra_addr
                    })
                    */
                    gen({
                        op: '=',
                        arg1: Y1.addr,
                        result: Ra_addr
                    })
                    gen({
                        op: '-',
                        arg1: Y1.addr,
                        arg2: {id: '1', type: Y1.addr.type},
                        result: Y1.addr
                    })
                    return {addr: Ra_addr}
                }
            },
            // Y -> - Y -> Y1-244
            'Y1-244': () => {
                let Y1 = symTop()
                if (Y1.err) {
                    return {symbol: Y1.symbol, err: Y1.err}
                }
                let tname = Y1.addr.type.name

                if (tname !== 'integer' && tname !== 'float' && tname !== 'short') {
                    symPop(2)
                    return {
                        flag: -2,
                        err: `can not minus ${tname}`
                    }
                } else {
                    let Y_addr = getTemp(Y1.addr)
                    gen({
                        op: 'minus',
                        arg1: Y1.addr,
                        result: Y_addr
                    })
                    return {addr: Y_addr}
                }
            },
            // Y -> ( E ) -> Y2-244
            'Y2-244': () => {
                let E = symTop(1)
                if (E.err) {
                    return {symbol: E.symbol, err: E.err}
                }

                let addr = E.addr
                return {addr}
            },
            // Y -> num -> Y3-244
            'Y3-244': () => {
                let num = symTop()

                let addr = {
                    id: num.lexical,
                    type: getType('integer'),
                    width: typeWidth['integer'],
                }
                return {addr}
            },
            // Y -> Float -> Y4-244
            'Y4-244': () => {
                let Float = symTop()

                let addr = {
                    id: Float.lexical,
                    type: getType('float'),
                    width: typeWidth['float'],
                }
                return {addr}
            },
            // Y -> Char -> Y5-244
            'Y5-244': () => {
                let Char = symTop()

                let addr = {
                    id: Char.lexical,
                    type: getType('char'),
                    width: typeWidth['char']
                }
                return {addr}
            },
            // Y -> id -> Y6-244
            'Y6-244': () => {
                let id = symTop()


                // OLD !! 仅在当前环境的top符号表中查找
                // 递归查找
                let addr = getAddrFromTop(id, 1)
                if (addr)
                    return {addr}
                else {
                    // return {flag: -2, err: `${id.lexical} is not defined`}
                    return {symbol: id, err: `${id.lexical} is not defined`}
                }
            },
            // end of 244

            // start of 241
            // P -> nP1 D
            // nP1 -> nil -> nP1-241
            // 'nP1-241': () => {
            //     s_global['offset'] = 0
            // },
            // Da -> T id ; -> D1-241
            'D1-241': () => {
                let T = symTop(2)
                let id = symTop(1)

                let ifDef = getAddrFromTop(id)
                if (ifDef) {
                    symPop(3)
                    return {flag: -2, symbol: id, err: `${id.lexical} is already defined`}
                }
                // top 是p241 所说的符号表
                topPush({
                    id: id.lexical,
                    type: copy(T.type),
                    width: T.width,
                })
                addOffset(T.width)
                // s_global['offset'] = s_global['offset'] + T.width
            },
            // Da -> T idlist = E ; -> Da2-241
            'Da2-241': () => {
                let T = symTop(4)
                let idlist = symTop(3)
                let E = symTop(1)

                // 这部分和'D2-241'相同
                let idObj = {}
                for (let id of idlist.ids) {
                    if (!idObj[id.lexical])
                        idObj[id.lexical] = true
                    else {
                        symPop(5)
                        return {flag: -2, symbol: id, err: `${id.lexical} is already defined`}
                    }
                }
                for (let id of idlist.ids) {
                    let ifDef = getAddrFromTop(id)
                    if (ifDef) {
                        symPop(5)
                        return {flag: -2, symbol: id, err: `${id.lexical} is already defined`}
                    }
                }
                for (let id of idlist.ids) {
                    topPush({
                        id: id.lexical,
                        type: copy(T.type),
                        width: T.width
                    })
                    addOffset(T.width)
                }

                let id_addrs = idlist.ids.map((id, index) => {
                    // 因为是在定义时赋值, 因此只需要在当前环境查找
                    return getAddrFromTop(id)
                })

                // 这部分和'A1-244'类似
                if (E.err) {
                    symPop(5)
                    return {flag: -2, symbol: E.symbol, err: E.err}
                }
                let E_addr = E.addr
                let typeEq = typeEqual(id_addrs[0].type, E_addr.type)
                if (typeEq.flag !== 1) {
                    symPop(5)
                    return {flag: -2, symbol: idlist.ids[0], err: typeEq.err}
                }
                for (let id_addr of id_addrs) {
                    gen({
                        op: '=',
                        arg1: E_addr,
                        result: id_addr,
                    })
                }
            },
            // Da -> T idlist ; -> D2-241
            'D2-241': () => {
                let T = symTop(2)
                let idlist = symTop(1)
                // 检查idlist中是否有重复
                let idObj = {}
                for (let id of idlist.ids) {
                    if (!idObj[id.lexical]) 
                        idObj[id.lexical] = true
                    else {
                        symPop(3)
                        return {flag: -2, symbol: id, err: `${id.lexical} is already defined`}
                    }
                }
                // 检查id是否已经定义
                for (let id of idlist.ids) {
                    let ifDef = getAddrFromTop(id)
                    if (ifDef) {
                        symPop(3)
                        return {flag: -2, symbol: id, err: `${id.lexical} is already defined`}
                    }
                }
                for (let id of idlist.ids) {
                    // top 是p241 所说的符号表
                    topPush({
                        id: id.lexical,
                        type: copy(T.type),
                        width: T.width,
                    })
                    addOffset(T.width)
                }
            },
            // idlist -> idlist , id -> idlist2-241
            'idlist2-241': () => {
                let idlist1 = symTop(2)
                let id = symTop()
                let ids = idlist1.ids.concat([id])
                return {ids}
            },
            // idlist -> id -> idlist1-241
            'idlist1-241': () => {
                let id = symTop()
                let ids = [id]
                return {ids}
            },
            // end of 241

            // start of 240
            // T -> B nT1 C -> T-240
            // nT1 -> nil -> nT1-240
            'nT1-240': () => {
                s_global['t-t-240'] = symTop(1).type
                s_global['t-w-240'] = symTop(1).width
            },
            // T -> B nT1 C -> T-240
            'T-240': () => {
                let type = symTop().type
                let width = symTop().width
                return {type, width}
            },
            // B -> int -> B1-240
            'B1-240': () => {
                let type = getType('integer')
                let width = typeWidth['integer']
                return {type, width}
            },
            // B -> float -> B2-240
            'B2-240': () => {
                let type = getType('float')
                let width = typeWidth['float']
                return {type, width}
            },
            // B -> short -> B3-240
            'B3-240': () => {
                let type = getType('short')
                let width = typeWidth['short']
                return {type, width}
            },
            // B -> char -> B4-240
            'B4-240': () => {
                let type = getType('char')
                let width = typeWidth['char']
                return {type, width}
            },
            // B -> void -> B5-240
            'B5-240': () => {
                let type =getType('void')
                let width = typeWidth['void']
                return {type, width}
            },
            // C -> nil -> nC1-240
            // C -> [ num ] C -> C2-240
            'nC1-240': () => {
                let type = s_global['t-t-240']
                let width = s_global['t-w-240']
                return {type, width}
            },
            // C -> [ num ] C -> C2-240
            'C2-240': () => {
                let num = symTop(2)
                let C1 = symTop()

                let nvalue = num.lexical
                let width = nvalue * C1.width
                let type = array(nvalue, C1.type, C1.width)
                type.width = width
                return {type, width}
            },
            // end of 240

        }

        if (actObj[acType])
            return actObj[acType]()
        else 
            return {}
    }
}
