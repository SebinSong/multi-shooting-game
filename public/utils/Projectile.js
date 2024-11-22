class Projectile extends ObjectCircle {
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
