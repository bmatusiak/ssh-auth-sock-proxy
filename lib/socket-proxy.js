module.exports = function(options, onSocket) {

  var encryption = require("./encryption");
  var nacl = encryption.nacl;
  var sha256 = encryption.sha256;
  var bytes2hex = encryption.bytes2hex;
  var hex2bytes = encryption.hex2bytes;
  var aesgcm_encrypt = encryption.aesgcm_encrypt;
  var aesgcm_decrypt = encryption.aesgcm_decrypt;
  var string2bytes = encryption.string2bytes;
  var bytes2string = encryption.bytes2string;
  
  var clientOrServer = options.agentServer ? "server" : "client";

  var io = require('socket.io-client');
  var socket = io(options.host ? options.host : "http://localhost:9876", { path: "/ssh-agent-proxy/socket.io" });

  var myID;
  var remoteID;

  if (!options.id)
    options.id = "test";

  if (clientOrServer == "server") {
    myID = options.id + "-server";
    remoteID = options.remote + "-client";
  }

  if (clientOrServer == "client") {
    myID = options.id + "-client";
    remoteID = options.remote + "-server";
  }

  function buildSocketConnection(connect_id, transit_key) {
    var disposed = false;
    return {
      on: function(e, fn) {
        if (disposed) return;
        socket.on(connect_id, async function() {
          if (disposed) return;
          var args = Array.from(arguments);
          if(transit_key){
            args = args.map(function(c){
              if(c == "disconnect") return c;
              if(typeof c == "function")
                return c;
              else{
                c = JSON.parse(bytes2string(aesgcm_decrypt(c, transit_key)));
                if(c.type == "Buffer")
                  c = Buffer.from(c);
                  
                return c;
              }
            });
            // args = JSON.parse(bytes2string(aesgcm_decrypt(arguments[0], transit_key)));
            // console.log("decrypted responce",args);
          }
          // args = aesgcm_encrypt(data, transit_key) JSON.stringify(args);
          var _e = args.shift();
          if (e == _e) {
            // console.log("recieved", Array.from(arguments));
            fn.apply(null, args);
          }
        });
      },
      emit: async function() {
        if (disposed) return;
        var args = Array.from(arguments);
        if(transit_key){
          args = args.map(function(c){
            if(typeof c == "function")
              return c;
            else{
              return aesgcm_encrypt(string2bytes(JSON.stringify(c)), transit_key);
            }
          });
          // args = [aesgcm_encrypt(string2bytes(JSON.stringify(args)), transit_key)];
          // console.log("encrypted request",args);
        }
        args.unshift(connect_id);
        // console.log("sending", args);
        socket.emit.apply(socket, args);
      },
      dispose: function() {
        disposed = true;
      }
    };
  }

  function handshakeSocketConnection(connect_id, callback) {
    var $SC = buildSocketConnection(connect_id);
    var transit_key;

    var connectionKey = nacl.box.keyPair();
    var dataCheck = Date.now();

    // this run when we first pair a connection

    // server will send a new generated pubkey key... and some data...
    // client will return a pubkey key.. and encrypted data
    if (clientOrServer == "server") {
      $SC.on("handshake-stage-2", async function(key, encrypted_data, data) {
        key = objArrayToArray(key,32);
        
        transit_key = nacl.box.before(Uint8Array.from(key), connectionKey.secretKey);
        
        var $data = aesgcm_decrypt(encrypted_data, transit_key)
        
        if (bytes2hex(sha256(dataCheck)) == bytes2hex($data)) {
          data = aesgcm_decrypt(data, transit_key);
          $SC.emit("handshake-stage-3", aesgcm_encrypt(data, transit_key));
        }

      });
      $SC.emit("handshake-stage-1", connectionKey.publicKey, sha256(dataCheck));
    }

    // with new key derive feature 
    // we expect a touch press from the ONLYKEY,
    // because we generate the keyPairs from the key itself
    // this helps confirm what key we are connecting to.. and access control
    if (clientOrServer == "client") {
      $SC.on("handshake-stage-1", async function(key, data) {
        key = objArrayToArray(key,32);
        //!onlykey should be doing this!//

        // console.log(objArrayToArray(key,32))
        transit_key = nacl.box.before(Uint8Array.from(key), connectionKey.secretKey);
        // console.log("transit_key", transit_key)
        // console.log("encrypted data", data,  aesgcm_encrypt(data, transit_key))
        
        $SC.emit("handshake-stage-2", connectionKey.publicKey, aesgcm_encrypt(data, transit_key), aesgcm_encrypt(sha256(dataCheck), transit_key));

      });
      $SC.on("handshake-stage-3", async function(encrypted_data) {
        
        // console.log(encrypted_data)
        var data = aesgcm_decrypt(encrypted_data, transit_key)
        // console.log(data)
        if (bytes2hex(sha256(dataCheck)) == bytes2hex(data)) {
          $SC.emit("handshake-stage-4");
        }

      });
    }

    $SC.on("handshake-stage-4", function() {
      callback(null, transit_key);
      $SC.emit("handshake-stage-4");
      $SC.dispose();
    });

    //callback(null, shared_secret);
  }

  function objArrayToArray(objArr, size) {
    var arr = [];
    for (var i = 0; i < size; i++) {
      if (!objArr[i]) break;
      arr.push(objArr[i])
    }
    return arr;
  }


  socket.on('connect', () => {
    // console.log("connected to relay as", clientOrServer);

    if (clientOrServer == "server")
      socket.emit("server-register", myID, function() {
        // console.log("registed to relay good as", myID);

        var reqInt = setInterval(requestConnect, 5000);
        requestConnect();

        function requestConnect() {
          // console.log("requesting connection to", remoteID);
          socket.emit("connect-client", remoteID, function(connect_id) {
            if (!connect_id) {
              // console.log("connection to", remoteID, "failed as", myID);

            }
            else {
              // console.log("connection to", remoteID, "is good as", myID);
              clearInterval(reqInt);
              socket.on(connect_id, function(e) {
                if (e == "disconnect") {
                  reqInt = setInterval(requestConnect, 5000);
                  requestConnect();
                }
              });
              handshakeSocketConnection(connect_id, function(err, shared_secret) {
                if (err) {
                  console.log("HANDSHAKE FAILED!", err);
                }
                else
                  onSocket(buildSocketConnection(connect_id, shared_secret));
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
            // onSocket(buildSocketConnection(connect_id));
            handshakeSocketConnection(connect_id, function(err, shared_secret) {
              if (err) {
                console.log("HANDSHAKE FAILED!", err);
              }
              else
                onSocket(buildSocketConnection(connect_id, shared_secret));
            });

          }
        });

      });


  });


};
