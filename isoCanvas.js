/*
  get offset working
  walls need to be vertically offset based on floor      
    this needs to affect sort order too
  draw polygons (floors), need to be able to have holes.
  to be faux-isometric need to halve the y values
  wad->json?
*/
var canvas,  
    context,         
    stage,
    textures = {},
    rotation = 0,
    rotDebug,
    drawExtras = true;

function makeCanvas( width, height ) {
  var canvas = document.createElement( 'canvas' ),
      context = canvas.getContext( '2d' );
      
  canvas.width = width;
  canvas.height = height;
  
  return {
    canvas: canvas,
    context: context
  };
}      

function loadTextures( names, onload ) {
  var i = 0;
  var loadImage = function(){
    if( i >= names.length ) {
      onload();
      return false;
    }
    
    var img = new Image();
    img.src = names[ i ] + '.png';
    textures[ names[ i ] ] = new Bitmap( img );
    img.onload = function() {
      i++;
      loadImage();
    };
  };
  
  loadImage();
}


function getPattern( canvas, bitmap ) {
  return canvas.context.createPattern( bitmap.image, 'repeat' );
}
     
function drawWall( wall ) {
  var start = wall.start,
      end = wall.end,
      height = wall.ceiling - wall.floor,
      texture = wall.texture,
      offset = wall.offset,
      width = Math.ceil( distance( start, end ) ),            
      buffer = makeCanvas( width, height ),
      bitmap = textures[ texture ],
      pattern = getPattern( buffer, bitmap ),
      wallBitmap,
      degrees = degreesFromVector( start, end ),
      x, 
      y;
      
  degrees = degrees < 0 ? degrees + 360 : degrees;    
      
  buffer.context.fillStyle = pattern;
  buffer.context.fillRect( 0, 0, width, height );
  
  wallBitmap = new Bitmap( buffer.canvas );            
  wallBitmap.skewY = degrees;
  
  if( wall.flag ) {
    wallBitmap.alpha = 0.25;
  }
  
  x = start.x;
  y = start.y;
  
  if( start.x > end.x ) {
    x -= ( start.x - end.x );
    if( start.y < end.y ) {
      y += ( end.y - start.y );
    } else {
      y -= ( start.y - end.y );
    }
  }
  
  wallBitmap.x = x;
  wallBitmap.y = y;
    
  stage.addChild( wallBitmap );
}

function drawSprite( position, bitmap ) {
  var sprite = bitmap.clone();
  sprite.x = position.x - ( bitmap.image.width / 2 );
  sprite.y = position.y - bitmap.image.height;
  
  stage.addChild( sprite );
}

function getTextureNames( map ) {
  var names = [];
  for( var i = 0; i < map.walls.length; i++ ) {
    var wall = map.walls[ i ];
    var name = wall.texture;
    if( names.indexOf( name ) == -1 ) {
      names.push( name );
    }
  }
  
  for( var i = 0; i < map.floors.length; i++ ) {
    var floor = map.floors[ i ];
    var name = floor.texture;
    if( names.indexOf( name ) == -1 ) {
      names.push( name );
    }
  } 

  return names;        
}

//I'm sick of for loops
function each(array, iterator) {
  var l = array.length;
  for( var i = 0; i < l; i++ ) {
    iterator(array[i], i, array)
  }
}

function painterSort( a, b ) {
        
    var aRect = lineToRect( a ),
        bRect = lineToRect( b );
    
    if( rectanglesIntersect( aRect, bRect ) ) {      
      //compare the Y values for each end of the overlaping section.
      //(the ends may be touching)
      //the wall that has a greater Y (at either end of the overlap) 
      //is the more distant wall.

      var inter = getIntersection(aRect, bRect)
      var leftA = yAtX(a, inter.left)
      var leftB = yAtX(b, inter.left)

      if(leftA == leftB) {
        var rightA = yAtX(a, inter.right)
        var rightB = yAtX(b, inter.right)
        return (
            rightA < rightB ?  -1
          : rightA > rightB ? 1
          : 0 
        )
      }
      return (leftA < leftB ? -1 : 1) //have already checked for equality on the left side
      
    }
    return a.start.y > b.start.y ? 1 : a.start.y < b.start.y ? -1 : 
      a.end.y > b.end.y ? 1 : a.end.y < b.end.y ? -1 : 0
  }
  function sortMap( map ) {
  //for testing we should shuffle the map first to make sure the sort
  //doesn't only work because some walls happen to start off in right
  //place
  // -- this creates some edgecases, because it's possible that
  // A < B < C < B', yet B > B' because of an overlap...
  function randOrd(a,b){
    return ( Math.round( Math.random() ) -0.5 );
  }
//  map.walls.sort( randOrd );
  function naiveOrd(a,b)  {

    return (
      Math.min(b.start.y, b.end.y)*Math.min(b.start.x, b.end.x)
      - 
      Math.min(a.start.y,a.end.y)*Math.min(a.start.x, a.end.x)
    )
  }
  
//  map.walls.sort( naiveOrd );
          
  //normalize start/end for y
  for( var i = 0; i < map.walls.length; i++ ) {
    var wall = map.walls[ i ];
    if( wall.start.y > wall.end.y ) {
      var temp = wall.start;
      wall.start = wall.end;
      wall.end = temp;
    }
  }
//  var list = null
  map.walls.sort( painterSort );
  /*each (map.walls, function (sort) {
    if(list == null)
      list = new List(sort)
    else
      list.insert(sort, painterSort)
  })*/

//  map.walls = list.toArray()

}

