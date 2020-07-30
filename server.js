var socketProxy = require('./lib/socket-proxy');
var netSocket = require('./lib/server');



socketProxy({
  agentServer: true,
  id:"server",
  remote:"client"
},function onSocket(socket){
  
  console.log("websocket proxy connected");
  
  netSocket({
    socket:socket,
    key:"bmatusiak@onlykey",
    ready:function(SocketPath){
      console.log("SocketPath",SocketPath);
    }
  });
  
  // var myint = testProx(socket);
  
  // socket.on("disconnect",function(){
  //   clearInterval(myint);
  //   process.exit();
  // })
  
});
/*

function testProx(socket) {
  socket.on("testing", function(count) {
    console.log("got testing", count);
  });
  var myCount = 0;
  return setInterval(function() {
    ++myCount;
    socket.emit("testing", myCount);
  }, 1000);
}*/