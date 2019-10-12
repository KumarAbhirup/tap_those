/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// This function runs when the Game Screen is ON
function gamePlay() {
  // Floating Text effects
  for (let i = 0; i < floatingTexts.length; i += 1) {
    floatingTexts[i].update()
    floatingTexts[i].render()
  }

  // Particle effects
  for (let i = 0; i < particles.length; i += 1) {
    if (particles[i]) {
      particles[i].render()
      particles[i].update()
    }
  }

  // Draw Timer! (Comment this blob of code if you don't want timer)
  if (Koji.config.strings.enableTimer) {
    gameTimer -= 1 / 60
    drawTimer()
  }

  if (emojiCooldown > 0) {
    emojiCooldown -= 1 / frameRate()
  }

  if (touching) {
    touchCurrentX = camera.mouseX
    touchCurrentY = camera.mouseY
  }

  // InGame UI
  removeEmptyEnemies()

  // Spawn a ball every second
  ;(() => {
    ballTimer += 1 / frameRate()

    const interval = isMobile ? 0.85 : 1
    const ballSize = isMobile ? 1.5 : 2

    if (ballTimer >= interval) {
      const ballType1 = random(ballTypes)
      const ballType2 = random(ballTypes)

      const pushBall = () => {
        balls.push(
          new Ball(
            {
              x: random(0, width),
              y: 0 - objSize * random(3, 6),
            },
            { radius: objSize * ballSize },
            {
              shape: 'circle',
              image: ballType1.image,
              rotate: Koji.config.strings.rotateFallingBalls,
              type: ballType1.type,
              scoreGivenAfterBusting: ballType1.scoreGivenAfterBusting,
              scoreGivenAfterOut: ballType1.scoreGivenAfterOut,
            }
          ),
          new Ball(
            {
              x: random(0, width),
              y: 0 - objSize * random(2, 6),
            },
            { radius: objSize * ballSize },
            {
              shape: 'circle',
              image: ballType2.image,
              rotate: Koji.config.strings.rotateFallingBalls,
              type: ballType2.type,
              scoreGivenAfterBusting: ballType2.scoreGivenAfterBusting,
              scoreGivenAfterOut: ballType2.scoreGivenAfterOut,
            }
          )
        )
      }

      pushBall()

      ballTimer = 0
    }
  })()

  camera.on()

  balls.forEach(ball => {
    ball.show()
    ball.update()
  })

  if (cameraTarget) {
    camera.position.x = Smooth(
      camera.position.x,
      cameraTarget.body.position.x,
      8
    )
    camera.position.y = Smooth(
      camera.position.y,
      cameraTarget.body.position.y,
      8
    )
  }

  camera.off()

  updateGameStatus()

  // Game messages
  for (let i = 0; i < gameMessages.length; i += 1) {
    gameMessages[i].goalPos.y = i * (gameMessages[i].size + objSize * 0.1)
    gameMessages[i].update()
    gameMessages[i].render()

    gameMessages[i].isFirst = i === 0
  }

  for (let i = 0; i < emojis.length; i += 1) {
    emojis[i].update()
    emojis[i].render()
  }

  // Score draw
  const scoreX = width - objSize / 2
  const scoreY = objSize / 3
  textSize(objSize * 2)
  fill(Koji.config.colors.scoreColor)
  textAlign(RIGHT, TOP)
  text(score, scoreX, scoreY)

  // Lives draw
  const lifeSize = objSize
  for (let i = 0; i < lives; i += 1) {
    image(
      imgLife,
      lifeSize / 2 + lifeSize * i,
      lifeSize / 2,
      lifeSize,
      lifeSize
    )
  }

  cleanup()
}

function updateGameStatus() {
  let scoreText
  const numOfPlayers = Object.keys(users).length

  if (numOfPlayers <= 1) {
    loadingAnimationTimer += 1 / 60

    if (loadingAnimationTimer > 1) {
      loadingAnimationTimer = 0
    }

    gameStatusText = `Invite people to '${roomName}' room`

    // dot-dot animation
    if (loadingAnimationTimer > 0.3) {
      gameStatusText += '.'
    }

    if (loadingAnimationTimer > 0.6) {
      gameStatusText += '.'
    }

    if (loadingAnimationTimer > 0.9) {
      gameStatusText += '.'
    }
  } else {
    gameStatusText = `Game Room: ${roomName}`
  }

  const txtSize = objSize * 0.5
  const x = width - objSize / 2
  const y = (objSize / 3) * 7

  // Player Score Texts
  ;(() => {
    let txt = ''

    for (let i = 0; i < enemies.length; i += 1) {
      if (enemies[i].name) {
        txt += `${enemies[i].name}: ${enemies[i].score}\n`
      }
    }

    scoreText = txt
  })()

  push()
  textSize(txtSize)
  fill(Koji.config.colors.scoreColor)
  textAlign(RIGHT, TOP)
  text(gameStatusText, x, y)
  pop()

  push()
  textSize(txtSize)
  fill(Koji.config.colors.negativeFloatingTextColor)
  textAlign(RIGHT, TOP)
  text(scoreText, x, y * 1.3)
  pop()
}
