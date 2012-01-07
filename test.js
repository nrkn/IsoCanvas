


var test_count = 1;
function assert (test, message) {
  console.log((test ? 'ok ' : 'not ok ') + (test_count++) + ' - ' + message)
}

var walls1 = [
    //nearly touch
    {
      start: { x: 325, y: 300 },
      end: { x: 500, y: 250 },
      order: 0
    },
    {
      start: { x: 200, y: 200 },
      end: { x: 500, y: 500 },
      order: 1
    }
  ]

var walls2 = [
    //parallel, ordering is simple
    {
      start: { x: 100, y: 100 },
      end: { x: 500, y: 100 },
      order: 0
    },
    {
      start: { x: 120, y: 120 },
      end: { x: 480, y: 120 },
      order: 1
    }
  ]

var walls3 = [
    {
      start: { x: 100, y: 100 },
      end: { x: 500, y: 500 },
      order: 1
    },
    {
      start: { x: 100, y: 300 },
      end: { x: 300, y: 300 },
      order: 0
    }
  ]

var walls4 = [
    {
      start: { x: 100, y: 100 },
      end: { x: 500, y: 500 },
      order: 0
    },
    {
      start: { x: 300, y: 300 },
      end: { x: 100, y: 300 },
      order: 1
    }
  ]
  
var walls5 = [
   /*{
      start: { x: 325, y: 300 },
      end: { x: 500, y: 250 },
      image: 'RW10_3',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 },
      order: 0
    },*/
    {
      start: { x: 200, y: 200 },
      end: { x: 500, y: 500 },
      image: 'RW10_3',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 },
      order: 1
    },
    /*{
      start: { x: 250, y: 250 },
      end: { x: 300, y: 10 },
      image: 'RW10_3',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 },
      order: 0
    },*/
    {
      end: { x: 350, y: 350 },
      start: { x: 0, y: 500 },
      image: 'RW10_3',
      floor: 0,
      ceiling: 128,
      offset: { x: 0, y: 0 },
      order: 2
    }
  ]

function assertWallsOrdered(map, message) {
  sortMap(map)
  var max = null
  map.walls.forEach(function (w) {
    if(max == null) max = w.order
      assert(max <= w.order, message + ': walls must be in order max=' + max+ ' order=' + w.order), max = w.order  
  })
}

// assert wall order
assertWallsOrdered({walls: walls1}, "behind")
assertWallsOrdered({walls: walls2}, "parallel")
assertWallsOrdered({walls: walls3}, "touching")
assertWallsOrdered({walls: walls4}, "infront")
assertWallsOrdered({walls: walls5}, "many")

// assert gradient

assert(gradient({start: {x: 0, y:0},end: {x:1,y:1}}) == 1,'gradient should == 1')
assert(gradient({start: {x: 0, y:0},end: {x:1,y:0}}) == 0,'gradient should == 0')
assert(gradient({start: {x: 0, y:0},end: {x:1,y:-1}}) == -1,'gradient should == -1')
assert(gradient({start: {x: 0, y:0},end: {x:-1,y:-1}}) == 1,'gradient should == 1')
assert(gradient({start: {x: 0, y:0},end: {x:5,y:1}}) == 0.2,'gradient should == 0.2')


//argh, need a propper deepEquals test... too verbose

function assertIntersection( a,b, ex) {

  var inter = getIntersection(a,b)

  assert(inter.left == ex.left, 'left')
  assert(inter.right == ex.right, 'right')
  assert(inter.top == ex.top, 'top')
  assert(inter.bottom == ex.bottom, 'bottom')
}

  assertIntersection(
    {left: 0, right: 5, top: 0, bottom: 5}, 
    {left: 1, right: 10, top: 2, bottom: 3},
    {left: 1, right: 5, top: 2, bottom: 3}
  )
  assertIntersection(
    {left: 0, right: 5, top: 0, bottom: 5}, 
    {left: -1, right: 3, top: -2, bottom: 3},
    {left: 0, right:3, top: 0, bottom: 3}
  )


assert(painterSort(
  { start: { x: 200, y: 200 },
    end: { x: 500, y: 500 },
    order: 1
  },
  {
    end: { x: 350, y: 350 },
    start: { x: 0, y: 500 },
    order: 2
  }) == -1, 'painterSort')
