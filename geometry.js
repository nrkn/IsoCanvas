      function distance( start, end ) {
        var x = end.x - start.x,
            y = end.y - start.y;
        
        return Math.sqrt( x * x + y * y );
      }
      
      function degreesFromVector( start, end ) {
        var radians = Math.atan( ( end.y - start.y ) / ( end.x - start.x ) );
        return radians * 180 / Math.PI;
      }      
      
      function lineBoundingIntersections( lines ) {
        var intersections = [];
        for( var i = 0; i < lines.length; i++ ) {
          for( var j = i + 1; j < lines.length; j++ ) {
            var aRect = lineToRect( lines[ i ] ),
                bRect = lineToRect( lines[ j ] );
                
            if( rectanglesIntersect( aRect, bRect ) ) {
              intersections.push( lines[ i ] );
              intersections.push( lines[ j ] );
            }
          }
        }
        return intersections;        
      }
      
      function toRect ( entity ) {
        if( 'wall' == entity.type) return lineToRect(entity)
        else spriteToRect(entity)
      }
      function spriteToRect () {
        var half = (this.width/2)
        return {
            left:   this.position.x - half,
            right:  this.position.x + half,
            top:    this.position.y - this.height,
            bottom: this.position.y
          }
      }
      function lineToRect( ) {
        return {
          left:   Math.min( this.start.x, this.end.x ),
          right:  Math.max( this.start.x, this.end.x ),
          top:    Math.min( this.start.y, this.end.y ),
          bottom: Math.max( this.start.y, this.end.y ),
          width:  Math.max( this.start.x, this.end.x ) - Math.min( this.start.x, this.end.x ),
          height: Math.max( this.start.y, this.end.y ) - Math.min( this.start.y, this.end.y )
        };
      }
      
      function rectanglesIntersect( a, b ) {
        return !( a.left >= b.right || b.left >= a.right || a.top >= b.bottom || b.top >= a.bottom );
      }

      //return a rectangle that is the overlaping portion of a,b. 
      //throw if they do not intersect.
      //tests in test.js
      function getIntersection(a, b) {
        if(!rectanglesIntersect( a, b )) throw new Error('expected rectangles to intersect')
        return {
          left: Math.max(a.left, b.left),
          right: Math.min(a.right, b.right),
          top: Math.max(a.top, b.top),
          bottom: Math.min(a.bottom, b.bottom)
        }
      }
      
      function rectangleInside( parent, child ) {
        return child.left >= parent.left && child.top >= parent.top && child.right <= parent.right && child.bottom <= parent.bottom;
      }
      
      //calculate the y value at a given x value on a line
      //units of y per unit of x
      
      function gradient (line) {
        var g = (line.start.y - line.end.y) / (line.start.x - line.end.x) 
        return g
      }
      function yAtX(line, x) {
        //very confusing results when i x*line.start.x by accident...
        return line.start.y + gradient(line)* (x-line.start.x)
      }
      //see test.js for some tests

      
      //this might be more useful if it returned a point that the two points intersected on.
      function linesIntersect( a, b ) {
         // Denominator for ua and ub are the same, so store this calculation
         var d = ( b.end.y - b.start.y ) * (a.end.x - a.start.x) - (b.end.x - b.start.x) * (a.end.y - a.start.y);

         //n_a and n_b are calculated as seperate values for readability
         var nA = ( b.end.x - b.start.x ) * ( a.start.y - b.start.y ) - ( b.end.y - b.start.y ) * ( a.start.x - b.start.x );
         var nB = ( a.end.x - a.start.x ) * ( a.start.y - b.start.y ) - ( a.end.y - a.start.y ) * ( a.start.x - b.start.x );

         // Make sure there is not a division by zero - this also indicates that
         // the lines are parallel.  
         // If n_a and n_b were both equal to zero the lines would be on top of each 
         // other (coincidental).  This check is not done because it is not 
         // necessary for this implementation (the parallel check accounts for this).
         if( d == 0 ) return false;

         // Calculate the intermediate fractional point that the lines potentially intersect.
         var ua = nA / d;
         var ub = nB / d;

         // The fractional point will be between 0 and 1 inclusive if the lines
         // intersect.  If the fractional calculation is larger than 1 or smaller
         // than 0 the lines would need to be longer to intersect.
         if( ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1 ){
            return {
              x: a.start.x + ( ua * ( a.end.x - a.start.x ) ),
              y: a.start.y + ( ua * ( a.end.y - a.start.y ) )
            }
         }
         return false;
      }  
      
      function rotate( point, degrees ) {
        var rotatedX = point.x * Math.cos( degrees / 180 * Math.PI ) - point.y * Math.sin( degrees / 180 * Math.PI );
        var rotatedY = point.x * Math.sin( degrees / 180 * Math.PI ) + point.y * Math.cos( degrees / 180 * Math.PI );
        return { x: rotatedX, y: rotatedY };
      }
      
      function translate( point, amount ) {
        return { x: point.x + amount.x, y: point.y + amount.y };
      }
      
      function rotateAround( point, pivot, degrees ) {
        var translatePoint = { x: pivot.x * -1, y: pivot.y * -1 };
        var translatedPoint = translate( point, translatePoint );
        var rotatedPoint = rotate( translatedPoint, degrees );
        return translate( rotatedPoint, pivot );        
      }
