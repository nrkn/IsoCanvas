/*
  Walls are drawn bottom to top in clockwise winding order:
  ____
 a| /|b     a|\ |b
  |/ |       | \|
 c/  |       |  \d
  |  /d     c\  |
  | /|       |\ |
 e|/_|f     e| \|f

x1,y1=d:    x1,y1=f:
x1>x2       x1>x2
y1<y2       y1>y2

x1,y1=e:    x1,y1=c:
x1<x2       x1<x2
y1>y2       y1<y2

*/
const createWallGeometry = wall => {
  const { x1, y1, x2, y2, h } = wall
  const start = getWallStartLabel( wall )
  const dy = Math.abs( y1 - y2 )

  let a, b, c, d, e, f, end

  if ( start === 'c' ) {
    a = createPoint( x1, y1 - h )
    b = createPoint( x2, y2 - h - dy )
    c = createPoint( x1, y1 )
    d = createPoint( x2, y2 - h )
    e = createPoint( x1, y1 + dy )
    f = createPoint( x2, y2 )
    end = 'f'
  }

  if ( start === 'd' ) {
    a = createPoint( x2, y2 - h - dy )
    b = createPoint( x1, y1 - h )
    c = createPoint( x2, y2 - h )
    d = createPoint( x1, y1 )
    e = createPoint( x2, y2 )
    f = createPoint( x1, y1 + dy )
    end = 'e'
  }

  if ( start === 'e' ) {
    a = createPoint( x1, y1 - h - dy )
    b = createPoint( x2, y2 - h )
    c = createPoint( x1, y1 - h )
    d = createPoint( x2, y2 )
    e = createPoint( x1, y1 )
    f = createPoint( x2, y2 + dy )
    end = 'd'
  }

  if ( start === 'f' ) {
    a = createPoint( x2, y2 - h )
    b = createPoint( x1, y1 - h - dy )
    c = createPoint( x2, y2 )
    d = createPoint( x1, y1 - h )
    e = createPoint( x2, y2 + dy )
    f = createPoint( x1, y1 )
    end = 'c'
  }

  return { a, b, c, d, e, f, start, end }
}

const getWallGeometryRect = ( { a, f } ) =>
  createRect( a.x, a.y, f.x - a.x + 1, f.y - a.y + 1 )

const getWallStartLabel = ( { x1, y1, x2, y2 } ) => {
  if ( x1 <= x2 && y1 <= y2 ) return 'c'
  if ( x1 >= x2 && y1 <= y2 ) return 'd'
  if ( x1 <= x2 && y1 >= y2 ) return 'e'
  if ( x1 >= x2 && y1 >= y2 ) return 'f'
}

const createWall = ( x1, y1, x2, y2, h ) => ( { x1, y1, x2, y2, h } )

const createRect = ( x = 0, y = 0, width = 0, height = 0 ) =>
  ( { x, y, width, height } )

const rectRight = ( { x, width } ) => x + width - 1

const rectBottom = ( { y, height } ) => y + height - 1

const createPoint = ( x = 0, y = 0 ) => ( { x, y } )

const createLine = ( x1 = 0, y1 = 0, x2 = 0, y2 = 0 ) => ( { x1, y1, x2, y2 } )

const rectToPoints = rect => [
  { x: rect.x, y: rect.y },
  { x: rectRight( rect ), y: rect.y },
  { x: rectRight( rect ), y: rectBottom( rect ) },
  { x: rect.x, y: rectBottom( rect ) }
]

const pointsToLines = ( points, close = true ) => {
  if ( !points.length ) return []

  const [ head ] = points

  if ( points.length === 1 ) return createLine( head.x, head.y, head.x, head.y )

  const lines = []

  for ( let i = 0; i < points.length - 1; i++ ) {
    const start = points[ i ]
    const end = points[ i + 1 ]

    lines.push( createLine( start.x, start.y, end.x, end.y ) )
  }

  if ( close ) {
    const start = points[ points.length - 1 ]
    const end = head

    lines.push( createLine( start.x, start.y, end.x, end.y ) )
  }

  return lines
}

const lineIntersection = ( a, b ) => {
  const { x1, y1, x2, y2 } = a
  const { x1: x3, y1: y3, x2: x4, y2: y4 } = b

  // Check if none of the lines are of length 0
  if ( ( x1 === x2 && y1 === y2 ) || ( x3 === x4 && y3 === y4 ) ) return

  const denominator = ( ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 ) )

  // Lines are parallel
  if ( denominator === 0 ) return

  const ua = (
    ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 )
  ) / denominator

  const ub = (
    ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 )
  ) / denominator

  // is the intersection along the segments
  if ( ua < 0 || ua > 1 || ub < 0 || ub > 1 ) {
    return
  }

  // Return a object with the x and y coordinates of the intersection
  const x = x1 + ua * ( x2 - x1 )
  const y = y1 + ua * ( y2 - y1 )

  return { x, y }
}

const wallGeometryToPoints = geometry => {
  const { a, b, c, d, e, f, start } = geometry

  // clockwise winding order
  if ( start === 'c' ) return [ c, a, d, f ]
  if ( start === 'd' ) return [ d, e, c, b ]
  if ( start === 'e' ) return [ e, c, b, d ]
  if ( start === 'f' ) return [ f, c, a, d ]
}

const findIntersections = geometries => {
  const intersections = []

  const lineSets = geometries.map(
    g => pointsToLines( wallGeometryToPoints( g ) )
  )

  const indices = createSequence( geometries.length, i => i )

  indices.forEach( i => {
    indices.forEach( j => {
      if ( i === j ) return

      const aLines = lineSets[ i ]
      const bLines = lineSets[ j ]

      aLines.forEach( ( aLine, k ) => {
        bLines.forEach( ( bLine, l ) => {
          const intersection = lineIntersection( aLine, bLine )

          if ( !intersection ) return

          Object.assign(
            intersection,
            { geometries: [ i, j ], lines: [ k, l ] }
          )
          intersections.push( intersection )
        } )
      } )
    } )
  } )

  return intersections
}

const geometryIntersections = ( geometries, callback ) => {
  const intersections = []

  const lineSets = geometries.map(
    g => pointsToLines( wallGeometryToPoints( g ) )
  )

  const indices = createSequence( geometries.length, i => i )

  indices.forEach( i => {
    indices.forEach( j => {
      if ( i === j ) return

      const aLines = lineSets[ i ]
      const bLines = lineSets[ j ]

      aLines.forEach( ( aLine, k ) => {
        bLines.forEach( ( bLine, l ) => {
          const intersection = lineIntersection( aLine, bLine )

          if ( !intersection ) return

          callback(  )

          Object.assign(
            intersection,
            { geometries: [ i, j ], lines: [ k, l ] }
          )
          intersections.push( intersection )
        } )
      } )
    } )
  } )

  return intersections
}
