console.clear()


d3.select('body').selectAppend('div.tooltip')

var sel = d3.select('.graph').html('')
var c = d3.conventions({sel, height: innerHeight, layers: 'dc', margin: {left: 0, top: 0, right: 0, bottom:0 }})

var {width, height, layers: [div, ctx]} = c
var textSel = div.append('div.score')

var s = .1  // block size
var spawnY = .5   
var gravity = .000036

var id = id || Math.random() + ''

if (!birds){
  var birds = {}
  birds[id] = {
    score: 0,
    y: spawnY,
    dy: 0,
    id
  }
}
var myBird = birds[id]


var topBlocks = d3.range(4).map(i => [.2, s*i])
var botBlocks = d3.range(4, 10).map(i => [.6, s*i])
var blocks = blocks || topBlocks.concat(botBlocks)

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
    d.score++

    var hit = false
    blocks.forEach(block => {
      var yDif = d.y - block[1]
      if (block[0] < s && -s < yDif && yDif < s) hit = true
    })
    if (hit){
      d.y = spawnY
      d.dy = 0
      d.score = 0
    }

    d.dy += gravity*dt
    d.y  +=  d.dy
    d.y = d3.clamp(-1, d.y, 1 - s)
    if (d.y == 1 - s) d.dy = Math.max(d.dy, 0) 
    
    ctx.beginPath()
    ctx.fillStyle = '#f00'
    ctx.rect(s*.1*width, d.y*height, s*.9*width, s*.9*height)
    ctx.fill()

    if (d == myBird){
      textSel.text(d.score)
    }
  })

})


d3.select(window).on('mousedown touchstart', () => {
  if (myBird.y < 0) return
  myBird.dy = -.02

  d3.event.preventDefault()

  // post
})




function wsMessage(msg){
  console.log(msg)
}