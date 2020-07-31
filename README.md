# ssh-auth-sock-proxy

This is a proxy for `onlykey-agent` _or to proxy local ssh-agent thats running_

With this, You can achieve access to `onlykey-agent` running on a `raspberry pi` (_or local linux machine_) from a remote cloud server to proxy the tcp unix file socket request , Using websockets on a web-server(that can be locaed anywhere)

`index.js` is the `web-server` entry script

`server.js`  is the `onlykey-agent/raspberry pi` entry script

`client.js`  is the `cloud server` entry script

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


dont forget to the the server/client IDS to match each other..


todo..   
* add encryptioned transport

