
let canvas
let context
let secondsPassed = 0;
let oldTimeStamp = 0;
let fps

let movingSpeed = 50
let rectX = 0
let rectY = 0

let PIPE_SCROLL = -60
let PIPE_SPEED = 60
const GRAVITY = 10

let pipes = []
let pipePairs = []
let pipeTimer = 0

const PIPE_HEIGHT = 288
const PIPE_WIDTH = 70
const BIRD_WIDTH = 38
const BIRD_HEIGHT = 24

let lastY = -PIPE_HEIGHT + (Math.random() * (80-1) + 1) + 20

let scrolling = true
let pause = false
let dead = false
let returnKeyPressed = false
let dizzy = false
hurtSound = new Audio('./sounds/hurt.wav')
hurtSound.setAttribute("preload", "auto")
jumpSound = new Audio('./sounds/jump.wav')
jumpSound.setAttribute("preload", "auto")
pauseSound = new Audio('./sounds/pause.wav')
pauseSound.setAttribute("preload", "auto")
scoreSound = new Audio('./sounds/score.wav')
scoreSound.setAttribute("preload", "auto")
explosionSound = new Audio('./sounds/explosion.wav')
explosionSound.setAttribute("preload", "auto")
gameMusic = new Audio('./sounds/marios_way.mp3')
gameMusic.setAttribute("preload", "auto")


// ---------------CLASSES-----------------------------------------  


class StateMachine {
    constructor(states={}){
        this.states = states
        this.empty = {
            render: function(){},
            update: function(){},
            enter: function(){},
            exit: function(){},
        }
        this.current = this.empty
    }

    change(stateName, enterParams){
        this.current.exit()
        this.current =this.states[stateName]()
        this.current.enter(enterParams)
    }
    
    update(dt){
        this.current.update(dt)
    }

    render(){
        this.current.render()

    }
}
class BaseState {
    constructor(){
    }
    init(){}
    enter(){}
    exit(){}
    update(){}
    render(){}
}


class CountdownState extends BaseState {
    constructor(){
        super()
        this.COUNTDOWN_TIME = 0.75
        this.count = 3,
        this.timer = 0
    }

    update(dt){
        if (!pause){
            this.timer += dt
            
            if (this.timer > this. COUNTDOWN_TIME){
                this.timer = this.timer % this.COUNTDOWN_TIME
                this.count = this.count - 1

                if (this.count === 0){
                    gStateMachine.change('play')
                }
            }
        }
    }

    render(){
        context.fillStyle = "white"
        context.font= "56px Flappy"
        context.textAlign = "center"
        context.fillText(`${this.count}`, canvas.width/2, canvas.height/2)
    }
}

class ScoreState extends BaseState {
    constructor(){
        super()
    }
    enter(params){
        this.score = params
        dead = false
    }

    update(dt){
        if (returnKeyPressed === true){
            returnKeyPressed = false
            console.log('PLAY STATE')
            gStateMachine.change('countdown')
        }
    }

    render(){
        context.fillStyle = "white"
        context.font= "56px Flappy"
        context.textAlign = "center"
        context.fillText(`Final Score: ${this.score}`, canvas.width/2, 100)
        context.font= "20px Flappy"
        context.fillText('Press enter to play again', canvas.width/2, 150)
    }
}
class TitleScreenState extends BaseState{
    constructor(){
        super()
    }
    enter(){
        scrolling = true
        PIPE_SCROLL = -60
        PIPE_SPEED = 60
    }
    update(dt){
        if (returnKeyPressed === true){
            returnKeyPressed = false
            console.log('PLAY STATE')
            gStateMachine.change('countdown')
        }
    }

    render(){
        context.fillStyle = "white"
        context.font= "56px Flappy"
        context.textAlign = "center"
        context.fillText("Flappy Owl", canvas.width/2, 100)
        context.font = "14px Flappy"
        context.fillText("Press Enter", canvas.width/2, 140)
         context.fillText("press space bar to fly", canvas.width/2, 240)
    }
}

class PlayState extends BaseState {
    constructor(){
        super()
        this.bird = new Bird()
        this.pipePairs = []
        this.timer = 0
        this.score = 0
        this.medal = new Medal()
        this.lastY = -PIPE_HEIGHT + (Math.random() * (80-1) + 1) + 20
    }
    init(){
        // this.bird = new Bird()
        // this.pipePairs = []
        // this.timer = 0

        // this.lastY = -PIPE_HEIGHT + (Math.random() * (80-1) + 1) + 20
    }

