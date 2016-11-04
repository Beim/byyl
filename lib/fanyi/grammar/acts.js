const top = (arr, num) => {
    return arr[arr.length - num]
}

module.exports = (type) => {
    return (s_global, stack, symbols) => {
        const actObj = {
            't_M': () => {
                console.log('+')
            },
            't_N': () => {
                console.log('*')
            },
            't_O': () => {
                console.log(top(symbols, 1).lexical)
            }
        }

        if (actObj[type])
            return actObj[type]()
        else 
            return {}
    }
}
