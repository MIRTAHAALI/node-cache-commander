var http = require('http');
const fs = require('fs');
const path = require('path');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();
const myCache2 = new NodeCache();

const obj = { my: "Special", variable: 42 };
 
 myCache.set( "myKey", obj, 10000 );
 myCache2.set( "myKey", obj, 10000 );

 PORT = 3000
 const data = {
    message: 'Hello, this is dynamic data!'
};

// Create the server
const server = http.createServer((req, res) => {
    // Define the path to the index.html file
    const filePath = path.join(__dirname, 'index.html');

    // Read the index.html file
    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
            // If an error occurs, send a 500 Internal Server Error response
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
            console.error(err);
            return;
        }

        // Embed the data into the HTML
        const htmlWithData = html.replace(
            /<p id="data-placeholder"><\/p>/,
            `<p id="data-placeholder" data='${JSON.stringify(data)}'></p>`
        );

        // Send the modified HTML with a 200 OK response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlWithData);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});