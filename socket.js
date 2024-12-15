const { Server } = require('socket.io')
const { Projectile } = require('./backend-utils/Projectile')
const { Velocity } = require('./backend-utils/Velocity')
// state
const backendPlayers = {}
const backendProjectiles = {}

const playerColorset = ['#618C03', '#E51C1F', '#F2B705', '#D97904', '#D92B04', '#F27983']

// events
const UPDATE_PLAYERS = 'update-players'
const UPDATE_PROJECTILES = 'update-projectiles'
const PLAYER_DISCONNECTED = 'player-disconnected'
const KEYDOWN = 'keydown'
const PROJECTILE_FIRED = 'projectile-fired'
const INIT_CANVAS = 'init-canvas'

// constants
const PROJECTILE_VELOCITY_MAGNITUDE = 4
const PROJECTILE_RADIUS = 5
const PLAYER_SPEED = 3

// helpers
const getColor = () => {
  const pArr = Object.values(backendPlayers)
  return playerColorset.find(color => pArr.every(p => p.color !== color))
}

function extractFrontEndProjectiles () {
  const projectiles = Object.values(backendProjectiles).flat()
  return projectiles.map(projectile => ({
    id: projectile.id,
    x: projectile.x,
    y: projectile.y,
    velocity: { x: projectile.velocity.x, y: projectile.velocity.y },
    playerId: projectile.playerId
  }))
}

function isProjectileOffCanvas (projectile, canvas) {
const { x: px, y: py } = projectile
const cBottom = canvas.height
const cRight = canvas.width

  return (px + PROJECTILE_RADIUS < 0) ||
    (px - PROJECTILE_RADIUS > cRight) ||
    (py + PROJECTILE_RADIUS < 0) ||
    (py - PROJECTILE_RADIUS > cBottom)
}

function setupSocketIO (server) {
  const io = new Server(server, {
    pingInterval: 2500,
    pingTimeout: 5000
  })

  io.on('connection', socket => {
    backendPlayers[socket.id] = {
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 400,
      color: getColor(),
      sequenceNumber: 0,
      canvas: { width: 0, height: 0 }
    }
    console.log('New player connected - ', socket.id)

    socket.on(INIT_CANVAS, ({ width, height }) => {
      backendPlayers[socket.id].canvas.width = width
      backendPlayers[socket.id].canvas.height = height
    })

    socket.on('disconnect', () => {
      socket.broadcast.emit(PLAYER_DISCONNECTED, socket.id)
      
      delete backendPlayers[socket.id]
    })

    socket.on(KEYDOWN, (data) => {
      const { x = 0, y = 0, sequenceNumber } = data
      const player = backendPlayers[socket.id]

      if (player) {
        player.x += x * PLAYER_SPEED
        player.y += y * PLAYER_SPEED
        player.sequenceNumber = sequenceNumber
      }
    })

    socket.on(PROJECTILE_FIRED, ({ center, angle }) => {
      if (!backendProjectiles[socket.id]) {
        backendProjectiles[socket.id] = []
      }

      const vx = PROJECTILE_VELOCITY_MAGNITUDE * Math.cos(angle)
      const vy = PROJECTILE_VELOCITY_MAGNITUDE * Math.sin(angle)
      const newVel = new Velocity(vx, vy)
      const projectile = new Projectile({
        x: center.x,
        y: center.y,
        radius: PROJECTILE_RADIUS,
        velocity: newVel,
        playerId: socket.id
      })

      backendProjectiles[socket.id].push(projectile)
    })
  })

  setInterval(() => {
    // update projectile positions
    for (const playerId in backendProjectiles) {
      const ownerProjectiles = backendProjectiles[playerId]
      const ownerCanvas = backendPlayers[playerId]?.canvas

      for (let i = ownerProjectiles.length - 1; i >=0; i--) {
        const projectile = ownerProjectiles[i]

        if (ownerCanvas && isProjectileOffCanvas(projectile, ownerCanvas)) {
         ownerProjectiles.splice(i, 1)
        } else {
          projectile.update()
        }
      }
    }

    io.emit(UPDATE_PLAYERS, backendPlayers)
    io.emit(UPDATE_PROJECTILES, extractFrontEndProjectiles())
  }, 15)
}

module.exports = {
  setupSocketIO
}
