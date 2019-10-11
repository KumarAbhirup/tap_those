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

  maxVelocity = 10

  update() {
    this.rotate()

    this.velocity = Smooth(this.velocity, this.maxVelocity, 100)
    this.body.position.y += this.velocity

    if (this.wentOutOfFrame()) this.removable = true
  }
}