    enter(){
        scrolling = true 
        dizzy = false
        PIPE_SCROLL = -60
        PIPE_SPEED = 60
        backgroundScrollSpeed = 30
        groundScrollSpeed = 60
    }
    update(dt){
        if (!pause){  
        this.timer += dt
    
        if (this.timer > getRandomInt(2,100)){
            console.log('create pipe')
            // modify the last y coordinate we placed so pipe gaps aren't too far
            // no higher than 10 below the top edge of the screen, and
            // no lower than a gap length (90px) from the bottom
            let y = Math.max(-PIPE_HEIGHT +10, Math.min(lastY + (Math.random() * (20+20)-20),canvas.height-90 -PIPE_HEIGHT))
            this.lastY = y
            this.pipePairs.push(new PipePair(y))
            this.timer=0
        }

        this.bird.update(dt)
        if (this.bird.y > canvas.height -15){
            hurtSound.play()
            gameMusic.pause()
            gStateMachine.change('score', this.score)
            scrolling = false

        }

        this.pipePairs.forEach(element => {
            if (!element.scored){
                if (element.x + PIPE_WIDTH < this.bird.x){
                    this.score += 1
                    this.medal.update(this.score)
                    scoreSound.play()
                    element.scored = true
                }
            }
        })

        for(let i=0; i< this.pipePairs.length; i++){
            if ( (this.bird.collides(this.pipePairs[i].pipes.upper)) || 
                 (this.bird.collides(this.pipePairs[i].pipes.lower)) ){
                     //gStateMachine.change('title')
                     //birdImg.src = './images/Dizzy/frame-1.png',
                     if (!dizzy){
                     explosionSound.play()
                     hurtSound.play()
                     }
                     gameMusic.pause()
                     dizzy = true
                     PIPE_SPEED = 0
                     PIPE_SCROLL = 0
                     backgroundScrollSpeed = 0
                     groundScrollSpeed = 0
                     dead = true
                     console.log('GAME OVER', dead)
                     //setTimeout(()=>gStateMachine.change('score', this.score),600)
                     //gStateMachine.change('score', this.score)
                     scrolling = false
            }
            this.pipePairs[i].update(dt)
            if (this.pipePairs[i].remove){
                this.pipePairs.shift()
            }
        }
    }
    }
    render(){
        this.pipePairs.forEach((pipe)=>pipe.render())
        context.fillStyle = "white"
        context.font= "24px MyFont"
        context.textAlign = "start"

        context.fillText(`Score: ${this.score}`, 8, 20)
        this.bird.render()
        this.medal.render()

    }
    exit(){
        scrolling = false
    }
}
class Medal {
    constructor(params){
        this.width = 40
        this.height = 81
        this.x = 8
        this.y = 25
        this.score = 0
    }

    update(score){
        this.score = score
        console.log('score: ', this.score)
        if (score > 2){
            medalImage.src = "./images/gold.png"
        } else if (score > 1){  
            medalImage.src = "./images/silver.png"
        }
    }

    render(){
        if (this.score > 0){
            context.drawImage(medalImage, this.x, this.y, 20, 40)

        }    
    }
}
class Pipe {
    constructor(orientation, y){
        this.image='./images/pipe.png'
        this.width = 70
        this.height = 288
        this.x = canvas.width
        this.y = y
        this.orientation = orientation
        //this.y = Math.random() * ((canvas.height -10) - (canvas.height/4)) + canvas.height/4
    }
    update(dt){
        //this.x = this.x + PIPE_SCROLL * dt
    }

    render(){
        if (this.orientation === 'top'){
            context.save()
            context.scale(1,-1)
            context.drawImage(pipeImage, this.x, (this.y + PIPE_HEIGHT)*-1)
            context.restore()
            //context.setTransform(1, 0, 0, 1, 0, 0);

        }else{       

            context.drawImage(pipeImage, this.x, this.y)

        }
    }

}

class PipePair{
    constructor(y){
        this.x = canvas.width + 32
        this.y = y
        this.gap = getRandomInt(90,160)
        this.remove = false
        this.pipes = {upper: new Pipe('top', this.y), lower: new Pipe('bottom', this.y + PIPE_HEIGHT + this.gap )}
        this.score = false
    }
    update(dt){
        if (dizzy){PIPE_SPEED = 0}
        if (this.x > -PIPE_WIDTH){
            this.x = this.x - PIPE_SPEED *dt
            this.pipes.upper.x = this.x
            this.pipes.lower.x = this.x
        } else {
            this.remove = true
        }
    }
    render(){
        this.pipes.upper.render()
        this.pipes.lower.render()
    }
}

class Bird{
    constructor(){
        this.width = 50
        this.height = 43
        // this.width = 1157
        // this.height = 1002
        this.x = canvas.width / 2 - (this.width/2)
        this.y = canvas.height / 2 - (this.height/2)
        this.dy = 0
        this.frame = -1
        this.staggerFrames = 12
        this.gameFrame = 0
        this.spriteHeightOrigin = 0
        this.spriteHeight = 1004


    }
    render(){
        //birdImg.src = birdFramesSrc[this.frame]
        // context.drawImage(birdImg, this.x, this.y )
        if (dizzy){
            this.spriteHeightOrigin=1004
        }

        context.drawImage(birdImg,this.frame * 1159,this.spriteHeightOrigin,
            1159,this.spriteHeight,this.x, this.y, this.width ,this.height)
    }

