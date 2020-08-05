var socketProxy = require('./lib/socket-proxy');

var netSocket = require('./lib/server');


socketProxy({
  id: process.env.SSH_AUTH_SOCK_PROXY_ID || "client",
  remote: process.env.SSH_AUTH_SOCK_PROXY_RID || "server",
  host: process.env.SSH_AUTH_SOCK_PROXY_HOST || "https://ssh-auth-sock-proxy.herokuapp.com"
},function onSocket(socket){
  
  console.log("websocket proxy connected")
  
  netSocket({
    master: true ,
    socket:socket
  })
  
  // var myint = testProx(socket);
  
  
  // socket.on("disconnect",function(){
  //   clearInterval(myint);
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
