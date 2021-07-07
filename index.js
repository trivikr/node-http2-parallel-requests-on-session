const http2 = require("http2");
const assert = require("assert");

(() => {
  const server = http2.createServer();

  server.on("stream", (stream, headers) => {
    stream.setEncoding("utf8");
    stream.on("data", (data) => {
      setTimeout(() => {
        stream.write(data);
      }, Math.random() * 1000);
    });
    stream.on("end", () => {
      // End the stream after one second.
      setTimeout(() => {
        stream.end();
      }, 1000);
    });
  });

  server.listen(8000, () => {
    const client = http2.connect("http://localhost:8000");
    client.setTimeout(2000, () => {
      console.log("session timing out");
      client.close();
      server.close();
    });

    const testRequest = (charToRepeat) => {
      const req = client.request({ ":method": "POST" });
      const totalLength = 1000;
      let remaining = totalLength;
      const chunkLength = 10;

      const chunk = Buffer.alloc(chunkLength, charToRepeat);

      const writeChunk = () => {
        if (remaining > 0) {
          remaining -= chunkLength;
          req.write(chunk, writeChunk);
        } else {
          req.end();
        }
      };
      writeChunk();

      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("close", () => {
        assert.strictEqual(data, charToRepeat.repeat(totalLength));
        console.log(`${charToRepeat}: request closed`);
      });
      req.resume();
    };

    testRequest("a");
    setTimeout(() => {
      testRequest("b");
    }, 1000);
  });
})();