    update(dt){
        if (!dizzy){
            if (this.gameFrame % this.staggerFrames === 0){
                if (this.frame < 7)
                {
                    this.frame++

                }else{
                    this.frame = 0

                }
        }}else{
            if (this.gameFrame % this.staggerFrames === 0){
                if (this.frame < 1)
                {
                    this.frame++

                }else{
                    this.frame = 0
                }}
        }

        this.gameFrame++
        this.dy += GRAVITY * dt
        this.y += this.dy

         if (jump === true && !dizzy){
             this.dy -= 4
             
         }
        jump = false
    }
    collides(pipe){
        if ( ((this.x +2) + (this.width -4) >= pipe.x) &&
             (this.x <= pipe.x + PIPE_WIDTH)){
                 if ( ((this.y +2 + this.height-4) >= pipe.y) &&
                        (this.y +2 <= pipe.y + PIPE_HEIGHT)){
                            return true
                        }
             }else{
                 return false
             }
    }
}   
 

window.onload = init
let bird
let birdImg

function init(){
    canvas = document.getElementById('canvas')
    context = canvas.getContext('2d')
    window.requestAnimationFrame(gameLoop)   
    bird = new Bird()
    birdImg = new Image()
    birdImg.src = './images/spriteSheet.png'
         
}






const gStateMachine = new StateMachine({
    title: () => new TitleScreenState(),
    play: () => new PlayState(),
    score: () => new ScoreState(),
    countdown: () => new CountdownState()
})

gStateMachine.change('title')

const background = new Image()
background.src = './images/background.png'
const pauseImg = new Image()
pauseImg.src = './images/pause.png'
const ground = new Image()
ground.src = './images/ground.png'
const pipeImage = new Image()
pipeImage.src = './images/pipe.png'
medalImage = new Image()
medalImage.src = "./images/bronze.png"
let backgroundScroll = 0
let groundScroll = 0
let backgroundScrollSpeed = 30
let groundScrollSpeed = 60
const BACKGROUND_LOOPING_POINT = 413
let jump = false

window.addEventListener('click', () => {
        if (gStateMachine.current.constructor.name ===  'TitleScreenState' || gStateMachine.current.constructor.name === 'ScoreState'){
            returnKeyPressed = true
            gameMusic.loop = true
            gameMusic.play()
            console.log('enter pressed')
        }

        if (gStateMachine.current.constructor.name ===  'PlayState' && !dizzy &&!pause){
            jump = true
           jumpSound.play()
        }})


window.addEventListener('keydown', function(e){
    if (e.code === "Space"){
        jump = true

        if (gStateMachine.current.constructor.name ===  'PlayState' && !dizzy &&!pause){
           jumpSound.play()
        }


    } 
    if (e.code === 'Enter'){
        returnKeyPressed = true
        gameMusic.loop = true
        gameMusic.play()
        console.log('enter pressed')
    }
    if (e.code === "KeyP"){
        pauseSound.play()
        pause = !pause
    } 
})

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function updateBackground(){
    ctx.drawImage(background, -backgroundScroll, 0 )
    ctx.drawImage(ground, -groundScroll, canvas.height - 16)
    backgroundScroll = (backgroundScroll + backgroundScrollSpeed) % BACKGROUND_LOOPING_POINT
    groundScroll = (groundScroll + groundScrollSpeed) % canvas.width
}

function gameLoop(timeStamp) {

    // Calculate the number of seconds passed since the last frame
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    // Move forward in time with a maximum amount
    secondsPassed = Math.min(secondsPassed, 0.1)
    oldTimeStamp = timeStamp;

    // Calculate fps
    fps = Math.round(1 / secondsPassed);
    //console.log(fps)

    // Perform the drawing operation
    draw()

  
    //gStateMachine.update(secondsPassed)
    update(secondsPassed)
    


    // The loop function has reached it's end. Keep requesting new frames
    window.requestAnimationFrame(gameLoop);
}

function draw(){
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Background 
    context.drawImage(background, -backgroundScroll, 0 )
    //pipePairs.forEach((pipe)=>pipe.render())
    context.drawImage(ground, -groundScroll, canvas.height - 16)
    // Bird
    //bird.render()
    gStateMachine.render()
    if (pause){
    context.drawImage(pauseImg, canvas.width/2-25, canvas.height/2-25) 
    }

 
}

function update(secondsPassed){
    if (!pause){
        gStateMachine.update(secondsPassed)
        // Background 
        backgroundScroll = (backgroundScroll + backgroundScrollSpeed * secondsPassed) % BACKGROUND_LOOPING_POINT
        groundScroll = (groundScroll + groundScrollSpeed * secondsPassed) % canvas.width

    }
}