module.exports = function(proc_args) {

  var spawn = require('child_process').spawn;

  var bin = proc_args.shift();

  var p = spawn(bin, proc_args, {
    detached: true,
    // stdio: 'ignore'
  });

  return p;

};