

function List (value, next) {
  this.value = value
  this.next = next
}

//if compare is a function,
List.prototype.insert = function (value, compare) {
  if(0 > compare(this.value, value)) {
    if(this.next == null) 
      this.append(value)
    else
      this.next.insert(value, compare)
  } else {
    this.next = new List(this.value, this.next)
    this.value = value
  }
}

List.prototype.append = function (value) {
  if(!this.next) 
    this.next = new List(value)
  else 
    this.next.append(value)
}

List.prototype.toArray = function () {
  if(this.next){
    var a = this.next.toArray()
    a.unshift(this.value)
    return a
  } else
    return [this.value]
}

List.prototype.length = function () {
  if(this.next)
    return 1 + this.next.length()
  return 1
}

//---------------------------- tests

if (true) { //make a configurable option for tests

  function assert(test, message) {
    if(!test) throw new Error(message)
  }

  var l = new List(1)
  l.append(3)
  assert(l.length() == 2, 'length must == 2')
  var a
  assert(JSON.stringify(a = l.toArray()) == JSON.stringify([1,3]), 'should be array:' + a)

  var natural = function (a,b) {
    return a - b
  }

  l.insert(2, natural)

  assert(JSON.stringify(a = l.toArray()) == JSON.stringify([1,2,3]), 'should be array:' + a)

  l.insert(0, natural)
  l.insert(6, natural)

  assert(JSON.stringify(a = l.toArray()) == JSON.stringify([0,1,2,3,6]), 'should be array:' + a)

}