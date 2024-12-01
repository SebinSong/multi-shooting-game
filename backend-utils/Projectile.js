const { getRandomHexString } = require('./utils')
const { ObjectCircle } = require('./ObjectCircle')
const { Velocity } = require('./Velocity')

class Projectile extends ObjectCircle {
  constructor (args = {}) {
    super(args)
    this.velocity = args.velocity || new Velocity(0, 0)
    this.id = getRandomHexString()
    this.playerId = args.playerId
  }

  update () {
    this.velocity.accelerate()
    this.x += this.velocity.x
    this.y += this.velocity.y
  }

  remove (array) {
    const index = array.findIndex(entry => entry.id === this.id)
    array.splice(index, 1)
  }
}

module.exports = {
  Projectile
}
