/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable prefer-const */

// Strict Stuffs (EDITING THESE WILL MAKE GAME CRASH)
let myFont // The font we'll use throughout the app

let gameOver = false
let gameBeginning = false

let gameStart = false // Becomes true after a moment when game initializes
let canEnd = false

let users = []

// Effects
let floatingTexts = []
let particles = []

// Game Objects (READ-ONLY)
let player
let enemies = []
let balls = []

// Game Stuffs (READ-N-WRITE)
let ballTypes = []

let emojis = []
let emojiCooldown = 0

// Koji-Dispatch specific
let dispatch
let dispatchEvent
let dataInterval
let dataSendPeriod = 32

// Buttons
let playButton
let soundButton
let leaderboardButton
let endButton

// Score data
let startingLives
let scoreGain
let highscoreGained
let highScore
let score = 0

// Data taken from Game Settings
let comboTexts = []

// Images
let imgLife
let imgBackground
let imgBalls = []

// Audio
let sndMusic
let sndTap
let sndMatch
let sndEnd
let sndEnemyHit
let sndExplosion
let sndLostLife

let soundEnabled = true
let canMute = true

let soundImage
let muteImage

// Timer
let startingGameTimer
let gameTimer
let gameTimerEnabled = false
let gameOverRectangleHeight = 0 // for game over animation

let loadingAnimationTimer = 0
let ballTimer = 0

let canScore = false

// Size stuff
let objSize // Base size modifier of all objects, calculated based on screen size

/**
 * @description Game size in tiles
 * using bigger numbers will decrease individual object sizes but allow more objects to fit the screen
 * Keep in mind that if you change this, you might need to change text sizes as well
 */
const gameSize = 18

// Mobile
let isMobile = false // check if it really is mobile
let isMobileSize = false // check if the browser is mobile size

// Multiplayer stuffs
let gameStatusText = ''
let roomName = ''
let gameMessages = []

// Camera stuffs
let cameraTarget

// Touch
let touching = false // Whether the user is currently touching/clicking
let touchStartX = 0
let touchStartY = 0
let touchCurrentX = 0
let touchCurrentY = 0

// Load assets
function preload() {
  // Load font from google fonts link provided in game settings
  const link = document.createElement('link')
  link.href = Koji.config.strings.fontFamily
  link.rel = 'stylesheet'
  document.head.appendChild(link)
  myFont = getFontFamily(Koji.config.strings.fontFamily)
  const newStr = myFont.replace('+', ' ')
  myFont = newStr

  // Load background if there's any
  if (Koji.config.images.backgroundInGame !== '') {
    imgBackground = loadImage(Koji.config.images.backgroundInGame)
  }

  // Load images
  imgBalls[0] = loadImage(Koji.config.images.ballImage1)
  imgBalls[1] = loadImage(Koji.config.images.ballImage2)
  imgBalls[2] = loadImage(Koji.config.images.ballImage3)

  imgLife = loadImage(Koji.config.images.lifeIcon)
  soundImage = loadImage(Koji.config.images.soundImage)
  muteImage = loadImage(Koji.config.images.muteImage)

  /**
   * Load Sounds here
   * Include a simple IF check to make sure there is a sound in config, also include a check when you try to play the sound, so in case there isn't one, it will just be ignored instead of crashing the game
   * Music is loaded in setup(), to make it asynchronous
   */
  if (Koji.config.sounds.tap) sndTap = loadSound(Koji.config.sounds.tap)
  if (Koji.config.sounds.match) sndMatch = loadSound(Koji.config.sounds.match)
  if (Koji.config.sounds.end) sndEnd = loadSound(Koji.config.sounds.end)
  if (Koji.config.sounds.enemyHit)
    sndEnemyHit = loadSound(Koji.config.sounds.enemyHit)
  if (Koji.config.sounds.explosion)
    sndExplosion = loadSound(Koji.config.sounds.explosion)
  if (Koji.config.sounds.life) sndLostLife = loadSound(Koji.config.sounds.life)

  // Load settings from Game Settings
  scoreGain = parseInt(Koji.config.strings.scoreGain)
  startingLives = parseInt(Koji.config.strings.lives)
  comboTexts = Koji.config.strings.comboText.split(',')
  startingGameTimer = parseInt(Koji.config.strings.gameTimer)
  lives = startingLives

  // Timer stuff
  if (startingGameTimer <= 0) {
    gameTimer = 99999
  } else {
    gameTimer = startingGameTimer
  }
}

