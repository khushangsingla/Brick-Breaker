class Vector{
    constructor(x,y){
        this.x=x;
        this.y=y;
    }
    sum(vec=Vector()){
        this.x+=vec.x;
        this.y+=vec.y;
    }
    product(n){
        this.x*=n;
        this.y*=n;
    }
}

let vec1=new Vector(1,2);
let vec2=new Vector(2,3);
console.log(vec1.x);
console.log(vec1.y);
vec1.product(2);
console.log(vec1.x);
console.log(vec1.y);