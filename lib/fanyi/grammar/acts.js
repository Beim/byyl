const copy = (obj) => JSON.parse(JSON.stringify(obj))
const print = console.log.bind()
const print_j = (obj, num = 2) => console.log(JSON.stringify(obj, null, num))

const top = (arr, num = 0) => {
    return arr[arr.length - 1 - num]
}

const newAd = ((add = 100) => {
    return () => {
        return add++
    }
})()

/*
 * @param type String
 * @param obj Object
 * @return Object
 * {
 *  name: type,
 *  ...obj
 * }
 */
const getType = (type, obj = {}) => Object.assign(copy(obj), {name: type})

/*
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
const array = (value, type) => getType('array', {sub: {value, type}})

let S_next = 200

module.exports = (acType) => {
    return (s_global, stack, symbols) => {
        const symTop = (num = 0) => {
            return symbols[symbols.length - 1 - num]
        }
        const actObj = {
            /*
             * 240 
             */
            't-nT1-240': () => {
                s_global['t-t-240'] = symTop(1).type
                s_global['t-w-240'] = symTop(1).width
            },
            't-nT-240': () => {
                let type = symTop().type
                let width = symTop().width
                return {type, width}
            },
            't-nB1-240': () => {
                let type = getType('integer')
                let width = 4
                return {type, width}
            },
            't-nB2-240': () => {
                let type = getType('float')
                let width = 8
                return {type, width}
            },
            't-nC1-240': () => {
                let type = s_global['t-t-240']
                let width = s_global['t-w-240']
                return {type, width}
            },
            't-nC2-240': () => {
                let nvalue = symTop(2).lexical
                let type = array(nvalue, symTop().type)
                let width = nvalue * symTop().width
                return {type, width}
            },

        }

        if (actObj[acType])
            return actObj[acType]()
        else 
            return {}
    }
}
