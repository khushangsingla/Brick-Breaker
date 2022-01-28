var canvas=document.getElementById("GameCanvas");
var ct=canvas.getContext("2d");
// let params = (new URL(url)).searchParams;
let params = new URLSearchParams(location.search);
let Level=(params.get('levelSelector')[5]);
// console.log("hi");
let frame_x=document.getElementById("game_area").offsetWidth;
let frame_y=document.getElementById("game_area").offsetHeight;
if(frame_x>1.5*frame_y){frame_x=1.5*frame_y;}
else{frame_y=2*frame_x/3.0}
ct.canvas.width  = frame_x;
ct.canvas.height = frame_y;

//global variables representing various constants of game
//Window
const WINDOW_Y=frame_y;
const WINDOW_X=frame_x;
const WINDOW_COLOR='rgb(230,230,230)';
const STEP_TIME=1/*val left */;
//Bullet
const BULLET_SPEED=1/*val left */ ;
const BULLET_HEIGHT=1/*val left */ ;
const BULLET_WIDTH=1/*val left */ ;
const BULLET_COLOR="rgb(256,0,0)";
//Brick
const BRICK_HEIGHT=0.05*frame_x/*val left */;
const BRICK_WIDTH=0.1*frame_x/*val left */;
let STRONG_BRICK_COLOR='rgb(255,0,0)';
let WEAK_BRICK_COLOR='rgb(155,0,0)';
//Collectible(Falling)
const COLLECTIBLE_RADIUS=1/*val left */;
const COLLECTIBLE_COLOR="rgb(256,0,0)"/*val left */;
const COLLECTIBLE_SPEED=1/*val left */;
//Paddle
const PADDLE_HEIGHT=0.02*frame_y/*val left */;
const PADDLE_WIDTH=0.1*frame_x/*val left */;
const PADDLE_STEP_SPEED=0.005*frame_x/*val left */;
const FAST_PADDLE_STEP_SPEED=0.01*frame_x/*val left */;
const LONG_PADDLE_WIDTH=1/*val left */;
const SHORT_PADDLE_WIDTH=1/*val left */;
const PADDLE_COLOR='rgb(0,0,255)';
//Ball
const BALL_SPEED_Y=frame_y/200/*val left */;
const SLOW_BALL_FACTOR=0.8/*val left */;
const BALL_RADIUS=0.01*frame_x/*val left */;
const BALL_COLOR_OUT='rgb(20,20,20)'/*val left */;
const BALL_COLOR_IN='rgb(180,180,180)'/*val left */;

//throw direction
const THROW_LINE_LENGTH=0.05*frame_y/*val left */;
const MAX_THROW_ANGLE=80;//in degrees;
const THROW_LINE_COLOR='rgb(255,0,0)';
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
let caught=true; //if the ball is caught by paddle, it is true
let caughtBallIndex=0;
let catchCount=0; //this has the number of catch counts available with the player
let Life=3; //Total life of player
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
    constructor(pos=new Vector(), dmns=new Vector(), color, speed=new Vector){
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
        this.velocity/=SLOW_BALL_FACTOR;
    }
    normalSpeed(){
        this.velocity*=SLOW_BALL_FACTOR;
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
}

