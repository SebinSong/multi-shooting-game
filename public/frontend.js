// Player related
let frontendPlayers = {}
let myPlayer = null
const playerInputs = []
let sequenceNumber = 0

// Projectiles
let frontendProjectiles = {}

// Particles
let particleGroups = []

// misc
let isTabActive = true
let requestId = null
let keyboardIntervalId = null

// socket
const socket = io()

// socket-events
const INIT_CANVAS = 'init-canvas'
const UPDATE_PLAYERS = 'update-players'
const UPDATE_PROJECTILES = 'update-projectiles'
const PLAYER_DISCONNECTED = 'player-disconnected'
const KEYDOWN = 'keydown'
const PROJECTILE_FIRED = 'projectile-fired'

// DOM-related
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

const keyboardTracker = {
  up: false,
  down: false,
  left: false,
  right: false
}

// constants
const PROJECTILE_RADIUS = 5
const PROJECTILE_VELOCITY_MAGNITUDE = 4
const PARTICLE_NUMBERS = 8
const POINT_HIT = 2
const POINT_KILL = 5
const PLAYER_SPEED = 3
const MAX_PLAYERS = 5

const colors = {
  bg: '#253C59',
  player_bg: '#D8D9D7',
  projectile_bg: '#D8D9D7',
  projectile_colors: {
    mine: '#D8D9D7',
    enemy: '#FFFFFF',
    default: '#FFFFFF'
  },
  player_colorset: ['#618C03', '#E51C1F', '#F2B705', '#D97904', '#D92B04', '#F27983']
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

  // scaling the canvas based on the device pixel ratio
  // reference: https://stackoverflow.com/questions/53233096/how-to-set-html5-canvas-size-to-match-display-size-in-device-pixels
  canvas.width = window.innerWidth * devicePixelRatio
  canvas.height = window.innerHeight * devicePixelRatio
  canvas.dataset.initialized = true
  c.scale(devicePixelRatio, devicePixelRatio)

  emitInitCanvas()
}

function emitInitCanvas () {
  if (socket.connected && canvas.dataset.initialized) {
    socket.emit(INIT_CANVAS, { width: canvas.width / devicePixelRatio, height: canvas.height / devicePixelRatio })
  }
}

function initObjects () {
  // create the player
  const pCenter = getPageCenter()

  // flush projectiles
  frontendProjectiles = {}
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
  window.clearInterval(keyboardIntervalId)

  paintBackground()
  scoreHandler.hide()
  gameOverHandler.show()
}

function startGame () {
  initObjects()

  // game-over panel
  gameOverHandler.hide()

  // score-board
  // scoreHandler.reset()
  // scoreHandler.show()
  scoreHandler.hide()

  animate()
  keyboardIntervalId = setInterval(() => {
    checkKeyboardEvents()
  }, 15)
}

function checkKeyboardEvents () {
  if (!myPlayer) { return }

  const { up, left, down, right } = keyboardTracker
  const xVal = (left ? -1: 0) + (right ? 1 : 0)
  const yVal = (up ? -1 : 0) + (down ? 1 : 0)

  if (xVal === 0 && yVal === 0) { return }

  sequenceNumber++
  const playload = { x: xVal, y: yVal, sequenceNumber }
  socket.emit(KEYDOWN, playload)
  playerInputs.push(playload)

  myPlayer.x += xVal * PLAYER_SPEED
  myPlayer.y += yVal * PLAYER_SPEED


}

function animate () {
  requestId = window.requestAnimationFrame(animate)
  // clear canvas
  paintBackground()

  // render players
  Object.values(frontendPlayers).forEach(player => player.update())

  // render projectiles
  Object.values(frontendProjectiles).forEach(projectile => projectile.update())
}

// ---------------- DOM event handlers ----------------

function onResize () {
  initDOM()
  initObjects()
}

function onWindowClick (e) {
  const center = { x: myPlayer.x, y: myPlayer.y }
  const angle = getAngle(center, { x: e.clientX, y: e.clientY })
  const vx = PROJECTILE_VELOCITY_MAGNITUDE * Math.cos(angle)
  const vy = PROJECTILE_VELOCITY_MAGNITUDE * Math.sin(angle)

  socket.emit(PROJECTILE_FIRED, { center, angle })
}

