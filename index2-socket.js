// server.js
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const url = require("url");
const fs = require("fs");
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const myCache2 = new NodeCache();
var jwt = require("jsonwebtoken");
// Define username and password
const USERNAME = "admin";
const PASSWORD = "password";
const jwt_secret = `${USERNAME}-${PASSWORD}-${Math.random()}`;
const obj = { my: "Special", variable: 42 };
myCache.set("myKey", obj, 10000);
myCache2.set("myKey", 'Taha', 10000);
myCache2.set("myKey2", 2, 10000);
const nodechaches = [
  {
    name: "data1",
    v: myCache,
    keys: myCache.keys(),
  },
  {
    name: "data2",
    v: myCache2,
    keys: myCache2.keys(),
  },
];
function initResponse(ws) {
  const n = nodechaches.map((nc) => ({ name: nc.name, keys: nc.keys }));

  ws.send(JSON.stringify({ m: "init-tree", data: n }));
}

const PORT = 3000;

// Create HTTP server
const server = http.createServer((req, res) => {
  const auth = req.headers.authorization;
  if (!auth || auth.indexOf("Basic ") === -1) {
    res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Secure Area"' });
    res.end("Unauthorized");
    return;
  }

  // Decode credentials
  const [authType, credentials] = auth.split(" ");
  const [user, pass] = Buffer.from(credentials, "base64").toString().split(":");

  // Validate credentials
  if (user !== USERNAME || pass !== PASSWORD) {
    res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Secure Area"' });
    res.end("Unauthorized");
    return;
  }
  let filePath = path.join(
    __dirname,
    req.url === "/" ? "index2.html" : req.url
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
  console.log("Client connected");
  const queryParams = url.parse(req.url, true).query;
  const token = queryParams.t;
  try {
    jwt.verify(token, jwt_secret);
  } catch {
    ws.close();
    return;
  }

  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
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
    if (data.m == "update-value"){
      for (const n of nodechaches)
      {
        if (n.name == data.parent)
        {
          n.v.set(data.key, data.v, data.ttl);
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
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

let testValue = [
  {
    name: "test1",
    data: [
      {
        key: "Water",
        value: "Water1",
        ttle: 21323,
      },
      {
        key: "Coal",
        value: "Coal1",
        ttl: 2342143,
      },
      {
        key: "Dummy",
      },
    ],
  },
];