// Instantiate objects here
function instantiate() {
  player = new Player(
    {
      x: random(0, width),
      y: random(0, height),
    },
    { radius: 20 },
    {
      shape: 'circle',
      color: '#ffff00',
      id: dispatch.clientId,
      playerName: dispatch.userInfo.playerName,
    }
  )
  player.id = dispatch.clientId

  // Instantiate Emojis
  for (let i = 0; i < Koji.config.strings.emojis.length; i++) {
    let emojiSize = objSize * 2
    let x = emojiSize * 1.2 * i + emojiSize
    let y = height - objSize * 1.45

    emojis[i] = new Emoji(x, y, emojiSize, Koji.config.strings.emojis[i])
  }

  // Ball Types
  ballTypes = [
    {
      type: 0,
      image: imgBalls[0],
      scoreGivenAfterBusting: 50,
    },
    {
      type: 1,
      image: imgBalls[1],
      scoreGivenAfterBusting: 25,
    },
    {
      type: 2,
      image: imgBalls[2],
      scoreGivenAfterBusting: -100,
    },
  ]
}

// Setup your props
function setup() {
  width = window.innerWidth
  height = window.innerHeight

  // How much of the screen should the game take, this should usually be left as it is
  let sizeModifier = 0.75
  if (height > width) {
    sizeModifier = 1
  }

  createCanvas(width, height)

  // Magically determine basic object size depending on size of the screen
  objSize = floor(
    min(floor(width / gameSize), floor(height / gameSize)) * sizeModifier
  )

  isMobile = detectMobile()
  isMobileSize = detectMobileSize()

  textFont(myFont) // set our font
  document.body.style.fontFamily = myFont

  playButton = new PlayButton()
  soundButton = new SoundButton()
  leaderboardButton = new LeaderboardButton()
  endButton = new EndButton()

  gameBeginning = false
  gameOver = false
  canEnd = false

  /**
   * Load music asynchronously and play once it's loaded
   * This way the game will load faster
   */
  if (Koji.config.sounds.backgroundMusic)
    sndMusic = loadSound(Koji.config.sounds.backgroundMusic, () =>
      playMusic(sndMusic, 0.4, false)
    )

  // Dispatch Events and Streamers
  dispatch.on(dispatchEvent.CONNECTED, payload => {})

  dispatch.on(dispatchEvent.CONNECTED_CLIENTS_CHANGED, data => {
    // connectedClients is an object of the form { clientId: { userInfo } }
    users = data.connectedClients
    handleNewConnection()
  })

  // Enemy Update
  dispatch.on('enemy_update', payload => {
    enemies.forEach(enemy => {
      if (enemy.id === payload.id) {
        enemy.body.position.x = payload.posX
        enemy.body.position.y = payload.posY
        enemy.score = payload.score
        enemy.name = payload.name
      }
    })
  })

  // Chat listeners
  dispatch.on('global_message', payload => {
    spawnMessage(payload.message, payload.color)
  })

  dispatch.on('chat_message', payload => {
    let txt = `${payload.sender}: ${payload.message}`
    spawnMessage(txt, Koji.config.colors.floatingTextColor)
  })

  /**
   * Handle disconnect if user exits the whole tab
   * Not working all the time currently
   */
  window.addEventListener('beforeunload', event => {
    if (dispatch) {
      dispatch.disconnect()
      console.log('Dispatch Disconnected')
    }
  })

  dispatch.connect()

  if (dataInterval) {
    clearInterval(dataInterval)
  }

  dataInterval = setInterval(manageData, dataSendPeriod)

  roomName = localStorage.getItem('roomName')

  init()
}

