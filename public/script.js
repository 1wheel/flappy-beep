console.clear()

d3.select('body').selectAppend('div.tooltip')

var sel = d3.select('.graph').html('')
var c = d3.conventions({sel, height: innerHeight, layers: 'dc', margin: {left: 0, top: 0, right: 0, bottom:0 }})

var {width, height, layers: [div, ctx]} = c
var textSel = div.append('div.score')

var s = .1
var score = 0
var bY = .5
var bDY = 0
var gravity = .000036


var topBlocks = d3.range(4).map(i => [.2, s*i])
var botBlocks = d3.range(4, 10).map(i => [.6, s*i])
var blocks = topBlocks.concat(botBlocks)

var oldT = 0
if (window.timer) timer.stop()
timer = d3.timer(t => {
  var dt = t - oldT
  oldT = t

  ctx.clearRect(0, 0, width, height)

  ctx.beginPath()
  ctx.fillStyle = '#0f0'
  blocks.forEach(d => {
    d[0] += dt*-.0001
    if (d[0] < -s) d[0] = 1
    ctx.rect(d[0]*width, d[1]*height, s*.9*width, s*.9*height)
  })
  ctx.fill()


  score++

  var hit = false
  blocks.forEach(d => {
    var dy = bY - d[1]
    if (d[0] < s && -s < dy && dy < s) hit = true
  })
  if (hit){
    console.log('hit')
    bY = .5
    bDY = 0
    score = 0
  }

  textSel.text(score)
  bDY += gravity*dt
  bY  +=  bDY
  bY = d3.clamp(-1, bY, 1 - s)
  if (bY == 1 - s) bDY = Math.max(bDY, 0) 

  ctx.beginPath()
  ctx.fillStyle = '#f0f'
  ctx.rect(s*.1*width, bY*height, s*.9*width, s*.9*height)
  ctx.fill()
})


d3.select(window).on('mousedown touchstart', () => {
  if (bY < 0) return
  bDY = -.02
})