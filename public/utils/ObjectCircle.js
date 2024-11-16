class ObjectCircle {
  constructor ({ x, y, radius, color } = {}) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
  }

  draw () {
    c.save()
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
    c.restore()
  }

  setPosition (x, y) {
    this.x = x
    this.y = y
  }

  get isInCanvas () {
    return this.x >= 0 &&
      this.x <= canvas.width &&
      this.y >= 0 &&
      this.y <= canvas.height
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