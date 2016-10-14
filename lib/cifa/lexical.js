const print = console.log.bind()

const transResToStr = (resArr, msgArr) => {
    let returnRes = ``
    let returnMsg = ``
    for (let i of resArr) {
        // 略过空格和换行
        if (i.type === '1' || i.type === '2') continue // i.buffArr = [' ']
        returnRes += `${i.buffArr.join('')}  <  ${i.type},  ${i.begin},  ${i.end}, ${i.line}  >\n`
        print(`${i.buffArr.join('')}  <  ${i.type},  ${i.begin},  ${i.end}, ${i.line}  >\n`)
    }
    print('-----分界线-----')
    for (let i of msgArr) {
        if (i.type === '1' || i.type === '2') i.buffArr = [' ']
        returnRes += `${i.buffArr.join('')}  <  ${i.type},  ${i.begin},  ${i.end}, ${i.line}  >\n`
        print(`${i.buffArr.join('')}  <  ${i.type},  ${i.begin},  ${i.end}, ${i.line}  >\n`)
    }
    return [returnRes, returnMsg]
}

/** 
 * move to the next state
 * @param config Object
 * @param state String
 * @param char String
 * @return nextState String
 */
const moveState = (config, state, char) => {
    if (config.body[state] && config.body[state][char]) {
        return config.body[state][char]
    } else {
        return null
    }
}

const ifTypeMatch = (config, type, buffArr) => {
    let state = config.start
    for (let c of  buffArr) {
        state = moveState(config, state, c)
        if (!state) break;
    }
    if (state && config.content.indexOf(state) > -1) {
        if (config.accept.indexOf(state) > -1) {
            if (config.error) {
                return {
                    flag: 0,
                    msg: `<${type}, ${buffArr.join('')}>`,
                    type
                }
            } else {
                // if (type === '2') buffArr = ['\\n']
                return {
                    flag: 0,
                    res: `<${type}, ${buffArr.join('')}>`,
                    type
                }
            }
        } else {
            return {flag: 1}
        }
    } else {
        return {flag: -1}
    }
}

/**
 * check if buffer matched 'source.txt')
 * @param config Object
 * @param buffArr Array
 * @return matchRes Object
 * @example
 * matchRes = {
 *  flag: 1,
 *  res: '',
 *  msg: '',
 *  state: ''
 * }
 */
const ifMatch = (config, buffArr) => {
    let flag = -1
    let result = {}
    // 按类型优先级顺序遍历匹配
    for (let type of config.priority) {
        if (!config.accept[type]) {
            throw `配置文件错误, 缺少"${type}" 的DFA`
        }
        // 以当前类型和相应配置进行匹配
        let matchResult = ifTypeMatch(config.accept[type], type, buffArr)
        if (matchResult.flag === 0) {
            result = matchResult
            flag = matchResult.flag
            break;
        } else if (matchResult.flag === 1) {
            flag = matchResult.flag
        }
    }
    return {
        flag,
        res: result.res,
        msg: result.msg,
        type: result.type,
        buffArr
    }
}

const lexicalCompile = (config, source) => {
    config = JSON.parse(config)
    let sourceArr = source.split('') // 将被分析的字符串切分为字符数组
    let line = 0 // 记录行数
    let [resArr, msgArr, allArr] = [[], [], []] // resArr 为分析正确的信息, msgArr 为分析错误的信息, allArr 为全部的原始信息
    let lexicalBegin = 0 // 设置词法分析的开始位置0
    while (lexicalBegin < sourceArr.length) {
        let tempRes = {} // 记录分析正确或错误的信息, 只记录最长匹配的信息
        // 以lexicalBegin 位置为开始位置, 向前读取字符并匹配
        let lexicalForward = lexicalBegin
        while (lexicalForward < source.length) {
            // 取得尝试匹配的字符串数组, 范围[lexicalBegin, lexicalForward]
            let buffArr = sourceArr.slice(lexicalBegin, lexicalForward)
            buffArr.push(sourceArr[lexicalForward])
            // 传入配置和字符串数组, 获得匹配结果
            let matchRes = ifMatch(config, buffArr)
            if (matchRes.flag === 0) { // 匹配成功, 继续向前寻找更长的串
                tempRes = matchRes
                tempRes.end = lexicalForward
                lexicalForward += 1
            } else if (matchRes.flag === 1) { // 匹配不成功, 但是读取更长的串可能成功, 继续向前看
                lexicalForward += 1
            } else { // 匹配失败, 且不能匹配到更长的串
                break;
            }
        }
        // 匹配到类型2, 即换行符, 将行数加一
        if (tempRes.type === "2") 
            ++line;
        tempRes.line = line
        tempRes.begin = lexicalBegin
        // 保存当前匹配信息
        allArr.push(tempRes)
        if (tempRes.msg)
            msgArr.push(tempRes)
        else 
            resArr.push(tempRes)
        // 若end 存在则将begin 前移 , 否则表示出现预料之外的匹配错误
        if (tempRes.end !== undefined) 
            lexicalBegin = tempRes.end + 1
        else 
            throw '配置文件错误: 未匹配'
    }

    let [returnRes, returnMsg] = transResToStr(resArr, msgArr)
    return {returnRes, returnMsg, resArr, msgArr, allArr}
}

