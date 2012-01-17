var logger = function( message ) {
  $( '#log' ).append( message + '<br />' );
};

function wadMapToMap( wadMap ) {
  var map = {
    walls: [],
    floors: []
  };
  
  //make map top left 0,0 - I think limit on doom maps is 64k but let's use 100k
  //to be safe
  var minX = 100000;
  var minY = 100000;
  
  for( var i = 0; i < wadMap.vertexes.length; i++ ) {
    var vertex = wadMap.vertexes[ i ];
    minX = vertex.x < minX ? vertex.x : minX;
    minY = vertex.y < minY ? vertex.y : minY;
  }
  
  for( var i = 0; i < wadMap.linedefs.length; i++ ) {
    var linedef = wadMap.linedefs[ i ],
        start = wadMap.vertexes[ linedef.startVertex ],
        end = wadMap.vertexes[ linedef.endVertex ],
        wall = {
          start: { x: start.x - minX, y: start.y - minY },
          end: { x: end.x - minX, y: end.y - minY },
          texture: 'RW10_3',
          floor: 0,
          ceiling: 128,
          offset: { x: 0, y: 0 }
        };
        
    map.walls.push( wall );
  }
  
  return map;
}

function findLinesForSectors( wadMap ) {
  var sectorLines = {},
      sectorMax = -1,
      fix2SidedSameSector = false,
      addLineToPolygon = function( line, sidedefIndex ) {
        if( sidedefIndex == -1 ) return;
        
        var sidedef = wadMap.sidedefs[ sidedefIndex ];
            
        if( !sectorLines[ sidedef.sector ] ) {
          sectorLines[ sidedef.sector ] = {
            lines: [],
            lightLevel: wadMap.sectors[ sidedef.sector ].lightLevel,
            floorTexture: wadMap.sectors[ sidedef.sector ].floorTexture
          };
        }
        
        sectorLines[ sidedef.sector ].lines.push( line );
        
        sectorMax = sidedef.sector > sectorMax ? sidedef.sector : sectorMax;
      };
      
  for( var i = 0; i < wadMap.linedefs.length; i++ ) {
    var linedef = wadMap.linedefs[ i ],
        start = wadMap.vertexes[ linedef.startVertex ],
        end = wadMap.vertexes[ linedef.endVertex ],
        line = { start: start, end: end },
        leftLine = { start: end, end: start };
    
    //maybe sometimes we don't want to add 2 sided linedefs where both sidedefs 
    //point at same sector
    if( 
      fix2SidedSameSector && 
      linedef.rightSidedef != -1 && 
      linedef.leftSidedef != -1 && 
      wadMap.sidedefs[ linedef.rightSidedef ].sector == wadMap.sidedefs[ linedef.leftSidedef ].sector 
    ) continue;
    
    addLineToPolygon( line, linedef.rightSidedef );
    addLineToPolygon( leftLine, linedef.leftSidedef );
  }
  
  sectorLines.length = sectorMax + 1;
  
  return sectorLines;
}

function flatToCanvas( flat, palette ) {
  var canvas = document.createElement( 'canvas' ),
      context = canvas.getContext( '2d' ),
      imageData = context.createImageData( 64, 64 );
    
  canvas.width = canvas.height = 64;
  
  for( var y = 0; y < 64; y++ ) {
    for( var x = 0; x < 64; x++ ) {
      var pixel = flat.pixels[ y ][ x ],
          offset = ( y * imageData.width + x ) * 4;
      imageData.data[ offset ] = palette[ pixel ].red;
      imageData.data[ offset + 1 ] = palette[ pixel ].green;
      imageData.data[ offset + 2 ] = palette[ pixel ].blue;
      imageData.data[ offset + 3 ] = 255;
    }
  }    
    
  context.putImageData( imageData, 0, 0 );
      
  return canvas;
}


function flatToDataUrl( flat, palette ) {
  return flatToCanvas( flat, palette ).toDataURL( "image/png" );
}

function flatsToDataUrls( wad ) {
  var flats = {},
      keys = [];
  
  for( var f = 0; f < wad.flats.length; f++ ) {
    var flat = wad.flats[ f ];
    flats[ flat.name ] = flatToDataUrl( flat, wad.palettes[ 0 ] );
    keys.push( flat.name );
  }  
  
  flats.keys = keys;
  
  return flats;
}

function wadData( wad ) {
  $( 'body' ).append( '<h2>TOC:</h2>' );
  $( 'body' ).append( 
    '<ol>' + 
      '<li><a href="#raw">Raw wad data</a></li>' + 
      '<li><a href="#polygons">Polygons (first map)</a></li>' + 
      '<li><a href="#palette">Palettes</a></li>' + 
      '<li><a href="#flats">Flats</a></li>' + 
      '<li><a href="#iso">Iso map json</a></li>' + 
    '</ol>' 
  );
  $( 'body' ).append( '<h2 id="raw">Raw wad data:</h2>' );
  $( 'body' ).append( JSON.stringify( wad ) );
  $( 'body' ).append( '<h2 id="polygons">Polygons (first map):</h2>' );
  var sectorLines = findLinesForSectors( wad.maps[ 0 ] );
  $( 'body' ).append( JSON.stringify( sectorLines ) );
  $( 'body' ).append( '<h2 id="palette">Palettes:</h2>' );
  for( var p = 0; p < wad.palettes.length; p++ ) {
    var palette = wad.palettes[ p ];
    $( 'body' ).append( '<h3 style="clear: left;">Palette #' + p + ':</h3>' );
    for( var i = 0; i < 256; i++ ) {
      var clear = i % 16 === 0 ? ' clear: left;' : '',
          color = 'rgb( ' + palette[ i ].red + ', ' + palette[ i ].green + ', ' + palette[ i ].blue + ' )';
      $( 'body' ).append( '<div style="background: ' + color + '; float: left; width: 1em; height: 1em;' + clear + '"></div>' );
    }
  }
  $( 'body' ).append( '<h2 id="flats" style="clear: left;">Flats:</h2>' );
  for( var f = 0; f < wad.flats.length; f++ ) {
    var flat = wad.flats[ f ];
    
    $( 'body' ).append( flatToCanvas( flat, wad.palettes[ 0 ] ) );
  }
  $( 'body' ).append( JSON.stringify( flatsToDataUrls( wad ) ) );
  $( 'body' ).append( '<h2 id="iso" style="clear: left;">Iso map:</h2>' );
  $( 'body' ).append( JSON.stringify( wadMapToMap( wad.maps[ 0 ] ) ) );
}

loadWad( 'doom1.wad', wadData, logger );