/*
  what does this do?

  map over the walls and check if any wall is inside anyother wall.
*/

function findInsides( map ) {
  var insides = [];
  for( var i = 0; i < map.walls.length; i++ ) {
    for( var j = i + 1; j < map.walls.length; j++ ) {
      var aRect = lineToRect( map.walls[ i ] ),
          bRect = lineToRect( map.walls[ j ] );
          
      if( rectangleInside( aRect, bRect ) || rectangleInside( bRect, aRect ) ) {
        insides.push( map.walls[ i ] );
        insides.push( map.walls[ j ] );
      }
    }
  }
  return insides;
}

function findOverlapHash( map ) {
  var overlaps = new Hashtable();
  for( var i = 0; i < map.walls.length; i++ ) {
    for( var j = i + 1; j < map.walls.length; j++ ) {
      var aRect = lineToRect( map.walls[ i ] ),
          bRect = lineToRect( map.walls[ j ] );
          
      if( rectanglesIntersect( aRect, bRect ) ) {
        overlaps.put( map.walls[ i ], map.walls[ j ] );
        overlaps.put( map.walls[ j ], map.walls[ i ] );
      }
    }
  }
  return overlaps;      
}

/*

  reduce lines to overlap?
  
  is this for checking collisions?

*/

function reduceLinesToOverlap( a, b ) {
  var aX1 = Math.min( a.start.x, a.end.x ),
    aX2 = Math.max( a.start.x, a.end.x ),
    bX1 = Math.min( b.start.x, b.end.x ),
    bX2 = Math.max( b.start.x, b.end.x ),
    overlapStart = Math.max( aX1, bX1 ),
    overlapEnd = Math.min( aX2, bX2 ),
    top = Math.min( a.start.y, b.start.y ),
    bottom = Math.max( a.end.y, b.end.y ),
    leftLine = {
      start: {
        x: overlapStart,
        y: top
      },
      end: {
        x: overlapStart,
        y: bottom
      }
    },
    rightLine = {
      start: {
        x: overlapEnd,
        y: top
      },
      end: {
        x: overlapEnd,
        y: bottom
      }
    },
    aStart = linesIntersect( leftLine, a ),
    aEnd = linesIntersect( rightLine, a ),
    bStart = linesIntersect( leftLine, b ),
    bEnd = linesIntersect( rightLine, b ); 
  
  //nomalize the y so start is always lower
  if( aStart.y > aEnd.y ) {
    var temp = aStart;
    aStart = aEnd;
    aEnd = temp;
  }        
  if( bStart.y > bEnd.y ) {
    var temp = bStart;
    bStart = bEnd;
    bEnd = temp;
  }
  
  var data = new Hashtable();
  data.put( a, { start: aStart, end: aEnd } );
  data.put( b, { start: bStart, end: bEnd } );
  
  return data;
}

