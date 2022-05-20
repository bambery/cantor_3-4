const canvas = document.querySelector('.myCanvas');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

// make bg black
ctx.fillStyle = 'rgb(0, 0, 0)';
ctx.fillRect(0, 0, width, height);

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

const fractionPrototype = {
    num: 1,
    den: 1
};

function Fraction( numerator, denominator ) {
    this.num = numerator;
    this.den = denominator;
}

function fractionToString() {
    return `${this.num}/${this.den}`;
}

Fraction.prototype = fractionPrototype;
Fraction.prototype.constructor = Fraction;
Fraction.prototype.toString = fractionToString;

// numerator and denominator for each segment must be computed separately for precision 
const lineSegmentPrototype = {
    left: new Fraction(0, 1),
    right: new Fraction(1, 1),
    length: 1
};

function LineSegment( leftEndpoint,  rightEndpoint ) {
    this.left = leftEndpoint;
    this.right = rightEndpoint;
    length = subtractFrac( this.right, this.left);
    this.length = reduceFrac(length); 
}

function lineSegmentToString() {
    return `Left: ${this.left.num}/${this.left.den}, Right: ${this.right.num}/${this.right.den}`;
}

LineSegment.prototype = lineSegmentPrototype;
LineSegment.prototype.constructor = LineSegment;
LineSegment.prototype.toString = lineSegmentToString;

// pass in the minuend first (the number to be subtracted from)
function subtractFrac(left, right){
    const numerator = (left.num * right.den) - (left.den * right.num);
    const denominator = left.den * right.den;
    return new Fraction(numerator, denominator); 
}

function addFrac(left, right){
    const numerator = (left.num * right.den) + (left.den * right.num);
    const denominator = left.den * right.den;
    return new Fraction(numerator, denominator);
}

function removeThird(segment) {
    //     LEFT           RIGHT
    // |-----|-----|     |-----|
    // LL          LR   RL     RR
    // returns two line segments and the length of the removed interval
   
    // the length of each quarter is the length of the interval divided by 4
    const quarter = new Fraction(1, segment.length.den * 4);
    
    // left segment
    ll = segment.left; 
    // (2 * the length of a quarter) + left endpoint
    lr = addFrac(new Fraction(quarter.num * 2, quarter.den), ll);
    leftSeg = new LineSegment( reduceFrac(ll), reduceFrac(lr) );

    // right segment
    rr = segment.right;
    rl = subtractFrac(rr, quarter);
    rightSeg = new LineSegment( reduceFrac(rl), reduceFrac(rr) );

    return [leftSeg, rightSeg];
}

function reduceFrac(frac){
    if (frac.num === 0 || frac.den === 0){
        return frac; 
    } else if ( frac.num === frac.den ){
        // do not reduce the rightmost interval
        return frac;
    }

    x = frac.num;
    y = frac.den;

    mod = null; 
    while( mod != 0){
        mod = x % y;
        x = y;
        y = mod;
    }
    return new Fraction( frac.num / x, frac.den / x );
}

function cantor3_4(iterations) {
    if ( iterations <= 1 ) {
        return -1;
    }
    results = [new LineSegment( new Fraction(0, 1), new Fraction(1, 1) )];
    while (iterations > 0) {
        currResults = []
        for (const segment in results) {
            noop;
            
        }
        iterations = iterations - 1;
    }
    debugger;
    
}

cantor3_4();
/*
const foo = new LineSegment(0, 1, 1, 1);
const [fooL, fooR] = removeThird(foo);
console.log("finished 1");
const [barL, barR] = removeThird(fooL);
console.log("finished 2");
const [bazL, bazR] = removeThird(fooR);
console.log("finished");
const [mooL, mooR] = removeThird(barL);
const [booL, booR] = removeThird(barR);
const [shoeL, shoeR] = removeThird(bazL);
const [newL, newR] = removeThird(bazR);
*/
