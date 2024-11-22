const PLAYER_RADIUS = 15


class Player extends ObjectCircle {
  constructor (args = {}) {
    args.radius = PLAYER_RADIUS
    super(args)
  }

  update () {
    this.draw()
  }
}
