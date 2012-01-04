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

function pointsToWalls( points, texture, floor, ceiling, offset ) {
  var walls = [];
  for( var i = 0; i < points.length; i++ ) {
    var point = points[ i ];
    var nextPoint = i < points.length - 1 ? points[ i + 1 ] : points[ 0 ];
    walls.push({
      start: point,
      end: nextPoint,
      texture: texture,
      floor: floor,
      ceiling: ceiling,
      offset: offset
    });
  }
  return walls;
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

function sortMap( map ) {
  //for testing we should shuffle the map first to make sure the sort
  //doesn't only work because some walls happen to start off in right
  //place
  function randOrd(){
    return ( Math.round( Math.random() ) -0.5 );
  }
  map.walls.sort( randOrd );
  
          
  //normalize start/end for y
  for( var i = 0; i < map.walls.length; i++ ) {
    var wall = map.walls[ i ];
    if( wall.start.y > wall.end.y ) {
      var temp = wall.start;
      wall.start = wall.end;
      wall.end = temp;
    }
  }
  
  //sort on ymin
  map.walls.sort( function( a, b ) {
    
    
    var aRect = lineToRect( a ),
        bRect = lineToRect( b );
        
    
    if( rectanglesIntersect( a, b ) ) {          
      /*
      //handle case where both have same start            
      if( a.start.y == b.start.y ) {
        return a.end.y > b.end.y ? 1 : a.end.y < b.end.y ? -1 : 0;
      }
      */
      
      
      /*
      //handle case where both have same end
      if( a.end.y == b.end.y ) {
        return a.start.y > b.start.y ? 1 : a.start.y < b.start.y ? -1 : 0;
      }
      */
      
      /*
      var overlaps = reduceLinesToOverlap( a, b ),
          oA = overlaps.get( a ),
          oB = overlaps.get( b );
          
      //handle case where both have same start
      if( oA.start.y == oB.start.y ) {
        return oA.end.y > oB.end.y ? 1 : oA.end.y < oB.end.y ? -1 : 0;
      }   
      */
      /*
      //handle case where both have same end
      if( oA.end.y == oB.end.y ) {
        return oA.start.y > oB.start.y ? 1 : oA.start.y < oB.start.y ? -1 : 0;
      }
      */
      
      
      //return oA.start.y > oB.start.y ? 1 : oA.start.y < oB.start.y ? -1 : 0;            
    }          
    
    return a.start.y > b.start.y ? 1 : a.start.y < b.start.y ? -1 : 
      a.end.y > b.end.y ? 1 : a.end.y < b.end.y ? -1 : 0
      //0;
  });    
}

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
  
  var overlaps = lineBoundingIntersections( map.walls );
  var insides = findInsides( map );
  var overlapsHash = findOverlapHash( map );
  
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
    var text = new Text( i + ' (' + wall.id + ')', 'sans-serif', '#fff' );
    text.x = ( wall.start.x + wall.end.x ) / 2;
    text.y = ( ( wall.start.y + wall.end.y ) / 2 ) + ( wall.ceiling / 2 );          
    stage.addChild( text );
    
    
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
    
    var overlapIndex = overlaps.indexOf( wall );
    //var overlapIndex = insides.indexOf( wall );
    if( overlapIndex != -1 ) {          
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
  var points = [
    { x: 253, y: 270 },
    { x: 359, y: 142 },
    { x: 397, y: 304 },
    { x: 552, y: 365 },
    { x: 409, y: 451  },
    { x: 399, y: 618 },
    { x: 273, y: 508 },
    { x: 111, y: 550 },
    { x: 177, y: 397 },
    { x: 87, y: 256 }
  ];
  var extraWalls = pointsToWalls( points, 'RW10_3', 0, 128, { x: 0, y: 0 } );
  for( var i = 0; i < extraWalls.length; i++ ) {
    map.walls.push( extraWalls[ i ] );
  }       
  
  //use index before sorting as id
  for( var i = 0; i < map.walls.length; i++ ) {
    map.walls[ i ].id = i;
  }
  
  //debug - remove all walls that don't cause problems
  var newWalls = [];
  var problematicWalls = [ 3, 4, 5, 11, 12, 13, 14 ];
  for( var i = 0; i < map.walls.length; i++ ) {
    if( problematicWalls.indexOf( map.walls[ i ].id ) != -1 ) {
      newWalls.push( map.walls[ i ] );
    }
  }
  map.walls = newWalls;
  
  drawMap( map );
  stage.update();
  Ticker.setFPS( 2 );
  Ticker.addListener( this );
  $( canvas ).bind( 'click', function() {
    Ticker.setPaused( !Ticker.getPaused() );
  });
}

function tick(){
  stage.removeAllChildren();
  
  var rotateBy = 10;
  rotation += rotateBy;
  rotation = rotation > 360 ? rotation - 360 : rotation;
  rotDebug.html( rotation );
  
  for( var i = 0; i < map.walls.length; i++ ) {
    var wall = map.walls[ i ];
    wall.start = rotateAround( wall.start, { x: 400, y: 400 }, rotateBy );
    wall.end = rotateAround( wall.end, { x: 400, y: 400 }, rotateBy );
  }
  
  drawMap( map );
  stage.update();        
}      
     


$(function() {
  canvas = document.getElementById( 'c' );
  context = canvas.getContext( '2d' );
  stage = new Stage( canvas );        
  rotDebug = $( '#r' );
  var names = getTextureNames( map );
  loadTextures( names, init );
});