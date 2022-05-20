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
    size: new Fraction(1, 1)
};

function LineSegment( leftEndpoint,  rightEndpoint ) {
    this.left = leftEndpoint;
    this.right = rightEndpoint;

    const length = subtractFrac( this.right, this.left);
    // "length" is a property on Array I don't want to shadow, using "size" for the size of the interval
    this.size = reduceFrac(length); 
}

function lineSegmentToString() {
    return `Left: ${this.left.num}/${this.left.den}, Right: ${this.right.num}/${this.right.den}, Length: ${this.size}`;
}

LineSegment.prototype = lineSegmentPrototype;
LineSegment.prototype.constructor = LineSegment;
LineSegment.prototype.toString = lineSegmentToString;

// write a function for checking type via obj.__proto__.constructor.name
//function type(obj){
//
//}

// input: array of one or more LineSegments
function SegmentCollection(segments){
    this.segments = segments;
    this.count = segments.length;

    this.size = function size(){
        var size = new Fraction(0, 1);
        segments.forEach( segment =>{ size = addFrac(size, segment.size) }); 
        size = reduceFrac(size);
        return size;
    };
    
    this.gapSize = function gapSize(){
        var foo = subtractFrac(new Fraction(1,1), this.size());
        return foo;
    };

    this.allGaps = function allGaps(){
        segments.forEach( segment => { console.log(segment.toString()) });
        console.log(`Total gap size: ${this.gapSize()}.`);
    }

    this.push = function push(segmentArr){

        segmentArr.forEach( segment => { this.segments.push(segment) } );
    }
}

// pass in the minuend first (the number to be subtracted from)
function subtractFrac(left, right){
    const numerator = (left.num * right.den) - (left.den * right.num);
    const denominator = left.den * right.den;
    // can/should I declare this return value const?
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
    const quarter = new Fraction(1, segment.size.den * 4);
    
    // left segment
    const ll = segment.left; 
    // (2 * the length of a quarter) + left endpoint
    const lr = addFrac(new Fraction(quarter.num * 2, quarter.den), ll);
    const leftSeg = new LineSegment( reduceFrac(ll), reduceFrac(lr) );

    // right segment
    const rr = segment.right;
    const rl = subtractFrac(rr, quarter);
    const rightSeg = new LineSegment( reduceFrac(rl), reduceFrac(rr) );

    return [leftSeg, rightSeg];
}

function reduceFrac(frac){
    if (frac.num === 0 || frac.den === 0){
        return frac; 
    } else if ( frac.num === frac.den ){
        // do not reduce the rightmost interval
        return frac;
    }

    var x = frac.num;
    var y = frac.den;

    var mod = null; 
    while( mod != 0){
        mod = x % y;
        x = y;
        y = mod;
    }
    return new Fraction( frac.num / x, frac.den / x );
}

function cantor3_4(iterations) {
    if ( iterations < 1 ) {
        return -1;
    }
    var results = [new LineSegment( new Fraction(0, 1), new Fraction(1, 1) )];
    const myCol = new SegmentCollection(results);

    while (iterations > 0) {
        var currResults = [];
        myCol.segments.forEach( segment => {
            currResults.push( ...( removeThird(segment) ) );
        })
        myCol.segments = currResults;
        iterations = iterations - 1;
    }
    return myCol;
}

//foo = cantor3_4(3);

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
