//I'm sick of for loops
function each(array, iterator) {
  var l = array.length;
  for( var i = 0; i < l; i++ ) {
    iterator(array[i], i, array)
  }
}

function argv (search) { //pass in window.location.search

  var options = {}
  search.split('&').map(function (e) {
    var x = /\??([^=]+)=(.+)/.exec(e)
    options[x ? x[1] : e] = x ? x[2] : true
  })
  return options

}

console.error(argv("?key=value&whatever"))