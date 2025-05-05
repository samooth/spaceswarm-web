# spaceswarm-web
Implementation of the spaceswarm API for use in web browsers


## Using in an application

```
npm i -s spaceswarm-web
```

```js
// Based on example in spaceswarm repo
// Try running the regular spaceswarm demo with node
const spaceswarm = require('spaceswarm-web')
const crypto = require('crypto')

const swarm = spaceswarm({
  // Specify a server list of SpaceswarmServer instances
  bootstrap: ['ws://yourspaceswarmserver.com'],
  // You can also specify proxy and signal servers separated
  wsProxy: [
    'ws://proxy1.com',
    'ws://proxy2.com'
  ],
  webrtcBootstrap: [
    'ws://signal1.com',
    'ws://signal2.com'
  ],
  // The configuration passed to the SimplePeer constructor
  // See https://github.com/feross/simple-peer#peer--new-peeropts
  // for more options
  simplePeer: {
    // The configuration passed to the RTCPeerConnection constructor, for more details see
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection#RTCConfiguration_dictionary
    config: {
      // List of STUN and TURN servers to connect
      // Without the connection is limited to local peers
      iceServers: require('./ice-servers.json')
    }
  },
  // Maximum number of peers (optional)
  // Used in both webrtc (default 5) and ws proxy config (default 24)
  maxPeers: 10,
  // Websocket reconnect delay in milliseconds (optional) (default 1000)
  wsReconnectDelay: 5000
})

// look for peers listed under this topic
const topic = crypto.createHash('sha256')
  .update('my-spaceswarm-topic')
  .digest()

swarm.join(topic)

swarm.on('connection', (socket, details) => {
  console.log('new connection!', details)

  // you can now use the socket as a stream, eg:
  // socket.pipe(spacecore.replicate()).pipe(socket)
})

swarm.on('disconnection', (socket, details) => {
  console.log(details.peer.host, 'disconnected!')
  console.log('now we have', swarm.peers.length, 'peers!')
})
```

Build it with [Browserify](http://browserify.org/) to get it running on the web.

You could also compile an existing codebase relying on spaceswarm to run on the web by adding a `browser` field set to `{"spaceswarm": "spaceswarm-web"}` to have Browserify alias it when compiling dependencies.

## Setting up a proxy server

`SpaceswarmServer` provides two services:

  - [SpaceswarmProxyWS](https://github.com/RangerMauve/spaceswarm-proxy-ws): to proxy spaceswarm connections over websockets. Path: `ws://yourserver/proxy`
  - [SignalServer](https://github.com/geut/discovery-swarm-webrtc#server): for P2P WebRTC signaling connections. Path: `ws://yourserver/signal`

Running a `SpaceswarmServer` will allows you to use both services in one single process.

```
npm i -g spaceswarm-web

# Run it! Default port is 4977 (HYPR on a phone pad)
spaceswarm-web

# Run it with a custom port
spaceswarm-web --port 42069
```

### Running as a Linux service with SystemD

```bash
sudo cat << EOF > /etc/systemd/system/spaceswarm-web.service
[Unit]
Description=Spaceswarm proxy server which webpages can connect to.

[Service]
Type=simple
# Check that spaceswarm-web is present at this location
# If it's not, replace the path with its location
# You can get the location with 'whereis spaceswarm-web'
# Optionally add a --port parameter if you don't want 4977
ExecStart=/usr/local/bin/spaceswarm-web
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo chmod 644 /etc/systemd/system/spaceswarm-web.service

sudo systemctl daemon-reload
sudo systemctl enable spaceswarm-web
sudo systemctl start spaceswarm-web

sudo systemctl status spaceswarm-web
```
