class ObjectCircle {
  constructor ({ x, y, radius, color } = {}) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
  }

  setPosition (x, y) {
    this.x = x
    this.y = y
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

module.exports = {
  ObjectCircle
}
