const router = require('koa-router')()
const path = require('path')
const lexicalCompile = require(path.resolve(__dirname, '../lib/lexical.js')).lexicalCompile

router.get('/', function *(next) {
    this.body = 'Hello World@'
})

router.post('/', function *(next) {
    let body = this.request.body
    let res = lexicalCompile(body.config, body.source)
    this.body = res
})

module.exports = router