// An infinite loop that never ends in p5
function draw() {
  // Manage cursor - show it on main menu, and hide during game, depending on game settings
  if (!gameOver && !gameBeginning) {
    if (!Koji.config.strings.enableCursor) {
      noCursor()
    }
  } else {
    cursor(ARROW)
  }

  // Draw background or a solid color
  if (imgBackground) {
    background(imgBackground)
  } else {
    background(Koji.config.colors.backgroundColor)
  }

  // Draw UI
  if (gameOver || gameBeginning) {
    window.setAppView('mainMenu')
  } else {
    gamePlay()
  }

  soundButton.render()
}

// Handle Canvas Resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight)

  width = window.innerWidth
  height = window.innerHeight

  // How much of the screen should the game take, this should usually be left as it is
  let sizeModifier = 0.75
  if (height > width) {
    sizeModifier = 1
  }

  // Magically determine basic object size depending on size of the screen
  objSize = floor(
    min(floor(width / gameSize), floor(height / gameSize)) * sizeModifier
  )

  soundButton.size = createVector(objSize, objSize)

  isMobileSize = detectMobileSize()

  // handleResize() // 👈 create this function for advanced resize handling
}

/**
 * Dispatch, Handle new connections, and many more multiplayer stuffs
 * All the code you see below is just for reference purposes which might not make sense in your game.
 */

function manageData() {
  try {
    dispatch.emitEvent('enemy_update', {
      id: dispatch.clientId,
      name: dispatch.userInfo.playerName,
      posX: Math.floor(player.body.position.x),
      posY: Math.floor(player.body.position.y),
      score,
    })
  } catch (error) {
    console.log(error)
  }
}

function handleNewConnection() {
  let enemyIDs = []

  for (let i = 0; i < enemies.length; i++) {
    enemyIDs[i] = enemies[i].id
  }

  for (let id in users) {
    if (id !== dispatch.clientId) {
      if (!enemyIDs.includes(id) && users[id].playerName) {
        spawnEnemy(id, users[id].playerName)
      }
    }
  }

  removeEmptyEnemies()
}

function removeEmptyEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    let userExists = false

    // eslint-disable-next-line no-restricted-syntax
    for (let user in users) {
      if (user === enemies[i].id) {
        userExists = true
      }
    }

    if (!userExists) {
      enemies[i].removable = true
    }
  }
}

function spawnEnemy(userId, playerName) {
  const toBePushedEnemy = new Player(
    {
      x: random(0, width),
      y: random(0, height),
    },
    { radius: 20 },
    {
      shape: 'circle',
      color: '#ffffff',
      id: userId,
      playerName: playerName || 'Player',
    }
  )
  toBePushedEnemy.id = userId

  enemies.push(toBePushedEnemy)
}

/**
 * Go through objects and see which ones need to be removed
 * A good practive would be for objects to have a boolean like removable, and here you would go through all objects and remove them if they have removable = true;
 */
function cleanup() {
  for (let i = 0; i < floatingTexts.length; i++) {
    if (floatingTexts[i].timer <= 0) {
      floatingTexts.splice(i, 1)
    }
  }

  // Game Messages cleanup
  for (let i = 0; i < gameMessages.length; i++) {
    if (gameMessages[i].removable) {
      gameMessages.splice(i, 1)
    }
  }

  if (gameMessages.length > Koji.config.strings.maxGameMessages) {
    gameMessages.splice(0, 1)
  }

  // Clean Particles
  for (let i = 0; i < particles.length; i++) {
    if (particles[i].timer <= 0) {
      particles.splice(i, 1)
    }
  }

  // Clean Enemies
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].removable) {
      enemies.splice(i, 1)
    }
  }

  // Clean Balls
  for (let i = 0; i < balls.length; i++) {
    if (balls[i].removable) {
      balls.splice(i, 1)
    }
  }
}

// Call this when a lose life event should trigger
function loseLife() {
  // eslint-disable-next-line no-plusplus
  lives--

  if (lives <= 0) {
    gameOver = true
    checkHighscore()

    if (score > parseInt(Koji.config.strings.minimumScoreToSave)) {
      submitScore(score)
    }
  }
}

