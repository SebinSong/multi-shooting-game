class Velocity {
  #MAX_VELOCITY = 15
  #ACCEL_FACTOR = 1.0625

  constructor (x, y) {
    this.x = x
    this.y = y
  }

  get magnitude () {
    return Math.hypot(this.x, this.y)
  }

  accelerate () {
    if (this.magnitude === this.#MAX_VELOCITY) { return }
    else if (this.magnitude > this.#MAX_VELOCITY) {
      const f = this.#MAX_VELOCITY / this.magnitude
      this.x *= f
      this.y *= f
    } else {
      this.x *= this.#ACCEL_FACTOR
      this.y *= this.#ACCEL_FACTOR
    }
  }
}

module.exports = {
  Velocity
}
