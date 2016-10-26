const fs = require('fs')
const path = require('path')
const lexicalCompile = require('./lexical.js').lexicalCompile

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

const DFA = path.resolve(__dirname, process.argv[2] || 'DFAtable3.json')
const SOURCE = path.resolve(__dirname, process.argv[3] || 'source.c')

read(DFA).then((config) => {
    read(SOURCE).then((source) => {
        try {
            let res = lexicalCompile(config, source)   
            for (let i in res) {
                console.log(i)
            }
            console.log(res.resArr)
        }
        catch (e) {
            console.log(e)
        }
    })
})
