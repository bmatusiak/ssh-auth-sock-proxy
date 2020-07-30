# SYNOPSIS
Breaks out `parse()` from event stream, emits errors instead of `console.error()`. If you are intending on parsing JSON that comes from an unknown source, you should use [`JSONParse`](https://github.com/dominictarr/JSONStream).

# USAGE
```js
var parse = require('through-parse')

stream
  .pipe(parse())
  .pipe(through(function(obj) {
  	if (obj.id == 'foo') {
  	  obj.id = 'bar'
  	  this.push(obj)
  	}
  }).pipe(stream)
```
