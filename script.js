let canvas=document.getElementById("GameCanvas");
let ct=canvas.getContext("2D");
// let params = (new URL(url)).searchParams;
let params = new URLSearchParams(location.search);
let Level=(params.get('levelSelector')[5]);

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
let Caught=true; //if the ball is caught by paddle, it is true
let catchCount=0; //this has the number of catch counts available with the player


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
