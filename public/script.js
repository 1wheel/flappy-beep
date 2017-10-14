console.clear()
console.log('updating code', new Date())

d3.select('body').selectAppend('div.tooltip')

var sel = d3.select('.graph').html('')
var c = d3.conventions({sel, height: innerHeight, layers: 'dc', margin: {left: 0, top: 0, right: 0, bottom:0 }})

var {width, height, layers: [div, ctx]} = c
var textSel = div.append('div.score')

var s = .1  // block size
var spawnY = 1  
var gravity = .000036
var jumpAccel = -.023

var id = id || Math.random() + ''

if (!birds){
  var birds = {}
  birds[id] = {
    score: 0,
    y: spawnY,
    dy: 0,
    color: "#"+((1<<24)*Math.random()|0).toString(16),
    id
  }
}
var myBird = birds[id]


var topBlocks = topBlocks || d3.range(4).map(i => [.2, s*i])
var botBlocks = botBlocks || d3.range(4, 10).map(i => [.6, s*i])
var blocks = blocks || topBlocks.concat(botBlocks)

topBlocks.forEach((d, i) => {
  d[1] = .7 + i*s
})
botBlocks.forEach((d, i) => {
  d[1] = .7 + i*s
})

var oldT = 0
if (window.timer) timer.stop()
timer = d3.timer(t => {
  var dt = t - oldT
  oldT = t

  ctx.clearRect(0, 0, width, height)

  ctx.beginPath()
  ctx.fillStyle = '#0ff'
  blocks.forEach(d => {
    d[0] += dt*-.0001
    if (d[0] < -s) d[0] = 1
    ctx.rect(d[0]*width, d[1]*height, s*.9*width, s*.9*height)
  })
  ctx.fill()


  d3.values(birds).forEach(d => {
    var isMe = d == myBird

    d.score++

    d.hit = false
    blocks.forEach(block => {
      var yDif = d.y - block[1]
      if (block[0] < s && -s < yDif && yDif < s) d.hit = true
    })
    if (d.hit){
      d.y = spawnY
      d.dy = 0
      d.score = 0
    }

    d.dy += gravity*dt
    d.y  +=  d.dy
    d.y = d3.clamp(-1, d.y, 1 - s)
    if (d.y == 1 - s) d.dy = Math.max(d.dy, 0) 
    
    ctx.beginPath()
    ctx.fillStyle = d.color
    ctx.rect(s*.1*width, d.y*height, s*.9*width, s*.9*height)
    ctx.fill()

    if (d == myBird){
      textSel.text(d.score)

      ctx.beginPath()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 10
      ctx.rect(s*.1*width, d.y*height, s*.9*width, s*.9*height)
      ctx.stroke()
    }
  })

})


d3.select(window).on('mousedown touchstart', _.throttle(() => {
  if (myBird.y < 0) return
  if (myBird.hit) return
  myBird.dy = jumpAccel

  ws.send(JSON.stringify(myBird))
}, 500, {trailing: false}))




function wsMessage(msg){
  // console.log(msg)

  if (msg.bird && msg.bird.id == id) return

  if (msg.type == 'jump'){
    if (!birds[msg.bird.id]) birds[msg.bird.id] = msg.bird
    birds[msg.bird.id].dy = jumpAccel
  }
  if (msg.type == 'died') delete birds[msg.bird.id]
}