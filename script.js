// import leaderboard.json as leaderboard
// import * as fs from 'fs';
// fs = require('fs');
// var name = 'leaderboard.json';
// var LEADERBOARD = JSON.parse(fs.readFileSync(name).toString());
var canvas=document.getElementById("GameCanvas");
var ct=canvas.getContext("2d");
// let params = (new URL(url)).searchParams;
let params = new URLSearchParams(location.search);
let player_name=(params.get('name'));
console.log(player_name);
Level=1;
let frame_x=document.getElementById("game_area").offsetWidth;
let frame_y=document.getElementById("game_area").offsetHeight;
if(frame_x>1.5*frame_y){frame_x=1.5*frame_y;}
else{frame_y=2*frame_x/3.0}
ct.canvas.width  = frame_x;
ct.canvas.height = frame_y;
let UnitUsed=frame_x/100;
// let YUnit=frame_y/100;

//global variables representing various constants of game
//Window
const WINDOW_Y=frame_y;
const WINDOW_X=frame_x;
const WINDOW_COLOR='rgb(230,230,230)';
const STEP_TIME=1;
//Bullet
const BULLET_SPEED=0.003*frame_y ;
const BULLET_HEIGHT=0.01*frame_x ;
const BULLET_WIDTH=0.0075*frame_x ;
const BULLET_COLOR="rgb(256,0,0)";
//Brick
const BRICK_HEIGHT=0.049*frame_x;
const BRICK_WIDTH=0.099*frame_x;
const STRONG_BRICK_COLOR='rgb(255,0,0)';
const WEAK_BRICK_COLOR='rgb(155,0,0)';
const OBSTRUCTION_COLOR='rgb(30,30,30)';
//Collectible(Falling)
const COLLECTIBLE_RADIUS=0.015*frame_x;
const COLLECTIBLE_COLOR="rgb(256,0,0)";
const COLLECTIBLE_SPEED=0.002*frame_y;
const COLLECTIBLE_TYPE_COLOR='rgb(0,0,0)';
//Paddle
const PADDLE_HEIGHT=0.02*frame_y;
const PADDLE_WIDTH=0.1*frame_x;
const PADDLE_STEP_SPEED=0.02*frame_x;
const FAST_PADDLE_STEP_SPEED=0.025*frame_x;
const LONG_PADDLE_WIDTH=0.15*frame_x;
const SHORT_PADDLE_WIDTH=0.07*frame_x;
const PADDLE_COLOR='rgb(0,0,255)';
//Ball
const BALL_SPEED_Y=frame_y/400;
const SLOW_BALL_FACTOR=0.8;
const BALL_RADIUS=0.01*frame_x;
const BALL_COLOR_OUT='rgb(20,20,20)';
const BALL_COLOR_IN='rgb(180,180,180)';
const BALL_DISPERSAL_SPEED=0.2*BALL_SPEED_Y;
//throw direction
const THROW_LINE_LENGTH=0.05*frame_y;
const MAX_THROW_ANGLE=70;//in degrees;
const THROW_LINE_COLOR='rgb(255,0,0)';
// //Level Configurations
let BRICK_GRIDS=[];
let OBSTRUCTION_GRIDS=[];
let COLLECTIBLE_GRIDS=[];
// // Level1
let LEVEL_1_BRICK_ARRAY=[];
let LEVEL_1_OBSTRUCTIONS_ARRAY=[];
let LEVEL_1_COLLECTIBLES_ARRAY=[];
//Level2
let LEVEL_2_OBSTRUCTIONS_ARRAY=[];
let LEVEL_2_COLLECTIBLES_ARRAY=[];
let LEVEL_2_BRICK_ARRAY=[];
//Required variables
let ScoreIncrement=1;
let bricks=LEVEL_1_BRICK_ARRAY; //array of bricks that can be broken
let obstructions=LEVEL_1_OBSTRUCTIONS_ARRAY; //array of unbreakable bricks
let balls=[]; //array of balls in the game
let availableCollectibles=LEVEL_1_COLLECTIBLES_ARRAY; //array of collectibles that do exist in the game
let fallingCollectibles=[]; //array of collectibles that are released and are falling
let activeCollectible=null; //if there's an active collectible, it's initial will be stored here
let collectibleTimeRemaining=0;
let featureTimeRemaining=0;
let activeFeature=null;
let numberOfLeft=0; //number of continuous left movements made
let numberOfRight=0; //number of continuous right movements made
let activeBullets=[]; //this is array of bullets that are released and are yet to hit a brick
let numberOfBulletsAvailable=0; //this is number of bullets available with player
let caught=true; //if the ball is caught by paddle, it is true
let caughtBallIndex=0;
let catchCount=0; //this has the number of catch counts available with the player
let Life=1; //Total life of player
let Score=0; //Total Score
let wrap=false;
//Class for vectors
class Vector{
    constructor(x,y){
        this.x=x;
        this.y=y;
    }
    sum(vec=new Vector()){//for A and B to be two vectors, A.sum(B) is equivalent to A+=B
        this.x+=vec.x;
        this.y+=vec.y;
    }
    getSum(vec=new Vector()){
        let ans=new Vector(this.x+vec.x,this.y+vec.y);
        return ans;
    }
    product(fac){//scalar multiplication of n by vector
        this.x=fac*this.x;
        this.y=fac*this.y;
    }
    getProduct(fac){
        let ans=new Vector(this.x*fac,this.y*fac);
        return ans;
    }
}
//Class to define a few things about object
class Object{
    constructor(pos=new Vector(), dmns=new Vector(), color){
        this.pos=pos;
        this.size=dmns;
        this.top=pos.y-dmns.y/2.0;      //to use for collision check
        this.bottom=pos.y+dmns.y/2.0;   //to use for collision check
        this.left=pos.x-dmns.x/2.0;     //to use for collision check
        this.right=pos.x+dmns.x/2.0;    //to use for collision check
        this.color=color;
    }
    refreshContents(){
        this.top = this.pos.y - this.size.y/2.0;
        this.bottom = this.pos.y + this.size.y/2.0;
        this.left = this.pos.x - this.size.x/2.0;
        this.right = this.pos.x + this.size.x/2.0;
    }
    render(ctx){
        ctx.fillStyle=this.color;
        ctx.beginPath()
        ctx.fillRect(this.left,this.top,this.size.x,this.size.y);
        ctx.closePath();
    }
}

