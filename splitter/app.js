const wallCount = 5

const app = () => {
  const { svg, width, height } = initSvg()

  const walls = loadWalls() || randomWalls( width, height )

  setWalls( svg, walls )

  initActions( svg, width, height )

  makeDraggable(
    svg,
    el => onDragStart( svg, el ),
    el => onDrag( svg, el ),
    el => onDragEnd( svg, el )
  )
}

const dragState = {
  line: null
}

const onDragStart = ( svg, el ) => {
  wallLineDrag( el, ( x1, y1, x2, y2, group ) => {
    dragState.line = s( 'line', { class: 'drag-line', x1, y1, x2, y2 } )

    group.insertBefore( dragState.line, el )
  } )
}

const onDrag = ( svg, el ) => {
  wallLineDrag( el, ( x1, y1, x2, y2 ) => {
    setAttributes( dragState.line, { x1, y1, x2, y2 } )
  } )
}

const wallLineDrag = ( el, callback ) => {
  const isWallLineStart = el.classList.contains( 'wall-line-start' )
  const isWallLineEnd = el.classList.contains( 'wall-line-end' )

  if ( isWallLineStart || isWallLineEnd ) {
    const group = el.closest( '.wall-group' )
    const otherEndEl = group.querySelector(
      isWallLineStart ? '.wall-line-end' : '.wall-line-start'
    )

    const { x: dx, y: dy } = getTranslate( el )
    const x1 = Number( el.getAttribute( 'cx' ) ) + dx
    const y1 = Number( el.getAttribute( 'cy' ) ) + dy
    const x2 = Number( otherEndEl.getAttribute( 'cx' ) )
    const y2 = Number( otherEndEl.getAttribute( 'cy' ) )

    callback( x1, y1, x2, y2, group )
  }
}

const onDragEnd = ( svg, el ) => {
  const isWallLineStart = el.classList.contains( 'wall-line-start' )
  const isWallLineEnd = el.classList.contains( 'wall-line-end' )

  if ( isWallLineStart || isWallLineEnd ) {
    //dragState.line.remove()

    //delete dragState.line
  }

  refreshWalls( svg )
}

const refreshWalls = svg => {
  const walls = svgToWalls( svg )

  setWalls( svg, walls )
}

/* initialize */

const initActions = ( svg, width, height ) => {
  const randomizeButton = document.querySelector( '[data-action="randomize"]' )
  const clearButton = document.querySelector( '[data-action="clear"]' )
  const addButton = document.querySelector( '[data-action="add"]' )
  const removeButton = document.querySelector( '[data-action="remove"]' )

  randomizeButton.onclick = () => {
    const walls = randomWalls( width, height )

    setWalls( svg, walls )
  }

  clearButton.onclick = () => {
    setWalls( svg, [] )
  }

  addButton.onclick = () => {
    const existing = svgToWalls( svg )
    const wall = randomWall( width, height )

    setWalls( svg, [ ...existing, wall ] )
  }

  removeButton.onclick = () => {
    const existing = svgToWalls( svg )

    if( existing.length ) existing.pop()

    setWalls( svg, existing )
  }
}

const initSvg = () => {
  const svg = document.querySelector( 'svg' )
  const { width, height } = svg.getBoundingClientRect()

  svg.setAttribute( 'viewBox', `0 0 ${ width } ${ height }` )

  return { svg, width, height }
}

document.addEventListener( 'DOMContentLoaded', app )
