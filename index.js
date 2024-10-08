const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const url = require("url");
const fs = require("fs");
var jwt = require("jsonwebtoken");
const nodechaches = [];
// name: "data2",
//     v: myCache2,
function addNodeCacheInstance(n)
{
  n.keys = n.v.keys();
  nodechaches.push(n);
}

function initializeNodeCacheCommander(PORT, USERNAME, PASSWORD) {
  const jwt_secret = `${USERNAME}-${PASSWORD}-${Math.random()}`;
  const server = http.createServer((req, res) => {
    const auth = req.headers.authorization;
    if (!auth || auth.indexOf("Basic ") === -1) {
      res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Secure Area"' });
      res.end("Unauthorized");
      return;
    }

    // Decode credentials
    const [authType, credentials] = auth.split(" ");
    const [user, pass] = Buffer.from(credentials, "base64")
      .toString()
      .split(":");

    // Validate credentials
    if (user !== USERNAME || pass !== PASSWORD) {
      res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Secure Area"' });
      res.end("Unauthorized");
      return;
    }
    let filePath = path.join(
      __dirname,
      req.url === "/" ? "index.html" : req.url
    );

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }

      let extname = path.extname(filePath);
      let contentType = "text/html";

      switch (extname) {
        case ".js":
          contentType = "application/javascript";
          break;
        case ".css":
          contentType = "text/css";
          break;
        // Add more cases as needed
      }
      let modifiedContent = content;
      if (extname.includes("html")) {
        var token = jwt.sign(
          {
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
            data: "foobar",
          },
          jwt_secret
        );
        modifiedContent = content
          .toString()
          .replace(
            "</body>",
            `<p style='display:none' id="jwt-id-p">${token}</p></body>`
          );
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(modifiedContent);
    });
  });

  // Create WebSocket server
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    function initResponse() {
      const n = nodechaches.map((nc) => ({ name: nc.name, keys: nc.v.keys() }));

      ws.send(JSON.stringify({ m: "init-tree", data: n }));
    }
    const queryParams = url.parse(req.url, true).query;
    const token = queryParams.t;
    try {
      jwt.verify(token, jwt_secret);
    } catch {
      ws.close();
      return;
    }

    ws.on("message", function incoming(message) {
      const data = JSON.parse(message);
      if (data.m == "get-value") {
        for (const n of nodechaches) {
          if (data.parent === n.name) {
            const value = n.v.get(data.key);
            const ttl = n.v.getTtl(data.key);
            ws.send(
              JSON.stringify({
                m: "get-value",
                parent: n.name,
                key: data.key,
                v: value,
                ttl,
              })
            );
          }
        }
      }
      if (data.m == "update-value") {
        for (const n of nodechaches) {
          if (n.name == data.parent) {
            n.v.set(data.key, data.v, data.ttl);
            break;
          }
        }
      }
      if (data.m == "get-node-values") {
        for (const n of nodechaches) {
          if (n.name == data.name) {
            try {
              const dt = n.v.getStats();
              ws.send(
                JSON.stringify({
                  m: data.m,
                  key: n.name,
                  v: dt,
                })
              );
              break;
            } catch (e) {}
          }
        }
      }
      if (data.m == "flush-instance") {
        for (const n of nodechaches) {
          if (n.name == data.name) {
            n.v.flushAll();
            initResponse();
            break;
          }
        }
      }

      if (data.m == "delete-value") {
        for (const n of nodechaches) {
          if (n.name == data.parent) {
            n.v.del(data.key);
            initResponse();
            break;
          }
        }
      }
    });
    // Send initial message
    ws.send(JSON.stringify({ message: "Welcome!" }));
    initResponse(ws);
    // Send updates every 5 seconds (for demo purposes)
    const intervalId = setInterval(() => {
      const data = JSON.stringify({
        message: "Data updated at " + new Date().toLocaleTimeString(),
      });
      ws.send(data);
    }, 5000);

    // Clean up when the connection is closed
    ws.on("close", () => {
      clearInterval(intervalId);
    });
  });

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}

module.exports = {
  initializeNodeCacheCommander,
  addNodeCacheInstance
};
