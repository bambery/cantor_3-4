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

// numerator and denominator for each segment must be computed separately for precision 
const lineSegmentPrototype = {
    lNum: 0,
    lDen: 1,
    rNum: 1,
    rDen: 1,
    length: 1
}

function LineSegment( leftNum, leftDen,  rightNum, rightDen ) {
    this.lNum = leftNum;
    this.lDen = leftDen;
    this.rNum = rightNum;
    this.rDen = rightDen;
    [lengthNum, lengthDen] = subtractFrac( rightNum, rightDen, leftNum, leftDen)
    [this.lengthNum, this.lengthDen] = reduceFrac(lengthNum, lengthDen) 
}

function lineSegmentToString() {
    return `Left: ${this.lNum}/${this.lDen}, Right: ${this.rNum}/${this.rDen}`;
}

LineSegment.prototype = lineSegmentPrototype;
LineSegment.prototype.constructor = LineSegment;
LineSegment.prototype.toString = lineSegmentToString;


function subtractFrac(n1, d1, n2, d2){
    const numerator = (n1 * d2) - (d1 * n2);
    const denominator = d1 * d2;

    return [numerator, denominator];
}

function addFrac(n1, d1, n2, d2){
    const numerator = (n1 * d2) + (d1 * n2);
    const denominator = d1 * d2;

    return [numerator, denominator];
}


function removeThird(segment) {
    debugger;
    // the size of each quarter in this segment is the length of the interval divided by 4
   
    [quartNum, quartDen] = subtractFrac(segment.rNum, segment.rDen, segment.lNum, segment.lDen);
    
    quartDen = quartDen * 4;
    
    // left segment
    llNum = segment.lNum; 
    llDen = segment.lDen;

    [lrNum, lrDen] = addFrac(2 * quartNum, quartDen, llNum, llDen);
    
    // right segment
    [rlNum, rlDen] = subtractFrac(segment.rNum, segment.rDen, quartNum, quartDen);

    rrNum = segment.rNum; 
    rrDen = segment.rDen; 

    console.log(rrDen);
   [llNum, llDen] = reduceFrac(llNum, llDen);
   [lrNum, lrDen] = reduceFrac(lrNum, lrDen);
   [rrNum, rrDen] = reduceFrac(rrNum, rrDen);
   [rlNum, rlDen] = reduceFrac(rlNum, rlDen);

    const leftSegment = new LineSegment(llNum, llDen, lrNum, lrDen);
    const rightSegment = new LineSegment(rlNum, rlDen, rrNum, rrDen);
    debugger;

    return [leftSegment, rightSegment];
}

function reduceFrac(numerator, denominator){
    debugger;
    if (numerator === 0 || denominator === 0){
        return [numerator, denominator];
    } else if ( numerator === denominator ){
        // do not reduce the rightmost interval
        return [numerator, denominator];
    }

    x = numerator;
    y = denominator;

    mod = 100
    while( mod != 0){
        console.log(mod);
        debugger;
        mod = x % y;
        x = y;
        y = mod;
    }
    return [ numerator / x, denominator / x ]
}

foo = new LineSegment(0, 1, 1, 1);
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
