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
  
  for( var i = 0; i < map.walls.length; i++ ) {
    var wall = map.walls[ i ];
    if( wall.start.y > wall.end.y ) {
      var temp = wall.start;
      wall.start = wall.end;
      wall.end = temp;
    }
  }
  map.walls.sort( painterSort );

}


function drawMap( map ) {        
  sortMap( map );
  
  for( var i = 0; i < map.walls.length; i++ ) {
    var wall = map.walls[ i ];
    
    drawWall( wall );
  }          
  
  if( !drawExtras ) return;
    
  var yLines = [];
  for( var i = 0; i < map.walls.length; i++ ) {
    var wall = map.walls[ i ];    
    
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
  } 
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