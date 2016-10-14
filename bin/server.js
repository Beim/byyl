const app = require('../app')
const http = require('http')

const normalizePort = (val) => {
    const port = parseInt(val, 10)
    if (isNaN(port)) {
        // named pipe
        return val
    }
    if (port >= 0) {
        // port number
        return port
    }
    return false
}

const port = normalizePort(process.env.PORT || '2333')
const server = http.createServer(app.callback())

server.listen(port)