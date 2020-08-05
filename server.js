var socketProxy = require('./lib/socket-proxy');
var netSocket = require('./lib/server');



socketProxy({
  agentServer: true,
  id: process.env.SSH_AUTH_SOCK_PROXY_ID || "server",
  remote: process.env.SSH_AUTH_SOCK_PROXY_RID || "client",
  host: process.env.SSH_AUTH_SOCK_PROXY_HOST || "https://ssh-auth-sock-proxy.herokuapp.com"
}, function onSocket(socket) {

  console.log("websocket proxy connected");

  netSocket({
    socket: socket,
    key: process.env.SSH_AUTH_KEY_NAME || "onlykey",
    ready: function(SocketPath) {


      process.env.SSH_AUTH_SOCK = SocketPath;
      var SSHAgentClient = require('ssh-agent');

      var client = new SSHAgentClient({ timeout: 30000 });
      // var data = new Buffer('Hello World');

      // Try to sign data with an RSA key (will generate
      // an RSA-SHA1 signature).
      client.requestIdentities(function(err, keys) {
        var ok_ssh_pub_key = keys[0];
        // console.log(ok_ssh_pub_key)

        var sshStr = ok_ssh_pub_key.type + " " +
        ok_ssh_pub_key.ssh_key + " " +
        ok_ssh_pub_key.comment;

        console.log("------------------------\n");
        
        console.log("To change key name, respectively set $SSH_AUTH_KEY_NAME env variable and restart proxy agent\n");
        
        console.log("Your Pub SSH Key");
        console.log(sshStr + "\n");


        console.log("you can now add this before you run a program");
        console.log("SSH_AUTH_SOCK=" + SocketPath + " $PROGRAM\n");

        console.log("you can now add this in a terminal");
        console.log("export SSH_AUTH_SOCK=" + SocketPath + "\n");

        console.log("------------------------\n");

        // var key = null;
        // for (var i = 0; i < keys.length; i++) {
        //   if (keys[i].type === 'ssh-rsa') {
        //     key = keys[i];
        //     break;
        //   }
        // }
        // if (!key)
        //   return;

        // client.sign(key, data, function(err, signature) {
        //   console.log('Signature: ' + signature.signature);
        // });
      });

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