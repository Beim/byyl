const print = console.log.bind()

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
                if (type === '2') buffArr = ['\\n']
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
    for (let type of config.priority) {
        if (!config.accept[type]) {
            throw `配置文件错误, 缺少"${type}" 的DFA`
        }
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
    let sourceArr = source.split('')
    let [resArr, msgArr] = [[], []]
    let lexicalBegin = 0
    while (lexicalBegin < sourceArr.length) {
        let lexicalForward = lexicalBegin
        let tempRes = {}
        while (lexicalForward < source.length) {
            let buffArr = sourceArr.slice(lexicalBegin, lexicalForward)
            buffArr.push(sourceArr[lexicalForward])
            let matchRes = ifMatch(config, buffArr)
            if (matchRes.flag === 0) {
                tempRes = matchRes
                tempRes.forward = lexicalForward
                lexicalForward += 1
            } else if (matchRes.flag === 1) {
                lexicalForward += 1
            } else {
                break;
            }
        }
        let  [res, msg, forward] = [tempRes.res, tempRes.msg, tempRes.forward]
        if (tempRes.res) resArr.push({
            res: tempRes.res,
            type: tempRes.type,
            buffArr: tempRes.buffArr,
            begin: lexicalBegin,
            end: tempRes.forward
        })
        if (tempRes.msg) msgArr.push({
            msg: tempRes.res,
            type: tempRes.type,
            buffArr: tempRes.buffArr,
            begin: lexicalBegin,
            end: tempRes.forward
        })
        if (forward !== undefined) lexicalBegin = forward + 1
        else throw '配置文件错误: 未匹配'
    }

    let returnRes = ``
    let returnMsg = ``
    for (let i of resArr) {
        if (i.type === '2') i.buffArr = [' ']
        returnRes += `<    ${i.buffArr.join('')},    ${i.type},    ${i.begin},   ${i.end}    >\n\n`
        print(`<    ${i.buffArr.join('')},    ${i.type},    ${i.begin},   ${i.end}    >\n`)
    }
    for (let i of msgArr) {
        if (i.type === '2') i.buffArr = [' ']
        returnRes += `<    ${i.buffArr.join('')},    ${i.type},    ${i.begin},   ${i.end}    >\n\n`
        print(`<    ${i.buffArr.join('')},    ${i.type},    ${i.begin},   ${i.end}    >\n`)
    }
    return {returnRes, returnMsg}
}

module.exports = {
    lexicalCompile,
    ifMatch
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
