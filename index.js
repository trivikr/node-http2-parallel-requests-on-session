const http2 = require("http2");
const assert = require("assert");

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv))
  .usage("Usage:\n" + "  test\n" + "    [--max-concurrent-streams <number>]\n")
  .options({
    "max-concurrent-streams": {
      type: "number",
      description:
        "Specifies the maximum number of concurrent streams permitted on an Http2Session." +
        " Minimum: 0. Maximum: 2^32-1.",
      default: 4294967295,
    },
  })
  .help().argv;

const { maxConcurrentStreams } = argv;
const h2Server = http2.createServer({ settings: { maxConcurrentStreams } });

h2Server.on("stream", (stream, headers) => {
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

h2Server.listen(8000, () => {
  const clientH2Session = http2.connect("http://localhost:8000");

  const testRequest = (charToRepeat) => {
    const req = clientH2Session.request({ ":method": "POST" });
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
    });
    req.resume();
  };

  testRequest("a");
  testRequest("b");

  // Close client and server after two seconds.
  setTimeout(() => {
    clientH2Session.close();
    h2Server.close();
  }, 2000);
});
