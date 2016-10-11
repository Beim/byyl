const fs = require('fs')
const path = require('path')
const lexicalCompile = require('./lexical.js').lexicalCompile
const ifMatch = require('./lexical.js').ifMatch

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

let fpath = path.resolve(__dirname, 'config')

const CONFIG = path.resolve(__dirname ,'config.txt')
const DFA = path.resolve(__dirname, './DFAtable.json')
const SOURCE = path.resolve(__dirname, 'source.txt')

read('./DFAtable1.json').then((data) => {
    data = JSON.parse(data)
    data.priority = []
    for (let i = 0; i < 100; i++) {
        data.priority.push('' + i)
    }
    data = JSON.stringify(data, null, 4)
    fs.writeFile('./temp.out', data, (err) => {
        console.log(err)
    })
})

// read('./lex').then((data) => {
//     data = data.split('\n')
//     let newData = data.map((value, index) => {
//         index += 1
//         if (index < 10) index = '  ' + index
//         else if (index < 100) index = ' ' + index
//         return `${index}    ${value}`
//     }).join('\n')
//     fs.writeFile('./lex.out', newData, (err) => {
//         console.log(err)
//     })
// })

// read(DFA).then((config) => {
//     let str = '1'
//     let res = ifMatch(JSON.parse(config), str.split(''))
//     console.log(res)
// })

// read(DFA).then((config) => {
//     read(SOURCE).then((source) => {
//         lexicalCompile(config, source)
//     })
// })
