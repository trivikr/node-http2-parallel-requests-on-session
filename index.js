const http2 = require("http2");
const assert = require("assert");

(() => {
  const server = http2.createServer();
  server.on("stream", (stream, headers) => {
    stream.respond({
      "content-type": "text/html",
      ":status": 200,
    });
    stream.end("<h1>Hello World</h1>");
  });
  server.listen(8000);

  const client = http2.connect("http://localhost:8000");
  const req = client.request();
  req.on("response", (headers) => {
    assert.strictEqual(headers[":status"], 200);
    assert.strictEqual(headers["content-type"], "text/html");
  });
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    assert.strictEqual(chunk, "<h1>Hello World</h1>");
  });
  req.on("end", () => {
    client.destroy();
    server.close();
  });
  req.end();
})();
