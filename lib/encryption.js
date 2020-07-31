 var forge = require("../vendor/forge.min");
 exports.forge = forge;

 var nacl = require("../vendor/nacl.min");
 exports.nacl = nacl;

 exports.hexToDec = function(hexStr) {
     return ~~(new Number('0x' + hexStr).toString(10));
 };

 exports.decToHex = function decToHexStr(dec) {
     return dec.toString(16);
 };


 exports.bytes2string = function bytes2string(bytes) {
     var ret = Array.from(bytes).map(function chr(c) {
         return String.fromCharCode(c);
     }).join('');
     return ret;
 };

 exports.string2bytes = function string2bytes(s) {
     var len = s.length;
     var bytes = new Uint8Array(len);
     for (var i = 0; i < len; i++) bytes[i] = s.charCodeAt(i);
     return bytes;
 };


 exports.bytes2hex = function bytes2string(bytes) {
     var ret = Array.from(bytes).map(function(c) {
         return exports.decToHex(c);
     }).join('');
     return ret;
 };

 exports.hex2bytes = function bytes2string(hexString) {
     var strArr = [];
     for (var i = 0; i < hexString.length; i += 2) {
         strArr.push(hexString[i] + hexString[i + 1]);
     }
     var ret = Array.from(strArr).map(function(c) {
         return exports.hexToDec(c);
     });
     return ret; //plaintext.match(/.{2}/g).map(exports.hexToDec)
 };


 exports.sha256 = function(s) {
     var md = forge.md.sha256.create();
     md.update(exports.bytes2string(s));
     return Array.from(md.digest().toHex().match(/.{2}/g).map(exports.hexToDec));
 };

 exports.IntToByteArray = function(int) {
     var byteArray = [0, 0, 0, 0];
     for (var index = 0; index < 4; index++) {
         var byte = int & 0xff;
         byteArray[(3 - index)] = byte;
         int = (int - byte) / 256;
     }
     return byteArray;
 };


 var counter = 0;

 exports.aesgcm_decrypt = function aesgcm_decrypt(encrypted, shared_sec) {
     //  return new Promise(resolve => {
     forge.options.usePureJavaScript = true;
     var key = exports.sha256(shared_sec); //AES256 key sha256 hash of shared secret
     //console.log("Key", key);
     var iv = exports.IntToByteArray(counter);
     while (iv.length < 12) iv.push(0);
     iv = Uint8Array.from(iv);
     //console.log("IV", iv);
     var decipher = forge.cipher.createDecipher('AES-GCM', key);
     decipher.start({
         iv: iv,
         tagLength: 0, // optional, defaults to 128 bits
     });
     //console.log("Encrypted", encrypted);
     var buffer = forge.util.createBuffer(Uint8Array.from(encrypted));
     //console.log("Encrypted length", buffer.length());
     //console.log(buffer);
     decipher.update(buffer);
     decipher.finish();
     var plaintext = decipher.output.toHex();
     //console.log("Plaintext", plaintext);
     //console.log("Decrypted AES-GCM Hex", forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexToDec));
     //encrypted = forge.util.bytesToHex(decrypted).match(/.{2}/g).map(hexToDec);
     return plaintext.match(/.{2}/g).map(exports.hexToDec);
     //  });
 };

 exports.aesgcm_encrypt = function aesgcm_encrypt(plaintext, shared_sec) {
     //  return new Promise(resolve => {
     forge.options.usePureJavaScript = true;
     var key = exports.sha256(shared_sec); //AES256 key sha256 hash of shared secret
     //console.log("Key", key);
     var iv = exports.IntToByteArray(counter);
     while (iv.length < 12) iv.push(0);
     iv = Uint8Array.from(iv);
     //console.log("IV", iv);
     //Counter used as IV, unique for each message
     var cipher = forge.cipher.createCipher('AES-GCM', key);
     cipher.start({
         iv: iv, // should be a 12-byte binary-encoded string or byte buffer
         tagLength: 0
     });
     //console.log("Plaintext", plaintext);
     cipher.update(forge.util.createBuffer(Uint8Array.from(plaintext)));
     cipher.finish();
     var ciphertext = cipher.output;
     ciphertext = ciphertext.toHex();
     return ciphertext.match(/.{2}/g).map(exports.hexToDec);
     //  });
 };