
/*
 moved all the map stuff into this file.


*/

var map = {
  walls: [
    //pentagon
    {
      start: { x: 400, y: 0 },
      end: { x: 800, y: 300 },
      image: 'RW10_3',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 }
    },
    {
      start: { x: 800, y: 300 },
      end: { x: 650, y: 800 },
      image: 'RW10_3',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 }
    },
    {
      start: { x: 650, y: 800 },
      end: { x: 150, y: 800 },
      image: 'RW10_3',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 }
    },
    {
      start: { x: 150, y: 800 },
      end: { x: 0, y: 300 },
      image: 'RW10_3',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 }
    },
    {
      start: { x: 0, y: 300 },
      end: { x: 400, y: 0 },
      image: 'RW10_3',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 }
    },
  ],
  floors: [],
  sprites: [
    {
      position: { x: 400, y: 400 },
      image: 'TROOB1',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 }
    },
    {
      position: { x: 300, y: 300 },
      image: 'TROOB1',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 }
    },
        {
      position: { x: 600, y: 100 },
      image: 'TROOB1',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 }
    }

  ]
}

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
  //problematicWalls should be okayWalls?
  //commenting this out for now...
/*
  var newWalls = [];
  var problematicWalls = []; //[ 3, 4, 5, 11, 12, 13, 14 ];
  for( var i = 0; i < map.walls.length; i++ ) {
    if( problematicWalls.indexOf( map.walls[ i ].id ) == -1 ) {
      newWalls.push( map.walls[ i ] );
    }
  }
  map.walls = newWalls;
*/

function pointsToWalls( points, image, floor, ceiling, offset ) {
  var walls = [];
  for( var i = 0; i < points.length; i++ ) {
    var point = points[ i ];
    var nextPoint = i < points.length - 1 ? points[ i + 1 ] : points[ 0 ];
    walls.push({
      start: point,
      end: nextPoint,
      image: image,
      floor: floor,
      ceiling: ceiling,
      offset: offset
    });
  }
  return walls;
}


//*/