module.exports = {
    lexicalCompile,
}

// const insertScript = (config) => {
//     let script = `<script>${config.publicFunc}</script>`
//     let newItem = document.createElement('script')
//     let textNode = document.createTextNode(config.publicFunc)
//     newItem.appendChild(textNode)
//     let text = `var actions = {};\n`
//     for (let i in config.actions) {
//         text += `actions['${i}'] = (...args) => {${config.actions[i]}};\n`
//     }
//     textNode = document.createTextNode(text)
//     newItem.appendChild(textNode)
//     document.body.insertBefore(newItem, document.body.firstChild)
// }

// const lexicalCompile  = (config, source) => {
//     config = parseConfig(config)
//     var script = injectConfig(config)
//     eval(script)
// 
//     return {lexicalCompiled: true, message: false}
// }


// let keys = {
//     delim: '[ \t\n]',
//     ws: '{delim}+',
//     letter: '[A-Za-z]',
//     digit: '[0-9]',
//     id: '{letter}({letter}|{digit})*',
// }
// let keySequence = ['delim', 'ws', 'letter', 'digit', 'id']


// /**
//  * recursivly replace keys
//  * @param keys Object
//  * @param keySequence Array
//  * return keys Object
//  */
// const recurseParseKeys = (keys, keySequence) => {
//     const patt = /\{[^\{]+\}/g
//     const pattng = /\{[^\{]*\}/
//     for (let i in keySequence) {
//         let matchedArr = keys[keySequence[i]].match(patt)
//         if (!matchedArr) continue;
//         for (let j of matchedArr) {
//             let matchKey = j.slice(1, -1)
//             let frontArr = keySequence.slice(0, i)
//             if (frontArr.find(elem => elem === matchKey)) {
//                 keys[keySequence[i]] = keys[keySequence[i]].replace(pattng, keys[matchKey])
//             }
//         }
//     }
//     return keys
// }
// recurseParseKeys(keys, keySequence)

// /**
//  * parse file to Object
//  * @param file String
//  * @return Object
//  */
// const parseConfig = (file) => {
//     let confArr = file.split('\n\n%%\n\n')
//     if (confArr.length < 3)
//         return {
//             flag: false,
//             msg: '配置文件错误'
//         }
//     let publicFunc = confArr[0]
//     let keysArr = confArr[1].split('\n---\n')
//     let actionsArr = confArr[2].split('\n---\n')
//     let length = keysArr.length
//     if (length % 2 !== 0)
//         return {
//             flag: false,
//             msg: '关键字错误'
//         }
//     let keys = {}
//     let keySequence = []
//     for (let i = 0; i < length; i += 2) {
//         keys[keysArr[i]] = keysArr[i + 1]
//         keySequence.push(keysArr[i])
//     }
//     keys = recurseParseKeys(keys, keySequence)
//     length = actionsArr.length
//     if (length % 2 !== 0) {
//         return {
//             flag: false,
//             msg: '匹配操作错误'
//         }
//     }
//     let actions = {}
//     for (let i = 0; i < length; i += 2) {
//         if (!keys[actionsArr[i]]) 
//             return {
//                 flag: false,
//                 msg: `未匹配关键字: ${actionsArr[i]}`
//             }
//         actions[actionsArr[i]] = actionsArr[i + 1]
//     }
//     return {
//         publicFunc,
//         keys,
//         keySequence,
//         actions,
//     }
// }


// /**
//  * use eval to inject config
//  * @param config Object
//  */
// const injectConfig = (config) => {
//     var script = `${config.publicFunc}\n`
//     script += `var actions = {}\n`
//     for (let i in config.actions) {
//         script += `actions['${i}'] = (...args) => {${config.actions[i]}};\n`
//     }
//     return script
// }


/**
 * find the most suitable one from the resArr
 * @param config Object
 * @param resArr Array
 * @return [res(''), msg(''), forward(Integer)] Array
 * principle: 
 * 1. always choose the longest prefix
 * 2. if multiple prefix, choose the priority
 */
// const tempResFilter = (config, resArr) => {
//     let longest = 0
//     for (let i of resArr) {
//         if (i.forward > longest) longest = i.forward
//     }
//     let longResArr = resArr.filter((elem) => {
//         return elem.forward >= longest
//     })
//     if (longResArr.length > 1) {
//         longResArr.sort((a, b) => {
//             let prioA = config.acceptPrio.indexOf(a.state)
//             let prioB = config.acceptPrio.indexOf(b.state)
//             if (prioA > -1 && prioB > -1) {
//                 return prioA - prioB
//             } else {
//                 throw 'acceptPrio error'
//             }
//         })
//     }
//     return [longResArr[0].res, longResArr[0].msg, longResArr[0].forward]
// }
