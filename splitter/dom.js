const setWalls = ( svg, walls ) => {
  while ( svg.firstChild )
    svg.firstChild.remove()

  // subdivide, sort etc
  const sorted = identitySort( walls )

  sorted.forEach(
    wall => svg.appendChild( wallToSvg( wall ) )
  )

  // hack - just want to see the intersections
  const geometries = walls.map( createWallGeometry )
  const intersections = findIntersections( geometries )

  intersections.forEach(
    p => svg.appendChild(
      pointToCircle( p, 3, { class: 'intersection' } )
    )
  )

  saveWalls( walls )
}

const wallToSvg = wall => {
  const { x1, y1, x2, y2 } = wall
  const geometry = createWallGeometry( wall )
  const rect = getWallGeometryRect( geometry )

  const group = s(
    'g', { class: 'wall-group draggable confine' },

    s(
      'rect',
      Object.assign(
        { class: 'wall-bounds' },
        rect
      )
    ),

    ...rectToPoints( rect ).map(
      ( p, i ) =>
        pointToCircle(
          p, 3,
          { class: `wall-bounds-corner wall-bounds-corner--${ i }` }
        )
    ),

    s(
      'path',
      Object.assign(
        { class: 'wall-path' },
        wallGeometryToPathAttribute( geometry )
      )
    ),

    s(
      'line',
      Object.assign(
        { class: 'wall-line' },
        { x1, y1, x2, y2 }
      )
    ),

    pointToCircle( { x: x1, y: y1 }, 7, { class: 'wall-line-start draggable confine' } ),
    pointToCircle( { x: x2, y: y2 }, 5, { class: 'wall-line-end draggable confine' } )
  )

  Object.assign(
    group.dataset,
    {
      wall: JSON.stringify( wall ),
      geometry: JSON.stringify( geometry ),
      rect: JSON.stringify( rect )
    }
  )

  return group
}

const groupToWall = group => {
  const wallStart = group.querySelector( '.wall-line-start' )
  const wallEnd = group.querySelector( '.wall-line-end' )

  const { x: gx, y: gy } = getTranslate( group )
  const { x: dx1, y: dy1 } = getTranslate( wallStart )
  const { x: dx2, y: dy2 } = getTranslate( wallEnd )

  const wall = JSON.parse( group.dataset.wall )
  const { x1, y1, x2, y2, h } = wall

  return createWall(
    x1 + gx + dx1, y1 + gy + dy1,
    x2 + gx + dx2, y2 + gy + dy2,
    h
  )
}

const getTranslate = el => {
  const transforms = el.transform.baseVal

  if ( transforms.length === 0 )
    return createPoint( 0, 0 )

  const transform = transforms.getItem( 0 )

  if ( transform.type !== SVGTransform.SVG_TRANSFORM_TRANSLATE )
    return createPoint( 0, 0 )

  const { e, f } = transform.matrix

  return createPoint( e, f )
}

const svgToWalls = svg =>
  [ ...svg.querySelectorAll( 'g' ) ].map( groupToWall )

const wallGeometryToPathAttribute = geometry => {
  const points = wallGeometryToPoints( geometry )
  const d = pointsToPath( points )

  return { d }
}

const pointsToPath = ( [ head, ...rest ] ) =>
  rest.reduce(
    ( path, { x, y } ) => path + `L ${ x } ${ y } `,
    `M ${ head.x } ${ head.y }`
  ) + `L ${ head.x } ${ head.y }`

const h = ( name, attributes, ...children ) => {
  const el = document.createElement( name )

  if ( attributes ) {
    Object.assign( el, attributes )
  }

  children.forEach( child => {
    if ( typeof child === 'string' ) {
      child = document.createTextNode( child )
    }

    el.appendChild( child )
  } )

  return el
}

const pointToCircle = (
  { x, y }, r, attributes = {}
) =>
  s(
    'circle',
    Object.assign(
      attributes,
      { cx: x, cy: y, r }
    )
  )

const s = ( name, attributes, ...children ) => {
  const el = document.createElementNS( 'http://www.w3.org/2000/svg', name )

  if ( attributes ) {
    if ( attributes instanceof Node ) {
      children = [ attributes, ...children ]
    } else {
      setAttributes( el, attributes )
    }
  }

  children.forEach( child => el.appendChild( child ) )

  return el
}

const setAttributes = ( el, attributes ) => {
  Object.keys( attributes ).forEach(
    k => el.setAttribute( k, String( attributes[ k ] ) )
  )
}
