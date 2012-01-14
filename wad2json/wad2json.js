var logger = function( message ) {
  $( '#log' ).append( message + '<br />' );
};
function parseWad( view ) {
  var wad = {
        header: {},
        directory: [],
        maps: []    
      },
      getRecords = function getRecords( entry, recordReader ) {
        var records = [];
        view.seek( entry.position );
        while( view.tell() < entry.position + entry.size ) {
          records.push( recordReader() );
        }
        return records;
      },
      inFlats = false;
  
  if( logger ) logger( 'Reading header' );
  wad.header = {
    wadType: view.getString( 4 ),
    numLumps: view.getInt32(),
    directoryOffset: view.getInt32()
  };
  
  if( logger ) logger( 'Reading ' + wad.header.numLumps + ' lumps' );
  view.seek( wad.header.directoryOffset );
  for( var i = 0; i < wad.header.numLumps; i++ ) {
    wad.directory.push({
      position: view.getInt32(),
      size: view.getInt32(),
      name: view.getString( 8 ).replace( /\u0000/g, '' )      
    });    
    //if we found a map entry add it to maps because the following entries 
    //contain its data so we need to save the index so we know where to start 
    //reading them from
    if( wad.directory[ i ].name.match( /^E\dM\d|MAP\d\d$/ ) ) {
      if( logger ) logger( 'Found map ' + wad.directory[ i ].name );
      wad.maps.push({
        name: wad.directory[ i ].name,
        index: i,
        things: [],
        linedefs: [],
        sidedefs: [],
        vertexes: [],
        segs: [],
        ssectors: [],
        nodes: [],
        sectors: [],
        reject: [],
        blockmap: []
      });
    }
    
    //flats?
    if( wad.directory[ i ].name === 'F_START' ) {
      if( logger ) logger( 'Found flats' );
      inFlats = true;
      //can wad have more than one flats section? if so this is wrong!
      wad.flats = [];
    }
    
    if( inFlats ) {
      if( wad.directory[ i ].name === 'F_END' ) {
        inFlats = false;
      } else if( wad.directory[ i ].size == 4096 ) {
        //save index for later processing
        wad.flats.push( i );
      }
    }
    
    if( wad.directory[ i ].name === 'PLAYPAL' ) {
      if( logger ) logger( 'Found palette' );
      //temporarily store index in palettes so we know where to find them later
      wad.palettes = i;
    }
  }
  
  //pwads don't usually have palettes so check if we found one in the directory
  if( wad.palettes != undefined ) {
    if( logger ) logger( 'Reading palettes' );
    wad.palettes = getRecords( wad.directory[ wad.palettes ], function() {
      var palette = [];
      for( var j = 0; j < 256; j++ ) {
        var red = view.getUint8(),
            green = view.getUint8(),
            blue = view.getUint8();
        
        palette.push({
          red: red,
          green: green,
          blue: blue
        });
      }
      
      return palette;
    });
  } else {
    wad.palettes = [];
  }
  
  if( wad.flats ) {
    if( logger ) logger( 'Reading ' + wad.flats.length + ' flats' );
    for( var i = 0; i < wad.flats.length; i++ ) {
      var pixels = getRecords( wad.directory[ wad.flats[ i ] ], function(){      
        var rows = [];
        for( var y = 0; y < 64; y++ ) {
          var cols = [];
          for( var x = 0; x < 64; x++ ) {
            cols.push( view.getUint8() );
          }
          rows.push( cols );
        }
        return rows;
      })[ 0 ];
      wad.flats[ i ] = {
        name: wad.directory[ wad.flats[ i ] ].name,
        pixels: pixels
      };
    }
  }
  
  if( logger ) logger( 'Reading ' + wad.maps.length + ' maps' );
  for( var i = 0; i < wad.maps.length; i++ ) {
    var map = wad.maps[ i ],        
        index = map.index + 1,
        //the following entries must follow the map descriptor in this order
        indices = {
          things: index++,
          linedefs: index++,
          sidedefs: index++,
          vertexes: index++,
          segs: index++,
          ssectors: index++,
          nodes: index++,
          sectors: index++,
          reject: index++,
          blockmap: index
        };
    
    var thingsEntry = wad.directory[ indices.things ];
    map.things = getRecords( thingsEntry, function() {
      return {
        x: view.getInt16(),
        y: view.getInt16(),
        angle: view.getUint16(),
        type: view.getInt16(),
        /*
          would be more useful to expand these out into what they mean
          but then, would we even use them?
          0		Thing is on skill levels 1 & 2
          1		Thing is on skill level 3
          2		Thing is on skill levels 4 & 5
          3		Thing is deaf
          4		Thing is not in single player 
        */
        flags: view.getInt16()
      };
    });
    
    var linedefsEntry = wad.directory[ indices.linedefs ];
    map.linedefs = getRecords( linedefsEntry, function() {
      return {
        startVertex: view.getInt16(),
        endVertex: view.getInt16(),
        flags: view.getInt16(),
        // The special value '-1' is used to indicate no sidedef, in one-sided lines. 
        specialType: view.getInt16(),
        // http://doom.wikia.com/wiki/Linedef#Linedef_flags
        sectorTag: view.getInt16(),
        rightSidedef: view.getInt16(),
        leftSidedef: view.getInt16()
      };
    });
    
    var sidedefsEntry = wad.directory[ indices.sidedefs ];
    map.sidedefs = getRecords( sidedefsEntry, function() {
      return {
        xOffset: view.getInt16(),
        yOffset: view.getInt16(),
        upperTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
        lowerTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
        middleTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
        sector: view.getInt16()     
      };
    });
    
    var vertexesEntry = wad.directory[ indices.vertexes ];
    map.vertexes = getRecords( vertexesEntry, function() {
      return {
        x: view.getInt16(),
        y: view.getInt16(),
      };
    });
    
    var segsEntry = wad.directory[ indices.segs ];
    map.segs = getRecords( segsEntry, function(){
      return {
        startVertex: view.getInt16(),
        endVertex: view.getInt16(),
        angle: view.getUint16(),        
        linedef: view.getInt16(),        
        direction: view.getInt16(),        
        offset: view.getInt16()
      };
    });
    
    var ssectorsEntry = wad.directory[ indices.ssectors ];
    map.ssectors = getRecords( ssectorsEntry, function(){
      return {
        segCount: view.getInt16(),
        firstSeg: view.getInt16()      
      };
    });
    
    var nodesEntry = wad.directory[ indices.nodes ];
    map.nodes = getRecords( nodesEntry, function(){
      var node = {
        partitionLineX: view.getInt16(),
        partitionLineY: view.getInt16(),
        changeInX: view.getInt16(),
        changeInY: view.getInt16(),
        boundingBoxes: {
          right: {
            top: view.getInt16(),
            bottom: view.getInt16(),
            left: view.getInt16(),
            right: view.getInt16() 
          },
          left: {
            top: view.getInt16(),
            bottom: view.getInt16(),
            left: view.getInt16(),
            right: view.getInt16() 
          }
        },
        children: {
          right: view.getInt16(),
          left: view.getInt16()          
        }
      };
      
      //TODO here we need a little code to modify children, because:
      /*
        http://doom.wikia.com/wiki/Node
        The type of each child field is determined by its sign bit (bit 15). If 
        bit 15 is zero, the child field gives the node number of a subnode. If 
        bit 15 is set, then bits 0-14 give the number of a subsector. 
        
        so:
        if( node.children.FOO < 0 ) {
          node.children.FOO = {
            type: 'subsector',
            index: bitshifted original index
          }
        } else {
          node.children.FOO = {
            type: 'subnode',
            index: original index
          }
        }
        
        not implemented yet as I can't be bothered dealing with bitshifting 
        until I have some tests to make sure my code works
      */
      return node;
    });
    
    var sectorsEntry = wad.directory[ indices.sectors ];
    map.sectors = getRecords( sectorsEntry, function() {
      return {
        floorHeight: view.getInt16(),
        ceilingHeight: view.getInt16(),
        floorTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
        ceilingTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
        lightLevel: view.getInt16(),
        type: view.getInt16(),      
        tag: view.getInt16()
      };
    });
    
    /*
      TODO: reject table - it's a sector lookup table to determine if one sector
      is visible from another as real-time line-of-sight is an expensive 
      operation - not implemented yet as I can't be bothered dealing with 
      bitshifting until I have some tests to make sure my code works
    
      http://doom.wikia.com/wiki/Reject
      
      var rejectsEntry etc.
    */

    /*
      TODO: blockmaps, these are just the map divided into a grid then a listing
      of linedefs in each cell, used to collision detection so you know given
      an object's grid location which linedefs it could potentially collide
      with - this is actually quite fast to generate without using the 
      precalculated data
    */
  }  
  if( logger ) logger( 'Finished reading wad' );
  
  wadData( wad );
}

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

// Download the file
$.get( 'doom1.wad', parseWad, 'dataview' );