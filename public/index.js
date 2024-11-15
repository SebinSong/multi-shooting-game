let canvas
let c // 2d context

// Player related
let player

// Projectiles
let projectiles = []

// Particles
let particleGroups = []

// misc
let isTabActive = true
let requestId = null

// DOM elements
let domRegistered = false
const scoreHandler = {
  boardEl: null,
  el: null,
  difficultyEl: null,
  currentScore: 0,
  get level () {
    return this.currentScore > 800
      ? 'very-hard' // difficulty - very hard
      : this.currentScore > 500
        ? 'hard' // difficulty - hard
        : this.currentScore > 300
          ? 'medium' // difficulty - medium
          : 'easy' // difficulty - normal
  },
  setScore (score) {
    this.currentScore = score
    this.updateDom()
  },
  add (value) {
    this.currentScore += value
    this.updateDom()
  },
  reset () {
    this.currentScore = 0
    this.updateDom()
  },
  updateDom () {
    if (this.el) {
      this.el.textContent = this.currentScore
      this.difficultyEl.textContent = this.level.replace('-', ' ')
    }
  },
  hide () {
    this.boardEl.style.display = 'none'
  },
  show () {
    this.boardEl.style.display = 'flex'
  },
  getEnemyVelocity () {
    return ({
      'very-hard': 1.75,
      'hard': 1.4,
      'medium': 1,
      'easy': 0.75
    })[this.level]
  },
  getEnemySpawnDelay () {
    return ({
      'very-hard': 1100,
      'hard': 1300,
      'medium': 1500,
      'easy': 1800
    })[this.level]
  }
}

const gameOverHandler = {
  panelEl: null,
  pointEl: null,
  show () {
    this.pointEl.textContent = scoreHandler.currentScore
    this.panelEl.style.display = 'flex'
  },
  hide () {
    this.pointEl.textContent = '-'
    this.panelEl.style.display = 'none'
  }
}


// constants
const PLAYER_RADIUS = 15
const PROJECTILE_RADIUS = 5
const PROJECTILE_VELOCITY_MAGNITUDE = 4
const MAX_VELOCITY = 15
const ACCEL_FACTOR = 1.0625
const PARTICLE_NUMBERS = 8
const POINT_HIT = 2
const POINT_KILL = 5

const colors = {
  bg: '#253C59',
  player_bg: '#D8D9D7',
  projectile_bg: '#D8D9D7',
  enemy_colorset: ['#618C03', '#F2B705', '#D97904', '#D92B04', '#F27983']
}


// player class
class ObjectCircle {
  constructor ({ x, y, radius, color } = {}) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
  }

  draw () {
    c.save()
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
    c.restore()
  }

  setPosition (x, y) {
    this.x = x
    this.y = y
  }

  get isInCanvas () {
    return this.x >= 0 &&
      this.x <= canvas.width &&
      this.y >= 0 &&
      this.y <= canvas.height
  }

  overlaps (circle) {
    const [dx, dy] = [
      circle.x - this.x,
      circle.y - this.y
    ]
    const distCenters = Math.hypot(dx, dy)

    return distCenters < (this.radius + circle.radius)
  }
}

class Velocity {
  constructor (x, y) {
    this.x = x
    this.y = y
  }

  get magnitude () {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  accelerate () {
    if (this.magnitude === MAX_VELOCITY) { return }
    else if (this.magnitude > MAX_VELOCITY) {
      const f = MAX_VELOCITY / this.magnitude
      this.x *= f
      this.y *= f
    } else {
      this.x *= ACCEL_FACTOR
      this.y *= ACCEL_FACTOR
    }
  }
}

class Player extends ObjectCircle {
  constructor (args = {}) {
    super(args)
  }

  update () {
    this.draw()
  }
}

class ProjectTile extends ObjectCircle {
  constructor (args = {}) {
    super(args)
    this.velocity = args.velocity || new Velocity(0, 0)
    this.id = randomHexString()
  }

  update () {
    if (!this.isInCanvas) {
      this.remove()
      return
    }

    this.velocity.accelerate()
    this.x += this.velocity.x
    this.y += this.velocity.y

    this.draw()
  }

  remove () {
    const index = projectiles.findIndex(entry => entry.id === this.id)
    projectiles.splice(index, 1)
  }
}

class ParticlePiece extends ObjectCircle {
  constructor (args = {}) {
    super(args)
    this.velocity = args.velocity || new Velocity(0, 0)
    this.id = randomHexString()
    this.parent = args.parent || null
  }

  update () {
    if (!this.isInCanvas) {
      this.remove()
      return
    }

    this.x += this.velocity.x
    this.y += this.velocity.y

    this.velocity.x *= 0.935
    this.velocity.y *= 0.935

    this.radius -= 0.075

    if (this.radius < 0.5) {
      this.remove()
    } else {
      this.draw()
    }
  }

