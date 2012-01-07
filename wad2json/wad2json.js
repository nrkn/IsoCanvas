function wad( view ) {
  var wad = {};
  
  wad.header = {
    wadType: view.getString( 4 ),
    numLumps: view.getInt32(),
    directoryOffset: view.getInt32()
  };
  
  view.seek( wad.header.directoryOffset );
  wad.directory = [];  
  wad.maps = [];
  for( var i = 0; i < wad.header.numLumps; i++ ) {
    wad.directory.push({
      position: view.getInt32(),
      size: view.getInt32(),
      name: view.getString( 8 ).replace( /\u0000/g, '' )      
    });    
    if( wad.directory[ i ].name.match( /^E\dM\d|MAP\d\d$/ ) ) {
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
  }
  
  for( var i = 0; i < wad.maps.length; i++ ) {
    var map = wad.maps[ i ];
    var index = map.index + 1;
    var indices = {
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
    
    //for now only get things we need, ignore nodes etc.
    var thingsEntry = wad.directory[ indices.things ];
    map.things = getThings( view, thingsEntry );
    
    var linedefsEntry = wad.directory[ indices.linedefs ];
    map.linedefs = getLinedefs( view, linedefsEntry );
    
    var sidedefsEntry = wad.directory[ indices.sidedefs ];
    map.sidedefs = getSidedefs( view, sidedefsEntry );
    
    var vertexesEntry = wad.directory[ indices.vertexes ];
    map.vertexes = getVertexes( view, vertexesEntry );
    
    var sectorsEntry = wad.directory[ indices.sectors ];
    map.sectors = getSectors( view, sectorsEntry );
  }  
  
  wadData( wad );
}

function getThings( view, thingsEntry ) {
  var things = [];
  view.seek( thingsEntry.position );
  for( var i = 0; i < thingsEntry.size / 10; i++ ) {
    things.push({
      x: view.getInt16(),
      y: view.getInt16(),
      angle: view.getInt16(),
      type: view.getInt16(),
      flags: view.getInt16()
    });
  } 
  return things;  
}

function getLinedefs( view, linedefsEntry ) {
  var linedefs = [];
  view.seek( linedefsEntry.position );
  for( var i = 0; i < linedefsEntry.size / 14; i++ ) {
    linedefs.push({
      startVertex: view.getInt16(),
      endVertex: view.getInt16(),
      flags: view.getInt16(),
      specialType: view.getInt16(),
      sectorTag: view.getInt16(),
      rightSidedef: view.getInt16(),
      leftSidedef: view.getInt16()
    });
  } 
  return linedefs;  
}

function getSidedefs( view, sidedefsEntry ) {
  var sidedefs = [];
  view.seek( sidedefsEntry.position );
  for( var i = 0; i < sidedefsEntry.size / 30; i++ ) {
    sidedefs.push({
      xOffset: view.getInt16(),
      yOffset: view.getInt16(),
      upperTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
      lowerTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
      middleTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
      sector: view.getInt16()
    });
  } 
  return sidedefs;
}

function getVertexes( view, vertexesEntry ) {
  var vertexes = [];
  view.seek( vertexesEntry.position );
  for( var i = 0; i < vertexesEntry.size / 4; i++ ) {
    vertexes.push({
      x: view.getInt16(),
      y: view.getInt16(),
    });
  } 
  return vertexes;
}

function getSectors( view, sectorsEntry ) {
  var sectors = [];
  view.seek( sectorsEntry.position );
  for( var i = 0; i < sectorsEntry.size / 26; i++ ) {
    sectors.push({
      floorHeight: view.getInt16(),
      ceilingHeight: view.getInt16(),
      floorTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
      ceilingTexture: view.getString( 8 ).replace( /\u0000/g, '' ),
      lightLevel: view.getInt16(),
      type: view.getInt16(),      
      tag: view.getInt16()
    });
  }
  return sectors;
}

function wadMapToMap( wadMap ) {
  var map = {
    walls: [],
    floors: []
  };
  
  //make map top left 0,0
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

function wadData( wad ) {
  $( 'body' ).append( JSON.stringify( wad ) );
  $( 'body' ).append( '<h2>Iso map:</h2>' );
  $( 'body' ).append( JSON.stringify( wadMapToMap( wad.maps[ 0 ] ) ) );
}

// Download the file
$.get('doom1.wad', wad, 'dataview');