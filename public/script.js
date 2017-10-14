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
var jumpAccel = -.015

var id = id || Math.random() + ''

if (!birds){
  var birds = {}
  birds[id] = {
    score: 0,
    y: spawnY,
    dy: 0,
    color: "#"+((1<<24)*Math.random()|0).toString(16),
    freqIndex: 0,
    id
  }
}
var myBird = birds[id]

var scoreToVolume = d3.scaleLinear().domain([0, 100])

var b0 = b0 || d3.range(3, 7) .map(i => [0/3, s*i])
var b1 = b1 || d3.range(0, 4) .map(i => [1/3, s*i])
var b2 = b2 || d3.range(4, 10).map(i => [2/3, s*i])
var blocks = blocks || _.flatten([b0, b1, b2])

// b0.forEach((d, i) =>{ d[1] = .9+ i*s; d[0] = 0/3 })
// b1.forEach((d, i) =>{ d[1] = .8+ i*s; d[0] = 1/3 })
// b2.forEach((d, i) =>{ d[1] = .7+ i*s; d[0] = 2/3 })


// var blocks = d3.range(20).map(i => {
//   return [i/20, ((31 - i*2) % 20)/20]
// })


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
    if (d[0] < -s){
      d[0] = 1
      playNote(d, 'wrap')
    }
    ctx.rect(d[0]*width, d[1]*height, s*.9*width, s*.9*height)
  })
  ctx.fill()


  d3.values(birds).forEach(d => {
    var isMe = d == myBird

    var freqIndex = Math.round(d.y*10)
    if (freqIndex != d.freqIndex){
      d.freqIndex = freqIndex
      playNote(d, 'ypos')
    }

    d.score++
    var wasHit = d.hit
    d.hit = false
    blocks.forEach(block => {
      var yDif = d.y - block[1]
      if (block[0] < s && -s < yDif && yDif < s) d.hit = true
    })
    if (d.hit){
      if (!wasHit){
        playNote(d, 'hit')
        d.dy = 0
        d.score = 0
        d.y = spawnY
      }

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
      textSel.append('div.url')
        .text('roadtolarissa.com/flappy-beep')

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
  // if (myBird.hit) return
  myBird.dy = jumpAccel

  ws.send(JSON.stringify(myBird))
}, 300, {trailing: false}))




function wsMessage(msg){
  // console.log(msg)

  if (msg.bird && msg.bird.id == id) return

  if (msg.type == 'jump'){
    if (!birds[msg.bird.id]) birds[msg.bird.id] = msg.bird
    birds[msg.bird.id].dy = jumpAccel
  }
  if (msg.type == 'died') delete birds[msg.bird.id]
}

var pitches = [523.26, 493.88, 440, 392, 349.22, 329.62, 293.66, 261.63, 246.94, 220, 196, 174.61, 164.81, 146.83, 130.81]

function playNote(d, type){
  volume = d3.clamp(0, 1, scoreToVolume(d.score))

  var frequency = pitches[d.freqIndex]
  var waveform = type == 'ypos' ? 'sawtooth' : 'sine'
  if (type == 'wrap'){
    frequency = pitches[Math.round(d[1]/s/2)]
    frequency = 100
    volume = 1
  }

  var decay = .2

  if (type == 'hit'){
    decay = 1
  }

  if (!frequency || !volume) return
  soundEffect(
    frequency,      // frequency
    0,              // attack
    decay,          // decay
    waveform,       // waveform sine sawtooth
    1,              // volume
    0,              // pan
    0,              // wait before playing
    .4,             // pitch bend amount
    false,          // reverse bend
    0,              // random pitch range
    1               // dissonance
    // [0.2, 0.2, 2000], //echo array: [delay, feedback, filter] [0.2, 0.2, 2000]         //reverb array: [duration, decay, reverse?]
  )
}
