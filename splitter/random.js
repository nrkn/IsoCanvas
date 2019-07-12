const randomWalls = ( width, height, count = wallCount ) =>
  createSequence(
    count, () => randomWall( width, height )
  )

const randomWall = ( width, height, h = height / 20 ) =>
  createWall( ...randomLine( width, height - h, 0, h ), h )

const randomLine = ( width, height, x = 0, y = 0 ) => {
  const x1 = randomInt( width ) + x
  const y1 = randomInt( height ) + y
  const x2 = randomInt( width ) + x
  const y2 = randomInt( height ) + y

  return [ x1, y1, x2, y2 ]
}

const randomInt = ( exclMax ) => Math.floor( Math.random() * exclMax )