class StaticObject extends Object{}

class MovingObject extends Object{
    constructor(pos=new Vector(), dmns=new Vector(), color, speed=new Vector()){
        super(pos,dmns,color);
        this.velocity=speed;
    }
    updatePos(){
        // console.log(this.velocity.product(2));
        this.pos.sum(this.velocity.getProduct(STEP_TIME));
        this.refreshContents();
    }
}

class Ball extends MovingObject{
    constructor(pos=new Vector(),speed=new Vector()){
        super(pos,new Vector(2*BALL_RADIUS,2*BALL_RADIUS),BALL_COLOR_OUT,speed);
    }
    updatePos(){
        if(caught){
            this.velocity.y=0;
            this.velocity.x=0;
            return;
        }
        this.pos.sum(this.velocity.getProduct(STEP_TIME));
        if((this.left<=0 && this.velocity.x<0) || (this.right>=WINDOW_X && this.velocity.x>0)){
            this.updateSpeedX(-2*this.velocity.x);
        } 
        if(this.top<=0 && this.velocity.y<0){
            this.reverseSpeedY();
        }
        this.refreshContents();
    }
    updateSpeedX(val){
        this.velocity.x+=val;
    }
    reverseSpeedY(){
        // console.log("doing");
        this.velocity.y*=-1;
        // console.log(this.velocity.y)
    }
    slowSpeed(){
        this.velocity.x*=SLOW_BALL_FACTOR;
        this.velocity.y*=SLOW_BALL_FACTOR;
    }
    normalSpeed(){
        this.velocity.product(1/SLOW_BALL_FACTOR);
    }
    caught(){
        this.speed=new Vector(0,0);
    }
    throwTheBall(dir=new ThrowDirection()){
        this.velocity.y=-1*BALL_SPEED_Y;
        this.velocity.x=BALL_SPEED_Y*Math.tan(dir.angle*Math.PI/180.0);
        caught=false;
    }
    render(ctx){
        let grad=ctx.createRadialGradient(this.pos.x,this.pos.y,0,this.pos.x,this.pos.y,BALL_RADIUS);
        grad.addColorStop(0,BALL_COLOR_IN);
        grad.addColorStop(1,BALL_COLOR_OUT);
        ctx.fillStyle=grad;
        ctx.beginPath();
        ctx.arc(this.pos.x,this.pos.y,BALL_RADIUS,0,2*Math.PI)
        ctx.fill();
        ctx.closePath();
    }
    disperse(array_balls){
        array_balls.push(new Ball(this.pos.getSum(new Vector(-1*BALL_RADIUS,0)),this.velocity.getSum(new Vector(-1*BALL_DISPERSAL_SPEED,0))));
        array_balls.push(new Ball(this.pos.getSum(new Vector(BALL_RADIUS,0)),this.velocity.getSum(new Vector(BALL_DISPERSAL_SPEED,0))));
    }
}
class Bullet extends MovingObject{
    constructor(pos=new Vector()){
        super(pos,new Vector(BULLET_WIDTH,BULLET_HEIGHT),BULLET_COLOR,new Vector(0,-1*BULLET_SPEED));
    }
}
class Brick extends StaticObject{
    constructor(pos=new Vector(), brick_lives, color){
        super(pos,new Vector(BRICK_WIDTH,BRICK_HEIGHT),color);
        this.brickLife=brick_lives;
    }
    hitByBullet(bullet=new Bullet()){
        if(bullet.top<=this.bottom && this.left<bullet.right && this.right>bullet.left){
            this.brickLife=0;
            return true;
        }
        return false;
    }
    isBallColliding(ball=new Ball()){
        // if(ball.right >= this.left && ball.left <= this.right && ball.bottom >= this.top && ball.top <= this.bottom){
        //     this.brickLife-=1;
        //     let dist_along_x=Math.abs(ball.pos.x-this.pos.x);
        //     let dist_along_y=Math.abs(ball.pos.y-this.pos.y);
        //     let touch_dist_along_x=(ball.size.x+this.size.x)/2.0;
        //     let touch_dist_along_y=(ball.size.y+this.size.y)/2.0;
        //     if(touch_dist_along_x-dist_along_x<touch_dist_along_y-dist_along_y){
        //         ball.updateSpeedX(-2*ball.velocity.x);
        //     }
        //     else{
        //         ball.reverseSpeedY();
        //     }
        //     return true;
        // }
        // else{
        //     return false;
        // }
        let dist_along_x=(ball.pos.x-this.pos.x);
        let dist_along_y=(ball.pos.y-this.pos.y);
        let touch_dist_along_x=(ball.size.x+this.size.x)/2.0;
        let touch_dist_along_y=(ball.size.y+this.size.y)/2.0;
        if(ball.right >= this.left && ball.left <= this.right && ball.bottom >= this.top && ball.top <= this.bottom){
            if(ball.velocity.x>0 && dist_along_x<0 && touch_dist_along_x-Math.abs(dist_along_x)<touch_dist_along_y-Math.abs(dist_along_y)){
                ball.updateSpeedX(-2*ball.velocity.x);
                this.brickLife--;
                return true;
            }
            else if(ball.velocity.x<0 && dist_along_x>0 && touch_dist_along_x-Math.abs(dist_along_x)<touch_dist_along_y-Math.abs(dist_along_y)){
                ball.updateSpeedX(-2*ball.velocity.x);
                this.brickLife--;
                return true;
            }
            else if(ball.velocity.y>0 && dist_along_y<0 && touch_dist_along_x-Math.abs(dist_along_x)>touch_dist_along_y-Math.abs(dist_along_y)){
                ball.reverseSpeedY();
                this.brickLife--;
                return true;
            }
            else if(ball.velocity.y<0 && dist_along_y>0 && touch_dist_along_x-Math.abs(dist_along_x)>touch_dist_along_y-Math.abs(dist_along_y)){
                ball.reverseSpeedY();
                this.brickLife--;
                return true;
            }
        }
        return false;
    }
    render(ctx){
        if(this.color==WEAK_BRICK_COLOR){
            ctx.beginPath();
            let grad=ctx.createRadialGradient(this.pos.x,this.pos.y,0,this.pos.x,this.pos.y,Math.max(this.size.x/2.0,this.size.y/2.0));
            grad.addColorStop(0,'rgb(155,70,70)');
            grad.addColorStop(1,this.color);
            ctx.fillStyle=grad;
            ctx.fillRect(this.left,this.top,this.size.x,this.size.y);
            ctx.closePath();
        }
        if(this.color==STRONG_BRICK_COLOR){
            if(this.brickLife==2){
                // console.log('doing')
                ctx.beginPath();
                let grad=ctx.createRadialGradient(this.pos.x,this.pos.y,0,this.pos.x,this.pos.y,Math.max(this.size.x/2,this.size.y/2));
                grad.addColorStop(0,'rgb(255,100,100)');
                grad.addColorStop(1,this.color);
                ctx.fillStyle=grad;
                ctx.fillRect(this.left,this.top,this.size.x,this.size.y);
                ctx.closePath();
            }
            else{
                ctx.beginPath();
                let grad=ctx.createRadialGradient(this.pos.x,this.pos.y,0,this.pos.x,this.pos.y,Math.max(this.size.x/2.0,this.size.y/2.0));
                grad.addColorStop(0,'rgb(255,170,170)');
                grad.addColorStop(1,this.color);
                ctx.fillStyle=grad;
                ctx.fillRect(this.left,this.top,this.size.x,this.size.y);
                ctx.closePath();
                ctx.beginPath();
                ctx.strokeStyle=WINDOW_COLOR;
                ctx.moveTo(this.left+this.size.x*0.2,this.top+this.size.y*0.1);
                ctx.lineTo(this.right-this.size.x*0.1,this.bottom-this.size.y*0.2);
                ctx.stroke();
                ctx.closePath();
            }
        }
        if(this.color==OBSTRUCTION_COLOR){
            ctx.beginPath();
            let grad=ctx.createRadialGradient(this.pos.x,this.pos.y,0,this.pos.x,this.pos.y,Math.max(this.size.x/2.0,this.size.y/2.0));
            grad.addColorStop(0,'rgb(120,120,120)');
            grad.addColorStop(1,this.color);
            ctx.fillStyle=grad;
            ctx.fillRect(this.left,this.top,this.size.x,this.size.y);
            ctx.closePath();
        }
    }
}
class Paddle extends StaticObject{
    constructor(){
        super(new Vector(WINDOW_X/2.0,WINDOW_Y-PADDLE_HEIGHT/2.0-frame_y*0.005),new Vector(PADDLE_WIDTH,PADDLE_HEIGHT),PADDLE_COLOR);
        this.stepDistance=new Vector(PADDLE_STEP_SPEED,0);
    }
    move(dir,is_wrap){
        if(!is_wrap){
            if(this.left<0 && dir==-1){return;}
            if(this.right>WINDOW_X && dir==1){return;}
            this.pos.sum(this.stepDistance.getProduct(dir));
            this.refreshContents();
            return;
        }
        if(is_wrap){
            this.pos.sum(this.stepDistance.getProduct(dir));
            if(this.pos.x<0){
                this.pos.x=WINDOW_X+this.pos.x;
            }
            else if(this.pos.x>WINDOW_X){
                this.pos.x-=WINDOW_X;
            }
            this.refreshContents();
            return;
        }
    }
    fastStepSpeed(){
        this.stepDistance=new Vector(FAST_PADDLE_STEP_SPEED,0);
    }
    normalStepSpeed(){
        this.stepDistance=new Vector(PADDLE_STEP_SPEED,0);
    }
    longLength(){
        this.size.x=LONG_PADDLE_WIDTH;
        this.refreshContents();
    }
    shortLength(){
        this.size.x=SHORT_PADDLE_WIDTH;
        this.refreshContents();
    }
    normalLength(){
        this.size.x=PADDLE_WIDTH;
        this.refreshContents();    
    }
    collisionWithBall(ball=new Ball(),lineOfThrow=new ThrowDirection()){
        if(ball.bottom>=this.top && ball.pos.y<this.top&& ball.left<this.right && ball.right>this.left && ball.velocity.y>0){
            ScoreIncrement=1;
            if(!catchCount){
                ball.reverseSpeedY();
                ball.updateSpeedX((numberOfRight-numberOfLeft)*0.001);
            }
            if(catchCount>0){
                // console.log('doing');
                catchCount--;
                caught=true;
                lineOfThrow.angle=0;
                lineOfThrow.startPosition=ball.pos;
            }
        }
    }
}
class EnclosedCollectible{
    constructor(type,idx){
        this.type=type;
        this.brickIndex=idx;
    }
}
class FallingCollectible extends MovingObject{
    constructor(pos=new Vector(),type){
        super(pos,new Vector(2*COLLECTIBLE_RADIUS,2*COLLECTIBLE_RADIUS),COLLECTIBLE_COLOR,new Vector(0,COLLECTIBLE_SPEED));
        this.type=type;
    }
    isCollected(paddle=new Paddle()){
        if(this.bottom>paddle.top && this.right>paddle.left && this.left<paddle.right && this.top<paddle.bottom){
            return true;
        }
        return false;
    }
    reachedBottom(){
        return (this.top>=WINDOW_Y);
    }
    render(ctx){
        ctx.beginPath();
        let grad=ctx.createRadialGradient(this.pos.x,this.pos.y,COLLECTIBLE_RADIUS*0.6,this.pos.x,this.pos.y,COLLECTIBLE_RADIUS)
        grad.addColorStop(0,WINDOW_COLOR);
        grad.addColorStop(1,COLLECTIBLE_COLOR);
        ctx.fillStyle=grad;
        ctx.arc(this.pos.x,this.pos.y,COLLECTIBLE_RADIUS,0,2*Math.PI);
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.fillStyle=COLLECTIBLE_TYPE_COLOR;
        ctx.font=`${1.2*COLLECTIBLE_RADIUS}px Arial`;
        ctx.fillText(this.type,this.pos.x-0.4*COLLECTIBLE_RADIUS,this.pos.y+0.4*COLLECTIBLE_RADIUS,1.4*COLLECTIBLE_RADIUS);
        ctx.closePath();
    }
}
class ThrowDirection{
    constructor(start_pos=new Vector()){
        this.startPosition=start_pos;
        this.angle=0;
        this.color=THROW_LINE_COLOR;
    }
    moveLeft(){
        if(this.angle>-1*MAX_THROW_ANGLE){
            this.angle--;
        }
    }
    moveRight(){
        if(this.angle<MAX_THROW_ANGLE)
            this.angle++;
    }
    render(ctx){
        ctx.beginPath();
        ctx.strokeStyle='red';
        
        ctx.moveTo(this.startPosition.x,this.startPosition.y);
        // ctx.lineWidth='40';
        ctx.lineTo(this.startPosition.x+THROW_LINE_LENGTH*Math.sin(this.angle*Math.PI/180),this.startPosition.y-THROW_LINE_LENGTH*Math.cos(this.angle*Math.PI/180));
        // ctx.beginPath();
        ctx.stroke();
        ctx.closePath();
    }
}
class Ground{
    render(ctx){
        ctx.fillStyle=(WINDOW_COLOR);
        ctx.fillRect(0,0,WINDOW_X,WINDOW_Y);
        // console.log("doing");
    }
}
//array making for level 1
for(let i=0;i<9;i++){
    for(let j=0;j<4;j++){
        LEVEL_1_BRICK_ARRAY.push(new Brick(new Vector(((10*i+10)*UnitUsed),((5*j+2.5+10)*UnitUsed)),1,WEAK_BRICK_COLOR));
    }
}
for(let i=2;i<7;i++){
    LEVEL_1_BRICK_ARRAY[4*i].brickLife=2;
    LEVEL_1_BRICK_ARRAY[4*i].color=STRONG_BRICK_COLOR;
}
LEVEL_1_OBSTRUCTIONS_ARRAY.push(LEVEL_1_BRICK_ARRAY[28],LEVEL_1_BRICK_ARRAY[19],LEVEL_1_BRICK_ARRAY[4]);
for(let i=0;i<3;i++){
    LEVEL_1_OBSTRUCTIONS_ARRAY[i].color=OBSTRUCTION_COLOR;
}
LEVEL_1_BRICK_ARRAY.splice(28,1);
LEVEL_1_BRICK_ARRAY.splice(19,1);
LEVEL_1_BRICK_ARRAY.splice(4,1);
LEVEL_1_COLLECTIBLES_ARRAY.push(new EnclosedCollectible('M',14));
//array making for level 2
for(let i=0;i<9;i++){
    for(let j=0;j<4;j++){
        LEVEL_2_BRICK_ARRAY.push(new Brick(new Vector(((10*i+10)*UnitUsed),((5*j+2.5+10)*UnitUsed)),2,STRONG_BRICK_COLOR));
    }
}
for(let i=2;i<7;i++){
    LEVEL_2_BRICK_ARRAY[4*i].brickLife=1;
    LEVEL_2_BRICK_ARRAY[4*i].color=WEAK_BRICK_COLOR;
}
LEVEL_2_OBSTRUCTIONS_ARRAY.push(LEVEL_2_BRICK_ARRAY[28],LEVEL_2_BRICK_ARRAY[19],LEVEL_2_BRICK_ARRAY[4]);
for(let i=0;i<3;i++){
    LEVEL_2_OBSTRUCTIONS_ARRAY[i].color=OBSTRUCTION_COLOR;
}
LEVEL_2_BRICK_ARRAY.splice(28,1);
LEVEL_2_BRICK_ARRAY.splice(19,1);
LEVEL_2_BRICK_ARRAY.splice(4,1);
//
BRICK_GRIDS.push(LEVEL_1_BRICK_ARRAY,LEVEL_2_BRICK_ARRAY);
OBSTRUCTION_GRIDS.push(LEVEL_1_OBSTRUCTIONS_ARRAY,LEVEL_2_OBSTRUCTIONS_ARRAY);
//initial setting up
document.getElementById('lifeCounter').innerHTML=`Lives: ${Life}`;
document.getElementById('scoreCounter').innerHTML=`Score: ${Score}`;
document.getElementById('bulletCounter').innerHTML=`Number of Bullets: ${numberOfBulletsAvailable}`;
let playArea=new Ground();
playArea.render(ct);
let player=new Paddle();
balls.push(new Ball(new Vector(player.pos.x,player.top-BALL_RADIUS),new Vector(0,0)))
let throwLine=new ThrowDirection(balls[0].pos);
var GAME_RUN=setInterval(update,1);
// testing objects
// bricks.push(new Brick(new Vector(frame_x/2,3*frame_y/4),2,STRONG_BRICK_COLOR));//for testing
// bricks.push(new Brick(new Vector(frame_x/4,frame_y/4),2,STRONG_BRICK_COLOR));//for testing
// obstructions.push(new Brick(new Vector(3*frame_x/4,frame_y/4),2,OBSTRUCTION_COLOR));//for testing
// availableCollectibles.push(new EnclosedCollectible('B',0));//for testing
function startGame(){
    ScoreIncrement=1;
    player=new Paddle();
    bricks=BRICK_GRIDS[Level-1];
    obstructions=OBSTRUCTION_GRIDS[Level-1];
    Collectibles=COLLECTIBLE_GRIDS[Level-1];
    balls=[new Ball(new Vector(player.pos.x,player.top-BALL_RADIUS),new Vector(0,0))];
    availableCollectibles=[];
    fallingCollectibles=[];
    activeCollectible=null;
    collectibleTimeRemaining=0;
    featureTimeRemaining=0;
    activeFeature=null;
    numberOfLeft=0;
    numberOfRight=0;
    activeBullets=[];
    caught=true;
    caughtBallIndex=0;
    wrap=false;
    throwLine=new ThrowDirection(balls[0].pos)
    GAME_RUN=setInterval(update,1);
}
function displayLostScreen(score,ctx){
    //pending fn
    clearInterval(GAME_RUN);
    document.getElementById('play_again').style.display='block';
    playArea.render(ct);
    fetch('leaderboard.json').then((response)=>{
        response.text().then((text)=>{
            let LEADERBOARD=JSON.parse(text);
            if(Score>=LEADERBOARD["5"]){
                LEADERBOARD["5"]={player_name:`${Score}`};
                if(Score>=LEADERBOARD["4"]){
                    LEADERBOARD["5"]=LEADERBOARD["4"];
                    LEADERBOARD["4"]={player_name:`${Score}`};
                    if(Score>=LEADERBOARD["3"]){
                        LEADERBOARD["4"]=LEADERBOARD["3"];
                        LEADERBOARD["3"]={player_name:`${Score}`};
                        if(Score>=LEADERBOARD["2"]){
                            LEADERBOARD["3"]=LEADERBOARD[2];
                            LEADERBOARD["2"]={player_name:`${Score}`};
                            if(Score>=LEADERBOARD["1"]){
                                LEADERBOARD["2"]=LEADERBOARD["1"];
                                LEADERBOARD["1"]={player_name:`${Score}`};
                            }
                        }
                    }
                }
            }        
        })
    })
    // if(Score>=LEADERBOARD["5"]){
    //     LEADERBOARD["5"]={player_name:`${Score}`};
    //     if(Score>=LEADERBOARD["4"]){
    //         LEADERBOARD["5"]=LEADERBOARD["4"];
    //         LEADERBOARD["4"]={player_name:`${Score}`};
    //         if(Score>=LEADERBOARD["3"]){
    //             LEADERBOARD["4"]=LEADERBOARD["3"];
    //             LEADERBOARD["3"]={player_name:`${Score}`};
    //             if(Score>=LEADERBOARD["2"]){
    //                 LEADERBOARD["3"]=LEADERBOARD[2];
    //                 LEADERBOARD["2"]={player_name:`${Score}`};
    //                 if(Score>=LEADERBOARD["1"]){
    //                     LEADERBOARD["2"]=LEADERBOARD["1"];
    //                     LEADERBOARD["1"]={player_name:`${Score}`};
    //                 }
    //             }
    //         }
    //     }
    // }
    // fs.writeFileSync(name,JSON.stringify(LEADERBOARD));
    //Reset all vars
    document.getElementById('play_again').onclick=() =>{
        // Level=1;
        // Life=5;
        // Score=0;
        // numberOfBulletsAvailable=0;
        document.getElementById('play_again').style.display='none';
        // url='/play.html';
        location.reload();
        // Reset all vars again(bricks[],obstructions[],balls[],player)
        // startGame();
    }
}
function displayWinScreen(score,ctx){
    //pending fn
    clearInterval(GAME_RUN);
    document.getElementById('next_level').style.display='block';
    document.getElementById('next_level').onclick=() =>{
        Level++;
        document.getElementById('next_level').style.display='none';
        //Reset all vars again(bricks[],obstructions[],balls[],player)
        startGame();
    }
}
function collectibleAction(type){
    if(type=='L'){
        activeCollectible=type;
        document.getElementById('activeCollectible').innerHTML='Long Paddle';
        player.longLength();
        collectibleTimeRemaining=10;
        // setTimeout(endActiveCollectibleAction('L'),10000);
    }
    else if(type=='S'){
        activeCollectible=type;
        document.getElementById('activeCollectible').innerHTML='Short Paddle';
        player.shortLength();
        collectibleTimeRemaining=10;
        // setTimeout(endActiveCollectibleAction('L'),10000);
    }
    else if(type=='B'){
        numberOfBulletsAvailable+=3;
        document.getElementById('bulletCounter').innerHTML=`Number of Bullets: ${numberOfBulletsAvailable}`;
    }
    else if(type=='T'){
        activeCollectible=type;
        document.getElementById('activeCollectible').innerHTML='Teleport On';
        wrap=true;
        collectibleTimeRemaining=10;
    }
    else if(type=='R'){
        document.getElementById('activeCollectible').innerHTML='Reverse Key Function';
        activeCollectible=type;
        collectibleTimeRemaining=10;
    }
    else if(type=='C'){
        catchCount+=3;
    }
    else if(type=='M'){
        let number_of_balls=balls.length
        for(let i=0;i<number_of_balls;i++){
            balls[i].disperse(balls);
        }
    }
    else if(type=='H'){
        Life++;
    }
}
function endActiveCollectibleAction(type){
    activeCollectible=null;
    document.getElementById('activeCollectible').innerHTML='';
    if(type=='L' || type=='S'){
        player.normalLength();
        return;
    }
    if(type=='T'){
        wrap=false;
    }
}
function update(){
    
    //timers
    collectibleTimeRemaining-=0.01;
    featureTimeRemaining-=0.01;
    //action of timers
    if(activeCollectible!=null && collectibleTimeRemaining<=0){
        endActiveCollectibleAction(activeCollectible);
    }
    if(activeFeature!=null && featureTimeRemaining<=0){
        if(activeFeature=='F'){
            player.normalStepSpeed();
            activeFeature=null;
            document.getElementById('activeFeature').innerHTML='';
        }
        if(activeFeature=='S'){
            for(let i=0;i<balls.length;i++){
                balls[i].normalSpeed();
                activeFeature=null;
                document.getElementById('activeFeature').innerHTML='';
            }
        }
    }
    //rendering objects
    playArea.render(ct);
    player.render(ct);
    let LivingBricks=0;
    for(let j=0;j<bricks.length;j++){
        if(bricks[j].brickLife!=0){
            bricks[j].render(ct);
            LivingBricks++;
        }
    }
    for(let j=0;j<obstructions.length;j++){
        obstructions[j].render(ct);
    }
    for(let i=0;i<fallingCollectibles.length;i++){
        fallingCollectibles[i].render(ct);
    }
    for(let i=0;i<activeBullets.length;i++){
        activeBullets[i].render(ct);
    }
    for(let i=0;i<balls.length;i++){
        balls[i].render(ct);
    }
    
    //check for game-end
    if(!LivingBricks){
        displayWinScreen(Score,ct);
    }
    if(Life==0){
        displayLostScreen(Score,ct);
    }
    //most important updates,before return is called by catching part
    for(let i=0;i<activeBullets.length;i++){
        activeBullets[i].updatePos();
        if(activeBullets[i].bottom<=0){
            console.log('doing');
            activeBullets.splice(i,1);
            i--;
            continue;
        }
        for(let j=0;j<bricks.length;j++){
            let temp=bricks[j].brickLife
            if(temp!=0 && bricks[j].hitByBullet(activeBullets[i])){
                Score+=temp;
                document.getElementById('scoreCounter').innerHTML=`Score: ${Score}`;
                activeBullets.splice(i,1);
                i--;
                continue;
            }
        }
        for(let j=0;j<obstructions.length;j++){
            if(obstructions[j].hitByBullet(activeBullets[i])){
                activeBullets.splice(i,1);
                i--;
                continue;
            }
        }
    }
    for(let i=0;i<fallingCollectibles.length;i++){
        if(fallingCollectibles[i].reachedBottom()){
            fallingCollectibles.splice(i,1);
            i--;
            continue;
        }
        if(fallingCollectibles[i].isCollected(player)){
            if(activeCollectible!=null){
                endActiveCollectibleAction(activeCollectible);
            }
            collectibleAction(fallingCollectibles[i].type);
            fallingCollectibles.splice(i,1);
            i--;
            continue;
        }
        fallingCollectibles[i].updatePos();
    }
    // check if balls finished
    if(balls.length==0){
        ScoreIncrement=1;
        Life--;
        document.getElementById('lifeCounter').innerHTML=`Lives: ${Life}`;
        balls.push(new Ball(new Vector(player.pos.x,player.top-BALL_RADIUS),new Vector(0,0)));
        caught=true;
        caughtBallIndex=0;
        throwLine.startPosition=balls[0].pos;
        throwLine.angle=0;
    }
    // console.log(balls[0].velocity);
    //caught function use
    if(caught){
        throwLine.render(ct);
        return;
    }
    //updating data for balls
    for(let i=0;i<balls.length;i++){
        if(balls[i].top>=WINDOW_Y){
            balls.splice(i,1);
            i--;
            continue;
        }
        player.collisionWithBall(balls[i],throwLine);
        for(let j=0;j<bricks.length;j++){
            if(bricks[j].brickLife!=0){
                // bricks[j].render(ct);
                if(bricks[j].isBallColliding(balls[i])){
                    Score+=ScoreIncrement;
                    ScoreIncrement++;
                    document.getElementById('scoreCounter').innerHTML=`Score: ${Score}`;
                    if(bricks[j].brickLife==0){
                        for(let k=0;k<availableCollectibles.length;k++){
                            if(availableCollectibles[k].brickIndex==j){
                                fallingCollectibles.push(new FallingCollectible(bricks[j].pos,availableCollectibles[k].type));
                                availableCollectibles.splice(k,1);
                                break;
                            }
                        }
                    }
                }
            }
        }
        for(let j=0;j<obstructions.length;j++){
            obstructions[j].isBallColliding(balls[i]);
        }
        balls[i].updatePos();
    }

    if(caught){
        // console.log('doign');
        throwLine.render(ct,balls[caughtBallIndex]);    
    }
    // console.log(balls.length);
    // ct.clearRect(0,0,WINDOW_X,WINDOW_Y);
}
function keyPressed(code){
    if(code=='w' || code=='W' || code=='ArrowUp'){
        if(caught){
            balls[caughtBallIndex].throwTheBall(throwLine);
        }
        else if(numberOfBulletsAvailable!=0){
            activeBullets.push(new Bullet(new Vector(player.pos.x,player.pos.y)));
            numberOfBulletsAvailable--;
            document.getElementById('bulletCounter').innerHTML=`Number of Bullets: ${numberOfBulletsAvailable}`;
        }
    }
    else if(code=='a' || code=='A' || code=='ArrowLeft'){
        if(!caught){
            if(activeCollectible=='R'){
                numberOfLeft=0;
                numberOfRight++;
                player.move(1,wrap);
            }
            else{
                numberOfLeft++;
                numberOfRight=0;
                player.move(-1,wrap);
            }
        }
        else{
            throwLine.moveLeft();
        }
    }
    else if(code=='d' || code=='D' || code=='ArrowRight'){
        if(!caught){
            if(activeCollectible=='R'){
                numberOfLeft++;
                numberOfRight=0;
                player.move(-1,wrap);
            }
            else{
                numberOfLeft=0;
                numberOfRight++;
                player.move(1,wrap);
            }
        }
        else{
            throwLine.moveRight();
        }
    }
    else if((code=='f' || code=='F') && document.getElementById('fast_paddle_button').disabled==false && activeFeature==null){
        player.fastStepSpeed();
        featureTimeRemaining=10;
        activeFeature='F';
        document.getElementById('activeFeature').innerHTML='Fast Paddle';

        document.getElementById('fast_paddle_button').disabled=true;
    }
    else if((code=='s' || code=='S') && document.getElementById('slow_ball_button').disabled==false && activeFeature==null){
        for(let i=0;i<balls.length;i++){
            balls[i].slowSpeed();
        }
        featureTimeRemaining=10;
        activeFeature='S';
        document.getElementById('activeFeature').innerHTML='Slow Ball'
        document.getElementById('slow_ball_button').disabled=true;
    }
}
document.onkeydown=(evt)=>keyPressed(evt.key);
document.getElementById('fast_paddle_button').onclick = ()=>{
    keyPressed('F');
}
document.getElementById('slow_ball_button').onclick = ()=>{
    keyPressed('S');
}





