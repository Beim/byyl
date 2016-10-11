'use strict'
let str = `
var ha = () => {
    console.log('haha')
}
ha()
`

eval(str)
console.log(ha)
