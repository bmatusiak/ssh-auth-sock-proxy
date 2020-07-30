var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 9876;



var clients = {};

io.on('connection', function(socket) {

  socket.on('client-register', function(myID, ready) {
    clients[myID] = socket;

    socket.on("disconnect", function() {
      console.log(myID, "disconnected");
      delete clients[myID];
    });
    
    console.log(myID, "connected");

    ready();
  });

  socket.on('server-register', function(myID, ready) {

    socket.on("disconnect", function() {
      console.log(myID, "disconnected");
    });
    
    console.log(myID, "connected");
    
    socket.on('connect-client', function(remoteId, cb) {
      var c = clients[remoteId];
      if (c) {
        var connect_id = Date.now();

        c.emit("request-connection", myID, connect_id, function() {

          c.on(connect_id, function(data) {
            var args = Array.from(arguments);
            args.unshift(connect_id);
            console.log(args);
            socket.emit.apply(socket, args);
          });
          socket.on(connect_id, function(data) {
            var args = Array.from(arguments);
            args.unshift(connect_id);
            console.log(args);
            c.emit.apply(c, args);
          });
          c.on("disconnect", function() {
            socket.emit(connect_id, "disconnect");
          });
          socket.on("disconnect", function() {
            c.emit(connect_id, "disconnect");
          });
          
          cb(connect_id);
        });
      }else{
        cb();
      }
    });

    ready();

  });
  /*
    console.log("remote client connected");

    socket.on('remote-ready', function() {

      remote = socket;
      remote.on("disconnect", function() {
        if (remote.clientSocket) {
          console.log("remoted closed1")
          remote.clientSocket.disconnect()
        }
        if (remote.currentStream) {
          remote.currentStream.close()
        }
        remote = false;
      })
      console.log("remote-ready");

      // socket.emit("remote-setup", function(rs) {
      //   console.log("remote-setup", rs)
      //   if (rs) {
      //     remotes[keyName] = socket;
      //   }
      // })
    });


    socket.on('local-ready', function(next) {


      socket.on('local-request', function(keyName, cb) {
        if (remote) {
          remote.emit("remote-request", keyName, function(socketReady, onEnd) {
            if (socketReady) {
              remote.clientSocket = socket;
              console.log("Building Local Proxy Socket")
              var sock_proc = SOCK_server(process.env.USER + "-" + keyName, function(err, SOCK, sock) {
                console.log("Built Local Proxy Socket", SOCK)
                cb(null, SOCK);
              }, function(stream) {
                remote.currentStream = sock_proc;
                console.log("local ssh agent proxy client connected");
                remote.on("remote-" + keyName + "-out", function(data) {
                  stream.write(data);
                });
                remote.on("remote-" + keyName + "-end", function() {
                  sock_proc.close();
                });
                stream.on("data", function(data) {
                  remote.emit("remote-" + keyName + "-in", data);
                });
                stream.on("end", function(data) {
                  console.log("local ssh agent proxy client disconnected");
                  remote.emit("remote-" + keyName + "-end");
                  socket.disconnect()
                  sock_proc.close();
                });
              });

            }
          })
        }
        else {
          socket.disconnect();
          console.log("client asked for remote, but remote not connected yet");
        }

      });

      next()
    });*/
});

http.listen(port, function() {
  console.log('listening on *:' + port);


});
