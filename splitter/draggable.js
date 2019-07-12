const makeDraggable = (
  svg,
  onDragStart = () => {},
  onDrag = () => {},
  onDragEnd = () => {}
) => {
  let selectedElement, offset, transform, minX, maxX, minY, maxY, confined

  const { width, height } = svg.getBoundingClientRect()

  const boundaryX1 = 0
  const boundaryX2 = width
  const boundaryY1 = 0
  const boundaryY2 = height

  const getMousePosition = e => {
    const CTM = svg.getScreenCTM()

    if ( e.touches )
      e = e.touches[ 0 ]

    return {
      x: ( e.clientX - CTM.e ) / CTM.a,
      y: ( e.clientY - CTM.f ) / CTM.d
    }
  }

  const findTarget = el => {
    if( el.classList.contains( 'draggable' ) ) return el

    return el.closest( '.draggable' )
  }

  const startDrag = e => {
    selectedElement = findTarget( e.target )

    if( !selectedElement ) return

    svg.classList.add( 'dragging' )
    selectedElement.classList.add( 'selected' )

    offset = getMousePosition( e )

    // Make sure the first transform on the element is a translate transform
    const transforms = selectedElement.transform.baseVal

    if (
      transforms.length === 0 ||
      transforms.getItem( 0 ).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE
    ) {
      // Create an transform that translates by (0, 0)
      const translate = svg.createSVGTransform()

      translate.setTranslate( 0, 0 )
      selectedElement.transform.baseVal.insertItemBefore( translate, 0 )
    }

    // Get initial translation
    transform = transforms.getItem( 0 )
    offset.x -= transform.matrix.e
    offset.y -= transform.matrix.f

    confined = selectedElement.classList.contains( 'confine' )

    if ( confined ) {
      const bbox = selectedElement.getBBox()
      minX = boundaryX1 - bbox.x
      maxX = boundaryX2 - bbox.x - bbox.width
      minY = boundaryY1 - bbox.y
      maxY = boundaryY2 - bbox.y - bbox.height
    }

    onDragStart( selectedElement )
  }

  const drag = e => {
    if( !selectedElement ) return

    e.preventDefault()

    var coord = getMousePosition( e )
    var dx = coord.x - offset.x
    var dy = coord.y - offset.y

    if ( confined ) {
      if ( dx < minX ) {
        dx = minX
      } else if ( dx > maxX ) {
        dx = maxX
      }

      if ( dy < minY ) {
        dy = minY
      } else if ( dy > maxY ) {
        dy = maxY
      }
    }

    transform.setTranslate( dx, dy )

    onDrag( selectedElement )
  }

  const endDrag = () => {
    if( !selectedElement ) return

    selectedElement.classList.remove( 'selected' )
    svg.classList.remove( 'dragging' )

    onDragEnd( selectedElement )

    selectedElement = false
  }

  svg.addEventListener( 'mousedown', startDrag )
  svg.addEventListener( 'mousemove', drag )
  svg.addEventListener( 'mouseup', endDrag )
  svg.addEventListener( 'mouseleave', endDrag )
  svg.addEventListener( 'touchstart', startDrag )
  svg.addEventListener( 'touchmove', drag )
  svg.addEventListener( 'touchend', endDrag )
  svg.addEventListener( 'touchleave', endDrag )
  svg.addEventListener( 'touchcancel', endDrag )
}