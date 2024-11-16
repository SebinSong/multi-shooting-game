const MAX_VELOCITY = 15
const ACCEL_FACTOR = 1.0625

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
