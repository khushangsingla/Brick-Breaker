let canvas=document.getElementById("GameCanvas");
let ct=canvas.getContext("2D");
// let params = (new URL(url)).searchParams;
let params = new URLSearchParams(location.search);
let Level=(params.get('levelSelector')[5]);
console.log(Level);

//global variables representing various constants of game
//Window
const WINDOW_Y=1/*val left */;
const WINDOW_X=1/*val left */;
//Bullet
const BULLET_SPEED=1/*val left */ ;
const BULLET_HEIGHT=1/*val left */ ;
const BULLET_WIDTH=1/*val left */ ;
const BULLET_COLOR=COLOR("rgb(256,0,0)");
//Brick
const BRICK_HEIGHT=1/*val left */;
const BRICK_WIDTH=1/*val left */;
//Collectible(Falling)
const COLLECTIBLE_RADIUS=1/*val left */;
const COLLECTIBLE_COLOR=COLOR("rgb(256,0,0)")/*val left */;
const COLLECTIBLE_SPEED=1/*val left */;
//Paddle
const PADDLE_HEIGHT=1/*val left */;
const PADDLE_WIDTH=1/*val left */;
const PADDLE_STEP_SPEED=1/*val left */;
const FAST_PADDLE_STEP_SPEED=1/*val left */;
const LONG_PADDLE_WIDTH=1/*val left */;
const SHORT_PADDLE_WIDTH=1/*val left */;
//Required variables
let bricks=[]; //array of bricks that can be broken
let obstructions=[]; //array of unbreakable bricks
let balls=[]; //array of balls in the game
let availableCollectibles=[]; //array of collectibles that do exist in the game
let fallingCollectibles=[]; //array of collectibles that are released and are falling
let activeCollectible=null; //if there's an active collectible, it's initial will be stored here
let numberOfLeft=0; //number of continuous left movements made
let numberOfRight=0; //number of continuous right movements made
let activeBullets=[]; //this is array of bullets that are released and are yet to hit a brick
let numberOfBulletsAvailable=0; //this is number of bullets available with player
let Caught=true; //if the ball is caught by paddle, it is true
let catchCount=0; //this has the number of catch counts available with the player
let Life=3; //Total life of player
let Score=0; //Total Score
//Class for vectors
class Vector{
    constructor(x,y){
        this.x=x;
        this.y=y;
    }
    sum(vec=Vector()){//for A and B to be two vectors, A.sum(B) is equivalent to A+=B
        this.x+=vec.x;
        this.y+=vec.y;
    }
    product(n){//scalar multiplication of n by vector
        this.x*=n;
        this.y*=n;
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
}

class StaticObject extends Object{

}

class MovingObject extends Object{
    constructor(pos=new Vector(), dmns=new Vector(), color, speed=new Vector){
        super(pos,dmns,color);
        this.velocity=speed;
    }
    updatePos(step_time){
        this.pos.sum(this.speed.product(step_time));
    }
}

class Brick extends StaticObject{

}

class Ball extends MovingObject{

}
class Paddle extends StaticObject{
    constructor(){
        super(new Vector(WINDOW_X/2.0,WINDOW_Y-PADDLE_HEIGHT/2.0),new Vector(PADDLE_WIDTH,PADDLE_HEIGHT),PADDLE_COLOR);
        this.stepDistance=new Vector(PADDLE_STEP_SPEED,0);
    }
    move(dir,is_wrap){
        if(!is_wrap){
            if(this.left<0 && dir==-1){return;}
            if(this.right>WINDOW_X && dir==1){return;}
            this.pos.sum(this.stepDistance.product(dir));
            this.refreshContents();
            return;
        }
        if(is_wrap){
            this.pos.sum(this.stepDistance.product(dir));
            if(this.pos.x<=0){
                this.pos.x=WINDOW_X+this.pos.x;
            }
            else if(this.pos.x>WINDOW_Y){
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
    // collisionWithBall(){
//to be completed after completion of ball
    // }
}

class Bullet extends MovingObject{
    constructor(pos=new Vector()){
        super(pos,new Vector(BULLET_WIDTH,BULLET_HEIGHT),BULLET_COLOR,new Vector(0,BULLET_SPEED));
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
    isCollected(paddle){
        if(this.bottom>paddle.top && this.right>paddle.left && this.left<paddle.right && this.top>paddle.bottom){
            return true;
        }
    }
    reachedBottom(){
        return (this.top>=WINDOW_Y);
    }
}

class ThrowDirection{

}