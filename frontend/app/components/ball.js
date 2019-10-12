/* eslint-disable no-unused-vars */
/*
  global
  GameObject
  Smooth
  firedBalls
  balls
  loseLife
  sndLostLife
  lives
  sndLost
  soundImage
  addScore
  isMobile
*/

class Ball extends GameObject {
  removable = false

  velocity = 0

  maxVelocity = isMobile ? 5 : 2

  update() {
    this.rotate(null, 0.04, 'auto')

    this.velocity = Smooth(this.velocity, this.maxVelocity, 100)
    this.body.position.y += this.velocity

    // if (this.wentOutOfFrame()) this.removable = true

    if (this.wentOutOfFrame()) {
      switch (this.settings.type) {
        case 0:
          // if golden star isn't caught
          if (lives === 1) {
            sndLost.play(0, 1, 100)
            setTimeout(loseLife, 1000)
          } else {
            sndLostLife.play(0, 1, 100)
            loseLife()
          }

          break

        case 1:
          addScore(
            this.settings.scoreGivenAfterOut,
            soundImage,
            { x: this.body.position.x, y: this.body.position.y },
            0,
            {
              floatingText: this.settings.scoreGivenAfterOut !== 0,
            }
          )
          break

        default:
          break
      }

      this.removable = true
    }
  }
}
