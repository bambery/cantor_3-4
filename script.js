'use strict';

const fractionPrototype = {
    num: 1,
    den: 1
};

function Fraction( numerator, denominator ) {
    this.num = numerator;
    this.den = denominator;
    this.reduceFrac = function reduceFrac(){
        if (this.num === 0 || this.den === 0){
            return this; 
        } else if ( this.num === this.den ){
            // do not reduce the rightmost interval
            return this;
        }

        var x = this.num;
        var y = this.den;

        var mod = null; 
        while( mod != 0){
            mod = x % y;
            x = y;
            y = mod;
        }
        return new Fraction( this.num / x, this.den / x );
    };
};

function fractionToString() {
    return `${this.num}/${this.den}`;
};

Fraction.prototype = fractionPrototype;
Fraction.prototype.constructor = Fraction;
Fraction.prototype.toString = fractionToString;

// numerator and denominator for each segment must be computed separately for precision 
const lineSegmentPrototype = {
    left: new Fraction(0, 1),
    right: new Fraction(1, 1),
    size: new Fraction(1, 1)
};

// expects two fractions
// returns a Line Segment
function LineSegment( leftEndpoint,  rightEndpoint ) {
    this.left = leftEndpoint;
    this.right = rightEndpoint;

    const length = subtractFrac( this.right, this.left);
    // "length" is a property on Array I don't want to shadow, using "size" for the size of the interval
    this.size = length.reduceFrac(); 
};

function lineSegmentToString() {
    return `Left: ${this.left.num}/${this.left.den}, Right: ${this.right.num}/${this.right.den}, Length: ${this.size}`;
};

LineSegment.prototype = lineSegmentPrototype;
LineSegment.prototype.constructor = LineSegment;
LineSegment.prototype.toString = lineSegmentToString;

// write a function for checking type via obj.__proto__.constructor.name
// investigate new additions to js for null/undefined checks
//function type(obj){
//
//}

// input: array of one or more LineSegments
function SegmentCollection(segments){
    this.segments = segments;
    this.count = segments.length;

    this.size = function size(){
        var size = new Fraction(0, 1);
        this.segments.forEach( segment =>{ size = addFrac(size, segment.size) }); 
        size = size.reduceFrac();
        return size;
    };
    
    this.gapSize = function gapSize(){
        var foo = subtractFrac(new Fraction(1,1), this.size());
        return foo;
    };

    this.allGaps = function allGaps(){
        this.segments.forEach( segment => { console.log(segment.toString()) });
        console.log(`Total gap size: ${this.gapSize()}.`);
    }

    this.push = function push(segmentArr){
        segmentArr.forEach( segment => { this.segments.push(segment) } );
    }

    this.smallestInterval = function smallestInterval() {
        return this.segments[this.segments.length - 1].size.den;
    }

    this.convertToCommonDen = function convertToCommonDen() {
        const interval = this.smallestInterval(); 
        const commonDen = this.segments.map(segment => {
            // yeah I don't like it either, should have found a fraction library or something
            const Lmultiple     = interval / segment.left.den;
            const Rmultiple     = interval / segment.right.den;
            const lenMultiple   = interval / segment.size.den;
            const newLeft       = new Fraction(segment.left.num * Lmultiple, segment.left.den * Lmultiple);
            const newRight      = new Fraction(segment.right.num * Rmultiple, segment.right.den * Rmultiple);
            const newLength     = new Fraction(segment.size.num * lenMultiple, segment.size.den * lenMultiple);

            const tempSeg = new LineSegment(newLeft, newRight); 
            tempSeg.size = newLength;
            return tempSeg;
        });
        return commonDen;
    }

};

// pass in the minuend first (the number to be subtracted from)
function subtractFrac(left, right){
    const numerator = (left.num * right.den) - (left.den * right.num);
    const denominator = left.den * right.den;
    // can/should I declare this return value const?
    return new Fraction(numerator, denominator); 
};

function addFrac(left, right){
    const numerator = (left.num * right.den) + (left.den * right.num);
    const denominator = left.den * right.den;
    return new Fraction(numerator, denominator);
};

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
    const leftSeg = new LineSegment( ll.reduceFrac(), lr.reduceFrac() );

    // right segment
    const rr = segment.right;
    const rl = subtractFrac(rr, quarter);
    const rightSeg = new LineSegment( rl.reduceFrac(), rr.reduceFrac() );

    return [leftSeg, rightSeg];
};


function cantor3_4(iterations) {
    if ( iterations < 1 ) {
        return -1;
    }
    const initialCollection = [new LineSegment( new Fraction(0, 1), new Fraction(1, 1) )];
    const results = [];
    const myCol = new SegmentCollection(initialCollection);

    while (iterations > 0) {
        var currResults = [];
        myCol.segments.forEach( segment => {
            currResults.push( ...( removeThird(segment) ) );
        })
        myCol.segments = currResults;
        iterations = iterations - 1;
        results.push(...currResults);
    }
    return results;
};



