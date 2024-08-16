# Node-Cache Commander

## A simple manager for node-cache

Node-Cache Commander, a front-end to visualize storage managed by node-cache. It can be used to delete and update values of node-cache on a server.

Connect with author : [https://www.linkedin.com/in/mir-taha-a40bb270/]

## 🎯 Features

- Simple UI
- Live Update/Delete Values
- User/Password Authentication on front end
- Type Secure
- Auth based socket connection for read/write purpose
- Flush All Data
- Get Instance Status

## Installation

```npm
npm install node-cache-commander
```

## 🚀 Usage

Import:

```javascript
const {
  initializeNodeCacheCommander, //Initialize node-cache-commander web server
  addNodeCacheInstance, // Adds instance of node-cache to monitor
} = require("node-cache-commander");
```

### Example

```javascript
const {
  initializeNodeCacheCommander,
  addNodeCacheInstance,
} = require("node-cache-commander"); //Import
const NodeCache = require("node-cache"); //Import Node-cache
initializeNodeCacheCommander(3000, "USERNAME", "PASSWORD"); //
const myCache = new NodeCache(); //Initialize node-cache instance
const myCache2 = new NodeCache(); //Initialize node-cache instance if needed (just for example here)
let obj = { my: "Special", variable: 42 }; //
myCache.set("myKey", obj, 10000); // Set values
let obj2 = { my: "Special2", variable: 42 }; //
myCache2.set("myKey1", obj, 10000); // Set Values

addNodeCacheInstance({ name: "Node-instance-1", v: myCache }); //Add instance to node-cache-commander to monitor
addNodeCacheInstance({ name: "Node-instance-2", v: myCache2 }); //Add instance to node-cache-commander to monitor
```

Open web browser and run http://localhost:3000


![Example](https://github.com/MIRTAHAALI/node-cache-commander/blob/main/image/example.gif)
