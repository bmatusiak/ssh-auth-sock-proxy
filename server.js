var socketProxy = require('./lib/socket-proxy');
var netSocket = require('./lib/server');



socketProxy({
  agentServer: true,
  id: process.env.SSH_AUTH_SOCK_PROXY_ID || "server",
  remote: process.env.SSH_AUTH_SOCK_PROXY_RID || "client",
  host: process.env.SSH_AUTH_SOCK_PROXY_HOST || "http://localhost:9876"
},function onSocket(socket){
  
  console.log("websocket proxy connected");
  
  netSocket({
    socket:socket,
    key:"bmatusiak",
    ready:function(SocketPath){
      
        console.log("------------------------\n");
        
        console.log("you can now add this before you run a program");
        console.log("SSH_AUTH_SOCK="+SocketPath+" $PROGRAM\n");
        
        console.log("you can now add this in a terminal");
        console.log("export SSH_AUTH_SOCK="+SocketPath+"\n");
        
        console.log("------------------------\n");
        
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