//////////////////////////////////////////////
// https://bucephalus.org/text/CanvasHandbook/CanvasHandbook.html
//////////////////////////////////////////////

function fillCircle (contextObj, x, y, r) {
    contextObj.beginPath();
    contextObj.arc(x, y, r, 0, 2* Math.PI);
    contextObj.fill();
};

// the x and y provided are the location of the dot under which the fraction will be displayed
function drawFraction (ctx, frac, x, y){

    const oldStyle = ctx.strokeStyle;
    const oldLineWidth = ctx.lineWidth;
    const oldFont = ctx.font;

    const endpointFontBaseline = "top";
    const fracBarWidth = 1.0;
    const fracBarPad = 2;
    const endpointFontTop = 15;

    ctx.font = `${fontSize}px Verdana`;

    frac = frac.reduceFrac();

    ctx.lineWidth = fracBarWidth; 
    ctx.textBaseline = endpointFontBaseline;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    
    // draw numerator
    const numTop = y + endpointFontTop;
    ctx.fillText(frac.num, x, numTop);

    // draw bar under numerator
    const lineLen = Math.max( ctx.measureText(frac.num).width, ctx.measureText(frac.den).width );
    ctx.beginPath()
    // what's that sneaky 0.5 at the end? It's so the line is crisp and white and not grey and fat
    // https://bucephalus.org/text/CanvasHandbook/CanvasHandbook.html#linewidth
    const barTop = numTop + fontSize + fracBarPad + 0.5;
    ctx.moveTo( x - lineLen/2, barTop);
    ctx.lineTo(x + lineLen/2, barTop);
    ctx.stroke();
    // draw denominator
    const denTop = barTop + fracBarWidth + fracBarPad;
    ctx.fillText(frac.den, x, denTop);

    // return changed styles to what they were before this fxn call
    ctx.strokeStyle = oldStyle;
    ctx.lineWidth = oldLineWidth;
    ctx.font = oldFont;
}




function drawNumberline(ctx, segCol){
    const numberlineWidth = 2.0;
    const intervalLineWidth = 4.0; 

    // draw numberline
    ctx.lineWidth = numberlineWidth;
    ctx.beginPath();
    ctx.moveTo(margin, midH);
    ctx.lineTo(width - margin, midH);
    ctx.stroke();
    
    // for rendering this iteration, the smallest interval will determine the endpoints
    const interval = foo.smallestInterval();
    const intervalLength = ( width - (margin * 2) )/interval;
    const start = margin;
    const commonSeg = segCol.convertToCommonDen();

    commonSeg.forEach( function(segment, index) {
        // draw red segments on numberline
        const startPix = start + (segment.left.num * intervalLength);
        const segLength = segment.size.num * intervalLength; 
        const endPix = startPix + segLength; 
        // midpoint of this segment
        const midPoint = (segLength/2) + startPix;

        ctx.lineWidth = intervalLineWidth;
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(startPix, midH);
        ctx.lineTo(endPix, midH);
        ctx.stroke();

        // label endpoints of segment
        ctx.fillStyle = 'white';
        fillCircle(ctx, startPix, midH, dotSize);
        fillCircle(ctx, endPix, midH, dotSize);
        drawFraction(ctx, segment.left, startPix, midH);
        drawFraction(ctx, segment.right, endPix, midH);

        //label the segments from left to right 
        ctx.fillStyle = '#609ab8';
        ctx.textBaseline = 'bottom';
        const numBottomMargin = 15;
        ctx.font = `30px Verdana`;
        ctx.fillText(index + 1, midPoint, midH - numBottomMargin);

    });
}


function createCanvas(index){
    const canvasesDiv = document.getElementById("canvases");
    const newCanvasDiv = document.createElement("div");
    newCanvasDiv.className = ".numberline";
    canvasesDiv.appendChild(newCanvasDiv);

    const canvas = document.createElement("canvas");
    canvas.id = `canvas-${index + 1}`;
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = 200;
    newCanvasDiv.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // make bg black
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    return ctx;
}

const numberlines = cantor3_4(1);

numberlines.forEach((segmentColl, index) => {
    const ctx = createCanvas(index);

    const width = ctx.canvas.offsetWidth;
    const height = ctx.canvas.offsetHeight;
    const midH = Math.floor(height/2);

    var margin = 30;
    const dotSize = 5;
    const fontSize = 15;
    ctx.textAlign = 'center';
    ctx.font = `${fontSize}px Verdana`;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';

    drawNumberline(ctx, segmentColl);
});

//drawNumberline(ctx, foo);