// Handle input
function touchStarted() {
  if (gameOver || gameBeginning) {
  }

  if (soundButton.checkClick()) {
    toggleSound()
    return
  }

  if (!gameOver && !gameBeginning) {
    // InGame
    touching = true

    // Detect Click
    balls.forEach((ball, i) => {
      if (
        collidePointCircle(
          mouseX,
          mouseY,
          ball.body.position.x,
          ball.body.position.y,
          ball.sizing.radius * 2
        )
      ) {
        balls.splice(i, 1)

        addScore(
          ball.settings.scoreGivenAfterBusting,
          ball.settings.type !== 2 ? imgLife : soundImage,
          { x: mouseX, y: mouseY },
          10,
          {
            floatingText: true,
          }
        )
      }
    })

    if (emojiCooldown <= 0) {
      for (let i = 0; i < emojis.length; i++) {
        if (emojis[i].checkTouch()) {
          emojis[i].activate()
          emojiCooldown = 0.2
          break
        }
      }
    }

    if (canEnd) {
      gameOver = true

      if (score > parseInt(Koji.config.strings.minimumScoreToSave)) {
        submitScore(score)
      }
    }
  }
}

function touchEnded() {
  // This is required to fix a problem where the music sometimes doesn't start on mobile
  if (soundEnabled) {
    if (getAudioContext().state !== 'running') {
      getAudioContext().resume()
    }
  }

  touching = false
}

// Key pressed and released
function keyPressed() {
  if (!gameOver && !gameBeginning) {
    // Ignore this complete if statement. It is just for testing purposes. You don't even need to remove this code anyway.
    if (Koji.config.strings.trialTesting) {
      if (key === '-') {
        loseLife()
      }

      if (keyCode === ENTER) {
        addScore(
          1,
          imgLife,
          {
            x: random(0, width),
            y: random(0, height),
          },
          10,
          { floatingText: true }
        )
      }

      if (key === ' ') {
        particlesEffect(
          imgLife,
          {
            x: width / 2,
            y: height / 2,
          },
          10
        )
      }
    }
  }

  // After quitting
  if (keyCode === ESCAPE) {
    exit()
  }
}

function keyReleased() {
  if (!gameOver && !gameBeginning) {
  }
}

function mousePressed() {
  // Detect Click
  balls.forEach((ball, i) => {
    if (
      collidePointCircle(
        mouseX,
        mouseY,
        ball.body.position.x,
        ball.body.position.y,
        ball.sizing.radius * 2
      )
    ) {
      balls.splice(i, 1)

      addScore(
        ball.settings.scoreGivenAfterBusting,
        ball.settings.type !== 2 ? imgLife : soundImage,
        { x: mouseX, y: mouseY },
        10,
        {
          floatingText: true,
        }
      )
    }
  })
}

function mouseReleased() {}

/**
 * Call this every time you want to start or reset the game
 * This is a good place to clear all arrays like enemies, bullets etc before starting a new game
 */
function init() {
  gameOver = false

  camera.zoom = 1

  lives = startingLives
  highscoreGained = false
  score = 0

  gameTimer = startingGameTimer
  gameOverRectangleHeight = 0

  floatingTexts = []
  particles = []
  gameMessages = []
  emojis = []
  enemies = []
  users = []

  balls = []

  dispatch.disconnect()
  dispatch.connect()

  // Keep everyone at their original place
  instantiate()

  camera.position.x = width / 2
  camera.position.y = height / 2
  cameraTarget = null

  /**
   * In multiplayer games as of now,
   * there are initialization bugs with timers and floatingTexts
   *
   * @example
   * floatingTexts.push(
   *   new OldFloatingText(
   *     width / 2,
   *     height / 2 - height * 0.01,
   *     Koji.config.strings.gameStartedFloatingText,
   *     Koji.config.colors.floatingTextColor,
   *     objSize * 1.2,
   *     2
   *   )
   * )
   */

  canScore = false
  canEnd = false

  // set score to zero if score increases mistakenly
  setTimeout(() => {
    score = 0
    gameStart = true
  }, 1000)
}

function exit() {
  gameOver = true
  dispatch.disconnect()

  if (score > parseInt(Koji.config.strings.minimumScoreToSave)) {
    submitScore(score)
  } else {
    window.setAppView('mainMenu')
  }
}
