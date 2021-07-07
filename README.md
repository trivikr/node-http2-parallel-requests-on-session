# node-http2-parallel-requests-on-session

Test parallel requests to shared HTTP/2 session on Node.js

- Run `node index.js`, it will start a HTTP/2 session and then
  run two parallel duplex stream requests to the HTTP/2 session.
  The requests will be served by single HTTP/2 session.
- Run `node index.js limit-concurrent-streams` to limit maxConcurrentStreams
  to `1` from server side. This will throw an error `NGHTTP2_REFUSED_STREAM`
  as second stream cannot be served while first stream is in progress.
