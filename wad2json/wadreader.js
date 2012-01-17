var loadWad = function( file, onload, logger ) {
  'use strict';
  
  if( logger === undefined || !$.isFunction( logger ) ) {
    logger = function( message ){};
  }
  
  //Very much assumes that wad is well formed. There is no error checking to 
  //handle it if it's not
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
    
    logger( 'Reading header' );
    wad.header = {
      wadType: view.getString( 4 ),
      numLumps: view.getInt32(),
      directoryOffset: view.getInt32()
    };
    
    logger( 'Reading ' + wad.header.numLumps + ' lumps' );
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
        logger( 'Found map ' + wad.directory[ i ].name );
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
        logger( 'Found flats' );
        inFlats = true;
        //can wad have more than one flats section? if so this is wrong!
        wad.flats = [];
      }
      
      if( inFlats ) {
        if( wad.directory[ i ].name === 'F_END' ) {
          inFlats = false;
        } else if( wad.directory[ i ].size === 4096 ) {
          //save index for later processing
          wad.flats.push( i );
        }
      }
      
      if( wad.directory[ i ].name === 'PLAYPAL' ) {
        logger( 'Found palette' );
        //temporarily store index in palettes so we know where to find them later
        wad.palettes = i;
      }
    }
    
    //pwads don't usually have palettes so check if we found one in the directory
    if( wad.palettes !== undefined ) {
      logger( 'Reading palettes' );
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
    
    if( wad.flats !== undefined ) {
      logger( 'Reading ' + wad.flats.length + ' flats' );
      var getRow = function() {
        var cols = [];
        for( var x = 0; x < 64; x++ ) {
          cols.push( view.getUint8() );
        }
        return cols;
      };
      each( wad.flats, function( flat, index ) {
        var rows = getRecords( wad.directory[ wad.flats[ index ] ], getRow );
        wad.flats[ index ] = {
          name: wad.directory[ wad.flats[ index ] ].name,
          pixels: rows
        };        
      });
    }
    
    logger( 'Reading ' + wad.maps.length + ' maps' );
    each( wad.maps, function( map ){
      var index = map.index + 1,
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
          specialType: view.getInt16(),
          // http://doom.wikia.com/wiki/Linedef#Linedef_flags
          sectorTag: view.getInt16(),
          // The special value '-1' is used to indicate no sidedef, in one-sided lines. 
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
          y: view.getInt16()
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
      
      var nodesEntry = wad.directory[ indices.nodes ],
          getChildNodeType = function( index ) {
                        
          };      
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
    });
    
    logger( 'Finished reading wad' );
    
    onload( wad );
  }

  // Download the file
  $.get( file, parseWad, 'dataview' );
};