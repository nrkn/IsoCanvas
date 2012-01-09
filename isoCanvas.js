/*
  get offset working
  walls need to be vertically offset based on floor      
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
      height = 100, //wall.ceiling - wall.floor,
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
  y = start.y - height;
  
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
  bitmap.y = sprite.position.y - bitmap.image.height; //height must be added
  
  stage.addChild( bitmap );
}

function getTextureNames( map ) {
  var names = [];
  each(map.walls || [], function (w) {
    setAdd(names, w.image || w.texture)
  })
  
  each(map.sprites || [], function (w) {
    setAdd(names, w.image || w.texture)
  })

  return names;        
}


function painterSort( a, b ) {
      
  var aRect = a.toRect(),
      bRect = b.toRect();
  
  if( rectanglesIntersect( aRect, bRect ) ) {      
    //compare the Y values for each end of the overlaping section.
    //(the ends may be touching)
    //the wall that has a greater Y (at either end of the overlap) 
    //is the more distant wall.

    var inter = getIntersection(aRect, bRect)
    var leftA = a.yAtX(inter.left)
    var leftB = b.yAtX(inter.left)

    if(leftA == leftB) {
      var rightA = a.yAtX(inter.right)
      var rightB = b.yAtX(inter.right)
      return (
          rightA < rightB ? -1
        : rightA > rightB ?  1
        : 0 
      )
    }
    return (leftA < leftB ? -1 : 1) //have already checked for equality on the left side
    
  }
  return a.minY() - b.minY()
//  return a.start.y > b.start.y ? 1 : a.start.y < b.start.y ? -1 : 
  //  a.end.y > b.end.y ? 1 : a.end.y < b.end.y ? -1 : 0
}

function sortMap (map) {
  (map.entities || map.walls).sort(painterSort)
}

function drawBoundingBox (entity, i) {

    var rect = entity.toRect()
    var g2 = new Graphics();
    g2.setStrokeStyle( 1 );

    g2.beginStroke( Graphics.getRGB( 0, 255, 0 ) );
    g2.moveTo( rect.left, rect.top );
    g2.lineTo( rect.right, rect.top );
    g2.lineTo( rect.right, rect.bottom );
    g2.lineTo( rect.left, rect.bottom );
    g2.lineTo( rect.left, rect.top );
    g2.endStroke();
    
    var text = new Text( i, 'sans-serif', '#fff' );
    text.x = ( rect.left + rect.right ) / 2;
    text.y = ( ( rect.top + rect.bottom - (entity.ceiling || 0)) / 2 );          

    var s2 = new Shape( g2 );
    s2.alpha = 1;
    
    stage.addChild( text );
    stage.addChild( s2 );

}

function drawMap( map ) {

  sortMap(map)

  each( map.entities, function (e) {
    e.draw(e)
  });
  
  if( !drawExtras ) return;
  
  //draw bounding boxes around entities, for debugging.
  each(map.entities, drawBoundingBox)

}

function init(){
  
  reformatMap(map)
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
    //rotDebug.html( rotation );
    //make a general purpose debug panel
    each(map.entities, function (e) {
      each(['start', 'end', 'position'], function (s) {
        if(e[s] != null)
          e[s] = rotateAround( e[s], { x: 400, y: 400 }, rotateBy );
      })
    })
  }
  drawMap( map );
  stage.update();
}

function initWall (w) {

}

function reformatMap(map) {
  map.entities = []
  each(map.walls, function(w) {
    w.type = 'wall'
    w.draw = drawWall
    w.minY = function () {
      return Math.min(this.start.y, this.end.y)
    }
    w.toRect = lineToRect
    w.yAtX = function (x) {
      return yAtX(this,x)
    }
    map.entities.push(w)
  })
  each(map.sprites, function(w) {
    w.type = 'sprite'
    w.draw = drawSprite
    w.toRect = spriteToRect
    w.minY = function () {
      return this.position.y
    }
    w.yAtX = function (x) {
      return this.position.y
    }
    w.width = images[w.image].image.width
    w.height = images[w.image].image.height
    map.entities.push(w)
  })
}

$(function() {
  canvas = document.getElementById( 'c' );
  context = canvas.getContext( '2d' );
  stage = new Stage( canvas );        
  rotDebug = $( '#r' );
  var names = getTextureNames( map );
  loadImages( names, init )
});