  remove () {
    this.parent.removeParticle(this.id)
  }
}

class ParticleGroup {
  constructor (args = {}) {
    this.particles = []
    this.id = randomHexString()

    const { num: particleNumbers, rRange } = this.getParticleDetails(args.hitRadius)
    for (let i = 0; i < particleNumbers; i++) {
      this.particles.push(
        new ParticlePiece({
          x: args.x, y: args.y,
          color: args.color,
          radius: 1.5 + Math.random() * rRange,
          velocity: this.getRandomParticleVelocity(),
          parent: this
        })
      )
    }
  }

  getParticleDetails (hitRadius = 15) {
    const size = hitRadius > 30
      ? 'big'
      : hitRadius > 20
        ? 'medium'
        : 'small'

    switch (size) {
      case 'big':
        return { num: 12, rRange: 7.5 }
      case 'medium':
        return { num: 9, rRange: 5 }
      default:
        return { num: 6, rRange: 2.5 }
    }
  }

  getRandomParticleVelocity () {
    const angle = Math.random() * (Math.PI * 2)
    const vMag = 3 + 5 * Math.random() 
    const vx = vMag * Math.cos(angle)
    const vy = vMag * Math.sin(angle)

    return new Velocity(vx, vy)
  }

  update () {
    if (this.particles.length === 0) {
      this.remove()
    } else {
      this.particles.forEach(particle => particle.update())
    }
  }

  removeParticle (particleId) {
    this.particles = this.particles.filter(p => p.id !== particleId)
  }

  remove () {
    particleGroups = particleGroups.filter(group => group.id !== this.id)
  }
}

function initDOM () {
  if (!domRegistered) {
    domRegistered = true
    scoreHandler.boardEl = document.querySelector('#score-board')
    scoreHandler.el = scoreHandler.boardEl.querySelector('#score-value')
    scoreHandler.difficultyEl = scoreHandler.boardEl.querySelector('#difficulty-value')
    gameOverHandler.panelEl = document.querySelector('#game-over')
    gameOverHandler.pointEl = document.querySelector('#game-over #point-value')

    const restartBtn = gameOverHandler.panelEl.querySelector('#restart-button')
    restartBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      startGame()
    })
  }

  // init canvas
  if (!canvas) {
    canvas = document.querySelector('#canvas')
    c = canvas.getContext('2d')
  }

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function initObjects () {
  // create the player
  const pCenter = getPageCenter()
  player = new Player({
    x: pCenter.x,
    y: pCenter.y,
    radius: PLAYER_RADIUS,
    color: colors.player_bg
  })

  // flush projectiles
  projectiles = []
  particleGroups = []
}

function paintBackground () {
  c.save()
  c.fillStyle = colors.bg
  c.fillRect(0, 0, canvas.width, canvas.height)
  c.restore()
}

function endGame () {
  window.cancelAnimationFrame(requestId)

  paintBackground()
  scoreHandler.hide()
  gameOverHandler.show()
}

function startGame () {
  initObjects()

  // game-over panel
  gameOverHandler.hide()

  // score-board
  scoreHandler.reset()
  scoreHandler.show()

  animate()
}

function animate () {
  requestId = window.requestAnimationFrame(animate)
  // clear canvas
  paintBackground()

  // Draw objects
  player.update()
  projectiles.forEach(projectile => projectile.update())
  particleGroups.forEach(group => group.update())
}

// event handlers
function onResize () {
  initDOM()
  initObjects()
}

function onClick (e) {
  const center = getPageCenter()
  const angle = getAngle(center, { x: e.clientX, y: e.clientY })
  const vx = PROJECTILE_VELOCITY_MAGNITUDE * Math.cos(angle)
  const vy = PROJECTILE_VELOCITY_MAGNITUDE * Math.sin(angle)

  const projectile = new ProjectTile({
    x: center.x, y: center.y,
    radius: PROJECTILE_RADIUS,
    color: colors.projectile_bg,
    velocity: new Velocity(vx, vy)
  })

  projectiles.push(projectile)
}

function setupEvents () {
  window.addEventListener('resize', onResize)
  window.addEventListener('click', onClick)
  window.addEventListener('blur', () => { isTabActive = false })
  window.addEventListener('focus', () => { isTabActive = true })
}

// helpers
function getPageCenter () {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2
  }
}

function randomFromArray (array) {
  const index = Math.floor(Math.random() * array.length)
  return array[index]
}

function randomHexString (len = 10) {
  const n = Math.floor(Math.random() * Math.pow(10, len + 1))
  return n.toString(16)
}

function radianToDegree (rad) {
  return rad * 180 / Math.PI
}

function randomSign () {
  return Math.random() > 0.5 ? 1 : -1
}

function getAngle (p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  
  return Math.atan2(dy, dx)
}

function randomIntBetweenRange (a, b) {
  const d = b - a
  return a + Math.ceil(d * Math.random())
}

initDOM()
setupEvents()
startGame()