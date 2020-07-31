module.exports = function(options, onSocket) {
  
  var clientOrServer = options.agentServer ? "server" : "client";
  
  var io = require('socket.io-client');
  var socket = io(options.host ? options.host : "http://localhost:9876", {path:"/ssh-agent-proxy/socket.io"});

  var myID;
  var remoteID;
  
  if(!options.id)
    options.id = "test";

  if (clientOrServer == "server") {
    myID = options.id + "-server";
    remoteID = options.remote+ "-client";
  }

  if (clientOrServer == "client") {
    myID = options.id + "-client";
    remoteID = options.remote + "-server";
  }

  socket.on('connect', () => {
    console.log("connected to relay as", clientOrServer)

    if (clientOrServer == "server")
      socket.emit("server-register", myID, function() {
        console.log("registed to relay good as", myID)
        
        var reqInt = setInterval(requestConnect, 5000);
        requestConnect();
        
        function requestConnect(){
          console.log("requesting connection to", remoteID)
          socket.emit("connect-client", remoteID, function(connect_id) {
            if(!connect_id){
              console.log("connection to", remoteID, "failed as", myID)
              
            }else{
              console.log("connection to", remoteID, "is good as", myID)
              clearInterval(reqInt);
              socket.on(connect_id,function(e){
                if(e == "disconnect") {
                  reqInt = setInterval(requestConnect, 5000);
                  requestConnect();
                }
              });
              onSocket({
                on: function(e, fn) {
                  socket.on(connect_id, function() {
                    var args = Array.from(arguments);
                    var _e = args.shift();
                    if (e == _e) {
                      console.log("recieved", Array.from(arguments))
                      fn.apply(null, args)
                    }
                  })
                },
                emit: function() {
                  var args = Array.from(arguments);
                  args.unshift(connect_id);
                  console.log("sending", args)
                  socket.emit.apply(socket, args);
                }
              });
            }
          });
        }
        

      });


    if (clientOrServer == "client")
      socket.emit("client-register", myID, function() {
        console.log("registed to relay good as", myID)
        socket.on("request-connection", function($remoteID, connect_id, cb) {
          console.log("connectiong request from", $remoteID);

          if ($remoteID == remoteID) {

            cb();
            onSocket({
              on: function(e, fn) {
                socket.on(connect_id, function() {
                  var args = Array.from(arguments);

                  var _e = args.shift();
                  if (e == _e) {
                    console.log("recieved", Array.from(arguments))
                    fn.apply(null, args)
                  }
                })
              },
              emit: function() {
                var args = Array.from(arguments);
                args.unshift(connect_id);
                console.log("sending", args)
                socket.emit.apply(socket, args);
              }
            });
          }
        });

      });


  });


};
