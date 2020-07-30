var through = require('through')

module.exports = function () { 
  return through(function (data) {
    try {
      if (data && (Buffer.isBuffer(data)
        || typeof data != 'object')) {

        data = JSON.parse(data.toString())
      }
    } catch (err) {
      return this.emit('error', err)
    }
    if(data !== undefined) {
      this.emit('data', data)
    }
  })
}
