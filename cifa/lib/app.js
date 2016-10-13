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

const DFA = path.resolve(__dirname, './DFAtable2.json')
const SOURCE = path.resolve(__dirname, 'source1.c')

read(DFA).then((config) => {
    read(SOURCE).then((source) => {
        try {
            lexicalCompile(config, source)   
        }
        catch (e) {
            console.log(e)
        }
    })
})
