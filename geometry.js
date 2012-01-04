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
      
      function lineToRect( line ) {
        return {
          left: Math.min( line.start.x, line.end.x ),
          right: Math.max( line.start.x, line.end.x ),
          top: Math.min( line.start.y, line.end.y ),
          bottom: Math.max( line.start.y, line.end.y ),
          width: Math.max( line.start.x, line.end.x ) - Math.min( line.start.x, line.end.x ),
          height: Math.max( line.start.y, line.end.y ) - Math.min( line.start.y, line.end.y )
        };
      }
      
      function rectanglesIntersect( a, b ) {
        return !( a.left >= b.right || b.left >= a.right || a.top >= b.bottom || b.top >= a.bottom );
      }
      
      function rectangleInside( parent, child ) {
        return child.left >= parent.left && child.top >= parent.top && child.right <= parent.right && child.bottom <= parent.bottom;
      }
      
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
      