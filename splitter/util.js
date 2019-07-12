const createSequence = ( length, cb ) =>
  Array.from( { length }, ( _v, k ) => cb( k ) )
