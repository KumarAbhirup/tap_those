/* eslint-disable no-unused-vars */
/*
  global
  GameObject
  Smooth
  firedBalls
  balls
*/

class Ball extends GameObject {
  removable = false

  velocity = 0

  maxVelocity = 5

  update() {
    this.rotate(null, 0.04, 'auto')

    this.velocity = Smooth(this.velocity, this.maxVelocity, 100)
    this.body.position.y += this.velocity

    if (this.wentOutOfFrame()) this.removable = true
  }
}
