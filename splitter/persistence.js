const saveWalls = walls =>
  localStorage.setItem( 'iso-walls', JSON.stringify( walls ) )

const loadWalls = () => {
  const walls = localStorage.getItem( 'iso-walls' )

  if ( walls !== null ) return JSON.parse( walls )
}
