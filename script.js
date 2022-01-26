let canvas=document.getElementById("GameCanvas");
let ct=canvas.getContext("2D");
// let params = (new URL(url)).searchParams;
let params = new URLSearchParams(location.search);
let Level=(params.get('levelSelector')[5]);
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
