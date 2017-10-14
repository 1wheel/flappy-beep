#!/usr/bin/env node

var express = require('express')
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')
var SocketServer = require('ws').Server
var fs = require('fs')
var chokidar = require('chokidar')
var child = require('child_process')

// set up express static server with a websocket
var argv = require('minimist')(process.argv.slice(2))
var PORT = argv.port || 3989

var server = express()
  .use(serveStatic('./'))
  .use('/', serveIndex('./', {'icons': true}))
  .listen(PORT)
// server.on('listening', () => child.exec('open http://localhost:' + PORT))
  
process.on('uncaughtException', (err => 
  err.errno == 'EADDRINUSE' ? server.listen(++PORT) : 0)) //inc PORT if in use

var wss = new SocketServer({ server })
wss.on('connection', (ws) => {
  console.log('client connected')
  ws.on('close', () => console.log('client disconnected'))
})


// if a .js or .css files changes, load and send to client via websocket
chokidar.watch(['.'], {ignored: /node_modules|\.git|[\/\\]\./ }).on('all', function(event, path){
  if (event != 'change') return

  var str = fs.readFileSync(path, 'utf8')
  var path = '/' + path.replace(__dirname, '')

  var type = 'reload'
  if (path.includes('.js'))  type = 'jsInject'
  if (path.includes('.css')) type = 'cssInject'

  sendToAllClients({path, type, str})
})

// todo - only send to active clients that have loaded the linked file before
function sendToAllClients(msg){
  wss.clients.forEach(d => d.send(JSON.stringify(msg)))
}


console.log('hiii')
var i = 0
setInterval(() => {
  console.log(i)
  i++
  sendToAllClients({type: 'count', i})
}, 100)