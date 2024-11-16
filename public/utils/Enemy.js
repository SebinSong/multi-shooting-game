class Enemy extends ObjectCircle {
  constructor (args = {}) {
    super(args)
    this.velocity = args.velocity || new Velocity(0, 0)
    this.radiusTo = args.radius
    this.id = randomHexString()
  }

  update () {
    this.x += this.velocity.x
    this.y += this.velocity.y

    this.draw()
  }
}