function onKeyDown (e) {
  switch (e.code) {
    case 'KeyA':
    case 'ArrowLeft': {
      keyboardTracker.left = true
      break
    }
    case 'KeyD':
    case 'ArrowRight': {
      keyboardTracker.right = true
      break
    }
    case 'KeyS':
    case 'ArrowDown': {
      keyboardTracker.down = true
      break
    }
    case 'KeyW':
    case 'ArrowUp': {
      keyboardTracker.up = true
      break
    }
  }
}

function onKeyUp (e) {
  switch (e.code) {
    case 'KeyA':
    case 'ArrowLeft': {
      keyboardTracker.left = false
      break
    }
    case 'KeyD':
    case 'ArrowRight': {
      keyboardTracker.right = false
      break
    }
    case 'KeyS':
    case 'ArrowDown': {
      keyboardTracker.down = false
      break
    }
    case 'KeyW':
    case 'ArrowUp': {
      keyboardTracker.up = false
      break
    }
  }
}

function setupDOMEvents () {
  window.addEventListener('resize', onResize)

  window.addEventListener('click', onWindowClick)
  window.addEventListener('blur', () => { isTabActive = false })
  window.addEventListener('focus', () => { isTabActive = true })

  // keyboard events
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
}

// helpers
function getPageCenter () {
  return {
    x: canvas.width / 2 / devicePixelRatio,
    y: canvas.height / 2 / devicePixelRatio
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

// -------- socket.io ------------
function setupSocketEventHandlers (socket) {
  socket.on('connect', () => {
    emitInitCanvas()
  })

  socket.on(UPDATE_PLAYERS, (serverPlayers) => {
    const idsServer = Object.keys(serverPlayers)
    const idsClient = Object.keys(frontendPlayers)
    const idsToDelete = idsClient.filter(pId => !idsServer.includes(pId))
    
    idsToDelete.forEach(idDel => {
      delete frontendPlayers[idDel]
    })

    for (const playerId of idsServer) {
      const serverPlayer = serverPlayers[playerId]

      if (!frontendPlayers[playerId]) {
        const player = new Player({
          x: serverPlayer.x,
          y: serverPlayer.y,
          color: serverPlayer.color
        })

        frontendPlayers[playerId] = player
      } else {
        const player = frontendPlayers[playerId]

        player.color = serverPlayer.color

        if (playerId === socket.id) {
          const foundFrontendIndex = playerInputs.findIndex(input => input.sequenceNumber === serverPlayer.sequenceNumber)

          if (foundFrontendIndex >= 0) {
            playerInputs.splice(0, foundFrontendIndex + 1)

            playerInputs.forEach(input => {
              player.x += input.x * PLAYER_SPEED
              player.y += input.y * PLAYER_SPEED
            })
          }
        } else {
          gsap.to(player, {
            x: serverPlayer.x,
            y: serverPlayer.y,
            duration: 0.015
          })
        }
      }
    }

    myPlayer = frontendPlayers[socket.id]
  })

  socket.on(UPDATE_PROJECTILES, (serverProjectiles) => {
    const activeProjectileIds = serverProjectiles.map(p => p.id)

    for (const frontendProjectileId  of Object.keys(frontendProjectiles)) {
      if (!activeProjectileIds.includes(frontendProjectileId)) {
        delete frontendProjectiles[frontendProjectileId]
      }
    }

    for (const projectile of serverProjectiles) {
      const projectileId = projectile.id

      if (!frontendProjectiles[projectileId]) {
        frontendProjectiles[projectileId] = new Projectile({
          id: projectile.id,
          x: projectile.x,
          y: projectile.y,
          radius: PROJECTILE_RADIUS,
          velocity: new Velocity(projectile.velocity.x, projectile.velocity.y),
          color: (projectile.playerId === socket.id ? myPlayer?.color : colors.projectile_colors.enemy) || colors.projectile_colors.default
        })
      } else {
        const frontendProjectile = frontendProjectiles[projectileId]
        console.log('@#$ frontendProjectile position:', frontendProjectile.x, frontendProjectile.y)
        frontendProjectile.x = projectile.x
        frontendProjectile.y = projectile.y
      }
    }
  })

  socket.on(PLAYER_DISCONNECTED, playerId => {
    delete frontendPlayers[playerId]
  })
}

// -------- socket.io END ------------

setupSocketEventHandlers(socket)
initDOM()
setupDOMEvents()
startGame()