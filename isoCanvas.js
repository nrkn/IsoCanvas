/*
  get offset working
  walls need to be vertically offset based on floor      
    this needs to affect sort order too
  draw polygons (floors), need to be able to have holes.
  to be faux-isometric need to halve the y values
  wad->json?


  sprites.
    sorted with walls, by their single coordinate. (compare to Y value for walls that
    they intersect with.)
  
  floors
    sorted with walls.

  user interaction:
  arrow keys to scroll or rotate? 
  click to walk?
*/
var canvas,
    context,         
    stage,
    images = {},
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

function loadImages( names, onload ) {
  var i = 0;
  var loadImage = function(){
    if( i >= names.length ) {
      onload();
      return false;
    }
    
    var img = new Image();
    img.src = names[ i ] + '.png';
    images[ names[ i ] ] = new Bitmap( img );
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
      image = wall.image || wall.texture ,
      offset = wall.offset,
      width = Math.ceil( distance( start, end ) ),            
      buffer = makeCanvas( width, height ),
      bitmap = images[ image],
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

function drawSprite( sprite) {
  var bitmap = images[sprite.image].clone();
  bitmap.x = sprite.position.x - ( bitmap.image.width / 2 ); //not 100% sure, this seems right
  bitmap.y = sprite.position.y + bitmap.image.height; //height must be added
  
  stage.addChild( bitmap );
}

function getTextureNames( map ) {
  var names = [];
  each(map.walls, function (w) {
    setAdd(names, w.image || w.texture)
  })
  each(map.sprites, function (w) {
    setAdd(names, w.image)
  })

  return names;        
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

function sortMap (map) {
  map.walls.sort(painterSort)
}

function drawMap( map ) {        
  sortMap(map)

  each( map.walls, drawWall );
  
  if( !drawExtras ) return;
    
    
  each(map.sprites, drawSprite)
//  drawSprite({x:500, y:500}, images ['TROOB1'])  

  var yLines = [];
  each(map.walls, function (wall, i) {
    
    //debug - wall sort order ( wall id )
    if(true) {
      var text = new Text( i, 'sans-serif', '#fff' );
      text.x = ( wall.start.x + wall.end.x ) / 2;
      text.y = ( ( wall.start.y + wall.end.y ) / 2 ) + ( wall.ceiling / 2 );          
      stage.addChild( text );
    }    
  })
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
//    rotDebug.html( rotation );
  
    each(map.walls, function (wall) {
      wall.start = rotateAround( wall.start, { x: 400, y: 400 }, rotateBy );
      wall.end = rotateAround( wall.end, { x: 400, y: 400 }, rotateBy );
    })
    each(map.sprites, function (sp) {
      sp.position = rotateAround( sp.position , { x: 400, y: 400 }, rotateBy );
    })
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
  
  loadImages( names, init )
});
