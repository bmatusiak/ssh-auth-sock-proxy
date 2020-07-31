# ssh-auth-sock-proxy

This is a proxy for `onlykey-agent` _or to proxy local ssh-agent thats running_

With this, You can achieve access to `onlykey-agent` running on a `raspberry pi` (_or local linux machine_) from a remote cloud server to proxy the tcp unix file socket request , Using websockets on a remote web-server(that can be located anywhere as long both `server/client.js` can connect to it)

How? I simply setup this proxy by creating a $SSH_AUTH_SOCK path with tcp unix file sockets.

`index.js` is the `web-server` entry script

`client.js`  is the `onlykey-agent/raspberry pi` entry script

`server.js`  is the `cloud9 server` entry script

Works on AWS cloud9, Here is how.

1. I have a exposed IPs http/https running nginx proxy_pass
2. In cloud9 i run my apps on `8080`
3. ssh-agent-proxy web-server, i run that on port `9876`, on location `/ssh-agent-proxy`

```
location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_pass http://localhost:8080;
}

location /ssh-agent-proxy {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_pass http://localhost:9876;
}
```

in cloud9,  you need to see what the `client.js` entry script spits out,

then you can run bash with the env variable `SSH_AUTH_SOCK`

```
SSH_AUTH_SOCK=/tmp/my-ssh-agent.path-to-agent.sock bash
```


dont forget to set the server/client IDS to match each other..

notes..
* onlykey-agent only runs when needed, and closes on tcp hangup (like it normmaly would)
* remote `"proxy-agent"` currently keeps the tcp SSH_AUTH_SOCK open
* encryptioned transport, uses nacl for shared secrets and AESGCM for encrypted data

todo..   
* provide simple bash scripts to help setup everything 



```
$(./bin/onlykey-agent-proxy)
echo $SSH_AGENT_PID $SSH_AUTH_SOCK
```