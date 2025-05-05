const spaceswarm = require('spaceswarm')
const SpaceswarmServer = require('./server')
const spaceswarmweb = require('./')
const test = require('tape')
const getPort = require('get-port')
const crypto = require('crypto')
const wrtc = require('wrtc')

let server = null
let port = null
test('Setup', async function (t) {
  // Initialize local proxy
  server = new SpaceswarmServer()
  port = await getPort()
  server.listen(port)
  t.end()
});

test('Connect to local spaceswarm through local proxy', async (t) => {
  t.plan(6)
  try {
    // Initialize local spaceswarm instance, listen for peers
    const swarm = spaceswarm()

    // Initialize client
    const hostname = `ws://localhost:${port}`
    const client = spaceswarmweb({
      bootstrap: [hostname]
    })

    // Test connections in regular spaceswarm
    swarm.once('connection', (connection, info) => {
      t.pass('Got connection locally')
      connection.once('end', () => {
        t.pass('Local connection ended')
        swarm.destroy()
      })
      connection.once('data', () => {
        t.pass('Local connection got data')
      })
      connection.write('Hello World')
    })

    // Test connections in proxied spaceswarm
    client.once('connection', (connection) => {
      connection.on('error', () => {
        // Whatever
      })

      t.pass('Got proxied connection')
      connection.once('data', () => {
        t.pass('Proxied connection got data')
        connection.end(() => {
          t.pass('Proxied connection closed')
          client.destroy()
        })
      })

      connection.write('Hello World')

      client.on('connection', (connection2) => {
        // Ignore other connections
        connection2.on('error', () => {
          // Whatever
        })
      })
    })

    const key = crypto.randomBytes(32)

    // Join channel on local spaceswarm
    swarm.join(key, {
      announce: true,
      lookup: true
    })

    // Join channel on client
    client.join(key)
  } catch (e) {
    console.error(e)
    t.fail(e)
  }
})

test('Connect to webrtc peers', async (t) => {
  t.plan(8)
  try {
    // Initialize client
    const hostname = `ws://localhost:${port}`
    const client1 = spaceswarmweb({
      bootstrap: [hostname],
      simplePeer: {
        wrtc
      }
    })
    const client2 = spaceswarmweb({
      bootstrap: [hostname],
      simplePeer: {
        wrtc
      }
    })

    client1.once('connection', (connection, info) => {
      t.pass('Got connection from client2')
      connection.once('end', () => {
        t.pass('Connection client1 -> client2 ended')
        client1.destroy()
      })
      connection.once('data', () => {
        t.pass('The client1 got data')
      })
      connection.write('Hello World')
    })

    client2.once('connection', (connection) => {
      connection.on('error', () => {
        // Whatever
      })

      t.pass('Got connection from client1')
      connection.once('data', () => {
        t.pass('The client2 got data')
        connection.end(() => {
          t.pass('Connection client2 -> client1 ended')
          client2.destroy()
          server.destroy()
        })
      })

      connection.write('Hello World')
    })

    const key = crypto.randomBytes(32)

    // Join channel on client
    client1.join(key);
    client2.join(key);

    client1.webrtc.signal.once('connected', () => {
      t.pass('client1 should establish a websocket connection with the signal')
    })
    client2.webrtc.signal.once('connected', () => {
      t.pass('client2 should establish a websocket connection with the signal')
    })
  } catch (e) {
    console.error(e)
    t.fail(e)
  }
})

test('Teardown', function (t) {
  server.destroy()
  t.end()
});
