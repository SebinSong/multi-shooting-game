class ParticlePiece extends ObjectCircle {
  constructor (args = {}) {
    super(args)
    this.velocity = args.velocity || new Velocity(0, 0)
    this.id = randomHexString()
    this.parent = args.parent || null
  }

  update () {
    if (!this.isInCanvas) {
      this.remove()
      return
    }

    this.x += this.velocity.x
    this.y += this.velocity.y

    this.velocity.x *= 0.935
    this.velocity.y *= 0.935

    this.radius -= 0.075

    if (this.radius < 0.5) {
      this.remove()
    } else {
      this.draw()
    }
  }

  remove () {
    this.parent.removeParticle(this.id)
  }
}

class ParticleGroup {
  constructor (args = {}) {
    this.particles = []
    this.id = randomHexString()

    const { num: particleNumbers, rRange } = this.getParticleDetails(args.hitRadius)
    for (let i = 0; i < particleNumbers; i++) {
      this.particles.push(
        new ParticlePiece({
          x: args.x, y: args.y,
          color: args.color,
          radius: 1.5 + Math.random() * rRange,
          velocity: this.getRandomParticleVelocity(),
          parent: this
        })
      )
    }
  }

  getParticleDetails (hitRadius = 15) {
    const size = hitRadius > 30
      ? 'big'
      : hitRadius > 20
        ? 'medium'
        : 'small'

    switch (size) {
      case 'big':
        return { num: 12, rRange: 7.5 }
      case 'medium':
        return { num: 9, rRange: 5 }
      default:
        return { num: 6, rRange: 2.5 }
    }
  }

  getRandomParticleVelocity () {
    const angle = Math.random() * (Math.PI * 2)
    const vMag = 3 + 5 * Math.random() 
    const vx = vMag * Math.cos(angle)
    const vy = vMag * Math.sin(angle)

    return new Velocity(vx, vy)
  }

  update () {
    if (this.particles.length === 0) {
      this.remove()
    } else {
      this.particles.forEach(particle => particle.update())
    }
  }

  removeParticle (particleId) {
    this.particles = this.particles.filter(p => p.id !== particleId)
  }

  remove () {
    particleGroups = particleGroups.filter(group => group.id !== this.id)
  }
}
