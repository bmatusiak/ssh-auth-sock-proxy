var net = require('net');
var spawn = require('child_process').spawn;
var fs = require('fs');


var SSH_AUTH_SOCK_PATH_PREFIX = "/tmp/my-ssh-agent."
var SSH_AUTH_SOCK_PATH_POSTFIX = ".sock"

function createServer(socketName, callback, onConnect) {
  var SSH_AUTH_SOCK_PATH = SSH_AUTH_SOCK_PATH_PREFIX + socketName + SSH_AUTH_SOCK_PATH_POSTFIX;

  // console.log('ssh-agent setup', SSH_AUTH_SOCK_PATH);

  function routeEvent(stream) {
    //console.log('ssh-agent client connected');

    stream.on('end', function() {
      //console.log('ssh-agent client disconnected');
    });

    stream.on('error', function(err) {
      //console.log("err", err);
      // stream.write({ error: err.toString() });
    });


    stream
      .on('data', function(data) {
        //console.log("data", data);
      });
    onConnect(stream);
  }

  var server = net.createServer(routeEvent);

  fs.unlink(SSH_AUTH_SOCK_PATH, function() {
    // TODO: permissions on socket?
    server.listen(SSH_AUTH_SOCK_PATH, function() {
      callback(null, SSH_AUTH_SOCK_PATH, server);
    });
  });


  return server;

};


function connectServer(socketPath, callback) {

  function routeEvent(stream) {
    // console.log('ssh-agent server connected');

    stream.on('end', function() {
      // console.log('ssh-agent server disconnected');
    });

    stream.on('error', function(err) {
      // console.log("err", err);
      // stream.write({ error: err.toString() });
    });


    stream
      .on('data', function(data) {
        // console.log("data", data);
      });
    callback(stream);
  }

  routeEvent(net.connect(socketPath));


};

function cFactory() {

  // connectServer(socketPath, function(sockClient) {

  return
}

var useOnlykeyAgent = true  ;//true;

module.exports = function(options) {
  var socket = options.socket;

  if (options.master) {
    socket.on("request-key-connection", function(key, connect_id, callback) {
      // console.log("request-key-connection recieved for key", key);
      // var connect_id = Date.now();
      var sockClient = false;
      var unsent_messages = [];
      
      socket.on(connect_id + "-in", function(data) {
        // console.log(connect_id + "-in", data);
        if(!sockClient){
          unsent_messages.push(data);
        }
        
        if (sockClient) {
          sockClient.write(data);
        }
        else if (useOnlykeyAgent && unsent_messages.length == 1) {
          // console.log("starting local agent")
          var ok_socket_proc = ok_socket(key, function(socketPath) {
            // console.log("local agent started for key", key, "at", socketPath)
            connectServer(socketPath, function($sockClient) {
              // console.log("connected to local agent")
              $sockClient.on("data", function(data) {
                // console.log(connect_id + "-out", data);
                socket.emit(connect_id + "-out", data);
              });

              while(unsent_messages.length){
                $sockClient.write(unsent_messages.shift());  
              }
              sockClient = $sockClient;
            });
          });
          socket.on(connect_id + "-end", function() {
            sockClient = false;
            ok_socket_proc.kill()
          });
          ok_socket_proc.on("close", function() {
            sockClient = false;
          });
        }
        else if(useOnlykeyAgent && unsent_messages.length == 1) {
          var socketPath = process.env.SSH_AUTH_SOCK;
          if(!socketPath){ 
            // console.log("unable to find local SSH_AUTH_SOCK")
            return process.exit();
          }
          // console.log("socketPath",socketPath)
          // console.log("conntecting local agent",socketPath)
          // console.log("local agent started for key", key, "at", socketPath)
          connectServer(socketPath, function($sockClient) {
            // console.log("connected to local agent")
            sockClient = $sockClient;
            sockClient.on("data", function(data) {
              // console.log(connect_id + "-out", data);
              socket.emit(connect_id + "-out", data);
            });


            sockClient.write(data);

          });
          socket.on(connect_id + "-end", function() {
            sockClient = false;
          });
        }
      });

      callback();

      // var ok_socket_proc = ok_socket(key, function(socketPath) {
      /*connectServer(socketPath, function(sockClient) {
        // ok_socket_proc.on("close", function() {
        //   console.log("onlykey-agent-close");
        //   socket.emit("remote-" + key + "-end");
        //   sockClient.destroy();
        // });
        socket.on(connect_id + "-end", function(data) {
          console.log("closing remote-" + key);
          // ok_socket_proc.kill();
          // sockClient.destroy(function() {
          //   console.log("closed remote-" + key);
          // });
        });
        

      });*/
      // });
    });
  }

  if (options.key) {

    // console.log("Building Local Proxy Socket for key", options.key);

    var sock_proc = createServer(process.env.USER + "-" + options.key, function(err, SOCK, sock) {
      // console.log("Built Local Proxy Socket", SOCK);
      if(options.ready) options.ready(SOCK);
      // cb(null, SOCK);
    }, function(stream) {
      // console.log("local ssh agent proxy client connected");
      var connect_id = Date.now();

      var unsent_messages = [];
      var connect_ready;

      stream.on("data", function(data) {
        if (!connect_ready) return unsent_messages.push(data);
        socket.emit(connect_id + "-in", data);
      });
      stream.on("end", function(data) {
        // console.log("local ssh agent proxy client disconnected");
        socket.emit(connect_id + "-end");
        // socket.disconnect()
        // sock_proc.close();
      });

      // console.log("connecting to master");

      socket.emit("request-key-connection", options.key, connect_id, function() {

        // console.log("connected to master");

        socket.on(connect_id + "-out", function(data) {
          stream.write(data);
        });
        socket.on(connect_id + "-end", function() {
          sock_proc.close();
        });

        if (unsent_messages.length > 0) {
          while (unsent_messages.length) {
            var data = unsent_messages.shift()
            socket.emit(connect_id + "-in", data);
            if (unsent_messages.length == 0) break;
          }
        }
        connect_ready = true;
        // stream.on("data", function(data) {
        //   socket.emit(connect_id + "-in", data);
        // });
        // stream.on("end", function(data) {
        //   console.log("local ssh agent proxy client disconnected");
        //   socket.emit(connect_id + "-end");
        //   // socket.disconnect()
        //   // sock_proc.close();
        // });
        // socket.emit(connect_id + "-ready");
      });


    });

  }


};



function ok_socket(cred, ready) {

  var p = spawn('onlykey-agent', ["-v", cred, '--', 'bash', __dirname + "/echo-agent-bash.sh"]);

  p.stdout.on('data', (data) => {
    // console.log(`stdout: ${data}`);
    if (data.toString().indexOf("/tmp/ssh-agent-") == 0) {
      ready(data.toString())
    }
  });

  p.stderr.on('data', (data) => {
    // console.error(`stderr: ${data}`);

  });

  var myint, isClosed;
  setTimeout(function() {
    if (isClosed) return;

    myint = setInterval(function() {
      p.stdin.write("\n");
    }, 250);

  }, 8000)
  p.on('close', (code) => {
    isClosed = true;
    // console.log(`child process exited with code ${code}`);
    clearInterval(myint)
  });


  return p;
}