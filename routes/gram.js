const router = require('koa-router')()
const path = require('path')
const grammarCompile = require(path.resolve(__dirname, '../lib/yufa/app.js'))

router.get('/', function *(next) {
    this.body = 'Hello World@'
})

router.post('/', function *(next) {
    let body = this.request.body
    let res = grammarCompile(body.config, body.source)
    this.body = res
})

module.exports = router
