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
        return subtractFrac(new Fraction(1,1), this.size());
    };

    this.gaps = function allGaps(){
        const gaps = [];
        for(let i=0; i < this.segments.length - 1; i++) {
            const gap = new LineSegment( this.segments[i].right, this.segments[i + 1].left )
            gaps.push(gap);
        }
        return gaps;
    };

    this.push = function push(segmentArr){
        segmentArr.forEach( segment => { this.segments.push(segment) } );
    };

    this.smallestInterval = function smallestInterval() {
        return this.segments[this.segments.length - 1].size.den;
    };

    this.convertToCommonDen = function convertToCommonDen(segment_or_gap) {
        if( segment_or_gap === "segment" ){
            var segArr = this.segments;
        } else if ( segment_or_gap === "gap" ){
            // TODO: this should not be a fxn when .segments is an Arr - convert to iife or find other solution
            // probably should refactor the structures now that I know how I am using them
            var segArr = this.gaps();
        } else {
            throw {toString: function() { return "You must pass 'segment' or 'gap'";} }; 
        }

        const interval = this.smallestInterval(); 
        const commonDen = segArr.map(segment => {
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
    };

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
    var myCol = new SegmentCollection(initialCollection);
    const results = [];

    while (iterations > 0) {
        var currResults = [];
        myCol.segments.forEach( segment => {
            currResults.push( ...( removeThird(segment) ) );
        })
        myCol = new SegmentCollection( currResults );
        iterations = iterations - 1;
        results.push(myCol);
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
//    const oldBaseline = ctx.u

    const endpointFontBaseline = "top";
    const fracBarWidth = 1.0;
    const fracBarPad = 2;
    const endpointFontTop = 15;
    const fracFontSize = 15; 

    ctx.font = `${fracFontSize}px Verdana`;

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
    // what's that sneaky 0.5 at the end? It's so the line is crisp and white and not fat and grey
    // https://bucephalus.org/text/CanvasHandbook/CanvasHandbook.html#linewidth
    const barTop = numTop + fracFontSize + fracBarPad + 0.5;
    ctx.moveTo( x - lineLen/2, barTop);
    ctx.lineTo(x + lineLen/2, barTop);
    ctx.stroke();
    // draw denominator
    const denTop = barTop + fracBarWidth + fracBarPad;
    ctx.fillText(frac.den, x, denTop);

    // return changed styles to what they were before this fxn call
    // TODO: try getting rid of this and explicitly setting attr each time.
    // do people write helpers to set certain contexts that must be returned to frequently?
    ctx.strokeStyle = oldStyle;
    ctx.lineWidth = oldLineWidth;
    ctx.font = oldFont;
}

function drawAllNumberlines(numIter){

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
        const interval = segCol.smallestInterval();
        const intervalLength = ( width - (margin * 2) )/interval;
        const start = margin;
        const commonSeg = segCol.convertToCommonDen("segment");

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

            // you need a really wide screen to be able to see the endpoints on the numberline past the 3rd iteration
            // For the fourth iter and beyond, omit the labels but draw the points
            // doin this check twice - how to do it only once?
            ctx.fillStyle = 'white';
            fillCircle(ctx, startPix, midH, dotSize);
            fillCircle(ctx, endPix, midH, dotSize);

            if( segCol.count < 9 ){
                ctx.font = `30px Verdana`;
                // label endpoints of segment
                drawFraction(ctx, segment.left, startPix, midH);
                drawFraction(ctx, segment.right, endPix, midH);
                
            } else if ( segCol.count < 32 ){
                ctx.font = "16px Verdana"
            } else if (segCol.count >= 32){
                ctx.font = "8px Verdana"
            }
            
            //label the segments from left to right 
            ctx.fillStyle = '#e5b513';
            ctx.textBaseline = 'bottom';
            const numBottomMargin = 15;
            ctx.fillText(index + 1, midPoint, midH - numBottomMargin);
        });

        if( segCol.count < 9 ){
            const commonGap = segCol.convertToCommonDen("gap");
            commonGap.forEach( function(segment, index) {
                const startPix = start + (segment.left.num * intervalLength);
                const segLength = segment.size.num * intervalLength;
                const midPoint = (segLength/2) + startPix;
                
                //label the segments from left to right 
                ctx.fillStyle = '#609ab8';
                ctx.textBaseline = 'bottom';
                const numBottomMargin = 15;
                ctx.font = `20px Verdana`;
                ctx.fillText( String.fromCharCode(index + 65), midPoint, midH - numBottomMargin );
            });
        }
    } // end drawNumberline

    // this cannot be combined with displaying the numberline because the denominators are in reduced form for each endpoint, which does not work for the numberline
    function displayInfo(displayDiv, segmentCollection){
        if ('content' in document.createElement('template')) {
            // display summary
            var template = document.querySelector("#segment-data-summary-template");
            var summaryContainer = document.createElement('div');
            summaryContainer.className = 'segment-summary-container';
            displayDiv.appendChild(summaryContainer);

            // segments
            var cloneSummarySegment = template.content.cloneNode(true);
            var th = cloneSummarySegment.querySelectorAll("th");
            th[0].textContent = "Number of Intervals:";
            th[1].textContent = "Total Length of Intervals:";

            var td = cloneSummarySegment.querySelectorAll("td");
            td[0].textContent = `${segmentCollection.count.toString()}`;
            td[1].textContent = `${segmentCollection.size().toString()}`;
            summaryContainer.appendChild(cloneSummarySegment);

            // gaps
            var cloneGapSegment = template.content.cloneNode(true);
            th = cloneGapSegment.querySelectorAll("th");
            th[0].textContent = "Number of Gaps:";
            th[1].textContent = "Total Length of Gaps:";

            td = cloneGapSegment.querySelectorAll("td");
            td[0].textContent = `${segmentCollection.count.toString()}`;
            td[1].textContent = `${segmentCollection.size().toString()}`;
            summaryContainer.appendChild(cloneGapSegment);
            
            // display tables
            var container = document.createElement('div');
            container.className = 'segment-data-container';
            displayDiv.appendChild( container );

            template = document.querySelector('#segment-data-template');
            var cloneSegment = template.content.cloneNode(true);
            var tbodySegment = cloneSegment.querySelector("tbody");
            td = cloneSegment.querySelectorAll("td");

            td[0].textContent = "Segment Interval";
            td[1].textContent = "Interval Size";
            container.appendChild(cloneSegment);

            var cloneGap = template.content.cloneNode(true);
            var tbodyGap = cloneGap.querySelector("tbody");
            td = cloneGap.querySelectorAll("td");

            td[0].textContent = "Gap Interval";
            td[1].textContent = "Gap Size";
            container.appendChild(cloneGap);

            segmentCollection.segments.forEach( segment => {
                template = document.querySelector('#segment-row-template');
                const cloneSegmentRow = template.content.cloneNode(true);
                td = cloneSegmentRow.querySelectorAll("td");
                td[0].textContent = `[${segment.left.toString()}, ${segment.right.toString()}]`; 
                td[1].textContent = `${segment.size.toString()}`;
                tbodySegment.appendChild(cloneSegmentRow);
            });

            segmentCollection.gaps().forEach( segment => {
                template = document.querySelector('#segment-row-template');
                const cloneGapRow = template.content.cloneNode(true);
                td = cloneGapRow.querySelectorAll("td");
                td[0].textContent = `[${segment.left.toString()}, ${segment.right.toString()}]`; 
                td[1].textContent = `${segment.size.toString()}`;
                tbodyGap.appendChild(cloneGapRow);
            });
        } else {
            displayDiv.textContent="This page requires a browser that supports the template html tag";
        }

    } // end displayInfo

    const numberlines = cantor3_4(numIter);

    for( let i = 0; i < numberlines.length; i++ ){
        var [ctx, infoDiv] = createElements(i);

        var width = ctx.canvas.offsetWidth;
        var height = ctx.canvas.offsetHeight;
        var midH = Math.floor(height/2);

        var margin = 30;
        var dotSize = 5;
        var fontSize = 15;
        
        // make bg black
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, width, height);

        ctx.textAlign = 'center';
        ctx.font = `${fontSize}px Verdana`;
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'white';

        drawNumberline(ctx, numberlines[i]);
        displayInfo(infoDiv, numberlines[i]);

    };
}

function createElements(index){
    //grab the parent div
    const displayDiv = document.getElementById("all-numberlines");
    
    //create a new div to contain the numberline and its details
    const newNumContentDiv = document.createElement("div");
    newNumContentDiv.className =`.numberline-detail-wrapper-${index +1}`;
    displayDiv.appendChild(newNumContentDiv);

    //create div to hold the numberline graphic 
    const newCanvasDiv = document.createElement("div");
    newCanvasDiv.className = `.numberline`;

    // create canvas 
    const canvas = document.createElement("canvas");
    canvas.className = `canvas`;
    // attach canvas to .numberline div
    newCanvasDiv.appendChild(canvas);
    //attach numberline to wrapper 
    newNumContentDiv.appendChild(newCanvasDiv);

    // create elements for displaying segment and gap info 
    const newCollectionDiv = document.createElement("div");
    newCollectionDiv.className = ".segmentCollection";
    newNumContentDiv.appendChild(newCollectionDiv);

    // set properties on the canavs
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = 200;
    // grab context
    const ctx = canvas.getContext('2d');
    
    // return canvas context and contentDiv
    return [ctx, newCollectionDiv];
}

drawAllNumberlines(5);

