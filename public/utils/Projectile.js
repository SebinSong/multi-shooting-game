class Projectile extends ObjectCircle {
  constructor (args = {}) {
    super(args)
    this.velocity = args.velocity || new Velocity(0, 0)
    this.id = randomHexString()
    this.parent = args.parent || null
  }

  update () {
    this.draw()
  }
}