function drawMap( map ) {        
  sortMap( map );
  
  for( var i = 0; i < map.walls.length; i++ ) {
    var wall = map.walls[ i ];
    
    drawWall( wall );
  }          
  
  if( !drawExtras ) return;
  
  //var overlaps = lineBoundingIntersections( map.walls );
  //var insides = findInsides( map );
  //var overlapsHash = findOverlapHash( map );
  
  var yLines = [];
  for( var i = 0; i < map.walls.length; i++ ) {
    var wall = map.walls[ i ];
    
    /*
    //outline original map data
    var g = new Graphics();
    g.setStrokeStyle( 1 );
    g.beginStroke( Graphics.getRGB( 255, 0, 0 ) );
    g.moveTo( wall.start.x, wall.start.y + 128 );
    g.lineTo( wall.end.x, wall.end.y + 128 );
    g.endStroke();
    var s = new Shape( g );
    s.alpha = 0.5;          
    stage.addChild( s );          
    */
    
    
    //debug - wall sort order ( wall id )
    if(true) {
      var text = new Text( i + ' (' + wall.id + ')->'+ wall.order, 'sans-serif', '#fff' );
      text.x = ( wall.start.x + wall.end.x ) / 2;
      text.y = ( ( wall.start.y + wall.end.y ) / 2 ) + ( wall.ceiling / 2 );          
      stage.addChild( text );
    }    
    
    // ylines
    if( yLines.indexOf( wall.start.y ) == -1 ) {
      yLines.push( wall.start.y );
    }
    
    if( yLines.indexOf( wall.end.y ) == -1 ) {
      yLines.push( wall.end.y );
    }
    
    //bounding boxes
    var rect = lineToRect( wall );
    var g = new Graphics();
    
    //draw overlaps on top of the map for debugging purposes.
    /*
    var overlapIndex = overlaps.indexOf( wall );
    //var overlapIndex = insides.indexOf( wall );
    if( overlapIndex != -1 && false) {          
      //var fill = overlapIndex != -1 ? Graphics.getRGB( 255, 0, 0 ) : Graphics.getRGB( 128, 128, 128 );
      var hue = ( 360 / map.walls.length ) * ( wall.id + 1 );
      var fill = Graphics.getHSL( hue, 100, 50 );
      g.setStrokeStyle( 1 );
      g.beginStroke( Graphics.getRGB( 255, 255, 255 ) );
      g.beginFill( fill );
      g.rect( rect.left, rect.top + 128, rect.width, rect.height );
      g.endFill();
      g.endStroke();
      var s = new Shape( g );
      s.alpha = 0.125;
      stage.addChild( s );  
    }
    */
    /*
    //overlaps
    if( overlapIndex != -1 ) {
      var a = wall,
          b = overlapsHash.get( wall ),
          aX1 = Math.min( a.start.x, a.end.x ),
          aX2 = Math.max( a.start.x, a.end.x ),
          bX1 = Math.min( b.start.x, b.end.x ),
          bX2 = Math.max( b.start.x, b.end.x ),
          overlapStart = Math.max( aX1, bX1 ),
          overlapEnd = Math.min( aX2, bX2 ),
          top = Math.min( a.start.y, b.start.y ),
          bottom = Math.max( a.end.y, b.end.y ),
          leftLine = {
            start: {
              x: overlapStart,
              y: top
            },
            end: {
              x: overlapStart,
              y: bottom
            }
          },
          rightLine = {
            start: {
              x: overlapEnd,
              y: top
            },
            end: {
              x: overlapEnd,
              y: bottom
            }
          },
          aStart = linesIntersect( leftLine, a ),
          aEnd = linesIntersect( rightLine, a ),
          bStart = linesIntersect( leftLine, b ),
          bEnd = linesIntersect( rightLine, b ); 

          var g2 = new Graphics();
          g2.setStrokeStyle( 1 );
          
          g2.beginStroke( Graphics.getRGB( 0, 255, 0 ) );
          g2.moveTo( aStart.x, aStart.y + 128 );
          g2.lineTo( aEnd.x, aEnd.y + 128 );
          g2.endStroke();
          
          g2.beginStroke( Graphics.getRGB( 0, 0, 255 ) );
          g2.moveTo( bStart.x, bStart.y + 128 );
          g2.lineTo( bEnd.x, bEnd.y + 128 );
          g2.endStroke();                
          
          var s2 = new Shape( g2 );
          s2.alpha = 1;
          
          stage.addChild( s2 );                            
    }    
    */        
  } 
  /*
  for( var i = 0; i < yLines.length; i++ ) {
    //horizontal lines
    var g = new Graphics();
    g.setStrokeStyle( 1 );
    g.beginStroke( Graphics.getRGB( 128, 128, 128 ) );
    g.moveTo( 0, yLines[ i ] + 128 );
    g.lineTo( 1000, yLines[ i ] + 128 );
    g.endStroke();
    var s = new Shape( g );
    s.alpha = 0.125;
    
    stage.addChild( s );
    
    //points
    var line = {
      start: { x: 0, y: yLines[ i ] },
      end: { x: 1000, y: yLines[ i ] }
    };
    
    for( var j = 0; j < map.walls.length; j++ ) {
      var wall = map.walls[ j ];
      var y = linesIntersect( line, wall );
      if( y ) {
        g = new Graphics();
        g.setStrokeStyle( 1 );
        g.beginStroke( Graphics.getRGB( 0, 0, 0 ) );
        g.beginFill( Graphics.getRGB( 0, 0, 255 ) );
        g.drawCircle( y.x, y.y + 128, 3 );
        s = new Shape( g );
        s.x = 0;
        s.y = 0;
        stage.addChild( s );            
      }
    }
  }
  */
}

function init(){
  
  drawMap( map );
  stage.update();
  Ticker.setFPS( 60 );
  Ticker.addListener( this );
  $( canvas ).bind( 'click', function() {
    Ticker.setPaused( !Ticker.getPaused() );
  });
}

function tick(){
  stage.removeAllChildren();
  
  if(true) {
    var rotateBy = 10;
    rotation += rotateBy;
    rotation = rotation > 360 ? rotation - 360 : rotation;
    rotDebug.html( rotation );
  
    for( var i = 0; i < map.walls.length; i++ ) {
      var wall = map.walls[ i ];
      wall.start = rotateAround( wall.start, { x: 400, y: 400 }, rotateBy );
      wall.end = rotateAround( wall.end, { x: 400, y: 400 }, rotateBy );
    }
  }
  drawMap( map );
  stage.update();        
//  Ticker.setPaused(true)

}      
     


$(function() {
  canvas = document.getElementById( 'c' );
  context = canvas.getContext( '2d' );
  stage = new Stage( canvas );        
  rotDebug = $( '#r' );
  var names = getTextureNames( map );
  loadTextures( names, init );
});