class Brick extends StaticObject{
    constructor(pos=new Vector(), brick_lives, color){
        super(pos,new Vector(BRICK_WIDTH,BRICK_HEIGHT),color);
        this.brickLife=brick_lives;
    }
    isBallColliding(ball=new Ball()){
        if(ball.right >= this.left && ball.left <= this.right && ball.bottom >= this.top && ball.top <= this.bottom){
            console.log(ball.top,this.bottom);
            this.brickLife-=1;
            let dist_along_x=Math.abs(ball.pos.x-this.pos.x);
            let dist_along_y=Math.abs(ball.pos.y-this.pos.y);
            let touch_dist_along_x=(ball.size.x+this.size.x)/2.0;
            let touch_dist_along_y=(ball.size.y+this.size.y)/2.0;
            if(touch_dist_along_x-dist_along_x<touch_dist_along_y-dist_along_y){
                ball.updateSpeedX(-2*ball.velocity.x);
            }
            else{
                ball.reverseSpeedY();
            }
            return true;
        }
        else{
            return false;
        }
    }
    render(ctx){
        if(this.color==WEAK_BRICK_COLOR){
            ctx.beginPath();
            let grad=ctx.createRadialGradient(this.pos.x,this.pos.y,0,this.pos.x,this.pos.y,Math.max(this.size.x/2.0,this.size.y/2.0));
            grad.addColorStop(0,'rgb(155,70,70)');
            grad.addColorStop(1,color);
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
    collisionWithBall(ball=new Ball(),lineOfThrow=new ThrowDirection()){
        if(ball.bottom>=this.top && ball.pos.y<this.top&& ball.left<this.right && ball.right>this.left && ball.velocity.y>0){
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
    render(ctx){
        grad=ctx.createRadialGradient(this.pos.x,this.pos.y,COLLECTIBLE_RADIUS*0.8,this.pos.x,this.pos.y,COLLECTIBLE_RADIUS)
        ctx.addColorStop(0,WINDOW_COLOR);
        ctx.addColorStop(1,rgb(230,230,230));
        ctx.fillStyle=grad;
        ctx.beginPath();
        ctx.arc(this.pos.x,this.pos.y,COLLECTIBLE_RADIUS,0,2*Math.PI);
        ctx.closePath();
        ctx.fillStyle='rgb(0,255,0)';
        ctx.fillText(type,this.pos.x,this.pos.y,1.2*COLLECTIBLE_RADIUS);
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

//initial setting up
let playArea=new Ground;
playArea.render(ct);
let player=new Paddle;
player.render(ct);
balls.push(new Ball(new Vector(player.pos.x,player.top-BALL_RADIUS),new Vector(0,0)));
balls[0].render(ct);
let throwLine=new ThrowDirection(balls[0].pos);
// throwLine.render(ct,balls[caughtBallIndex]);
bricks.push(new Brick(new Vector(frame_x/2,frame_y/2),2,STRONG_BRICK_COLOR));
// bricks[0].render(ct);
// console.log(player.bottom);
// let player=new Paddle(WINDOW_X/2.0,WINDOW_Y);
function update(){
    playArea.render(ct);
    player.render(ct);
    for(let j=0;j<bricks.length;j++){
        if(bricks[j].brickLife!=0){
            bricks[j].render(ct);
        }
    }
    // if(balls.pos.y>WINDOW_Y)
    if(balls.length==0){
        Life--;
        balls.push(new Ball(new Vector(player.pos.x,player.top-BALL_RADIUS),new Vector(0,0)));
        caught=true;
        caughtBallIndex=0;
        throwLine.startPosition=balls[0].pos;
        throwLine.angle=0;
    }
    if(caught){
        // console.log('doign');
        throwLine.render(ct);
    }
    
    for(let i=0;i<balls.length;i++){
        if(balls[i].top>=WINDOW_Y){
            balls.splice(i,1);
            i--;
            continue;
        }
        balls[i].render(ct)
        player.collisionWithBall(balls[i],throwLine);
        for(let j=0;j<bricks.length;j++){
            if(bricks[j].brickLife!=0){
                // bricks[j].render(ct);
                if(bricks[j].isBallColliding(balls[i])){
                    Score++;
                }
            }
        }
        // for(let j=0;j<obstructions.length;j++){
        //     obstructions[j].render(ct);
        //     obstructions[j].brickLife(balls[i]);
        // }
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
    }
    if(code=='a' || code=='A' || code=='ArrowLeft'){
        if(!caught){
            numberOfLeft++;
            numberOfRight=0;
            player.move(-1,0);
        }
        else{
            throwLine.moveLeft();
        }
    }
    if(code=='d' || code=='D' || code=='ArrowRight'){
        if(!caught){
            numberOfLeft=0;
            numberOfRight++;
            player.move(1,0);
        }
        else{
            throwLine.moveRight();
        }
    }
}
// ct.strokeStyle='red';
// ct.moveTo(0,0);
// ct.lineTo(400,400);
// ct.stroke();

setInterval(update,1);
document.onkeydown=(evt)=>keyPressed(evt.key);