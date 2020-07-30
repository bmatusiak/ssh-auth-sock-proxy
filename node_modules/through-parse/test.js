var assert = require('better-assert')
var l = console.log
var parse = require('./index')

var PassThrough = require('stream').PassThrough
var s = new PassThrough()

s.writable = s.readable = true
var through = require('through')
var t = through()

s.pipe(parse()).pipe(through(function(obj) {
	l('The data was parsed from a buffer.')
	assert(obj.test == true)
}))

t.pipe(parse()).pipe(through(function(obj) {
	l('The data was parsed from a json stream.')
	assert(obj.test == true)
}))

s.write(JSON.stringify({ test: true }))
t.write({ test: true })
