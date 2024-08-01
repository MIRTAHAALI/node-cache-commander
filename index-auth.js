// server.js
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 3000;

// Define username and password
const USERNAME = 'admin';
const PASSWORD = 'password';

// Create HTTP server
const server = http.createServer((req, res) => {
    // Check for authentication
    const auth = req.headers.authorization;
    if (!auth || auth.indexOf('Basic ') === -1) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"' });
        res.end('Unauthorized');
        return;
    }

    // Decode credentials
    const [authType, credentials] = auth.split(' ');
    const [user, pass] = Buffer.from(credentials, 'base64').toString().split(':');

    // Validate credentials
    if (user !== USERNAME || pass !== PASSWORD) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"' });
        res.end('Unauthorized');
        return;
    }

    // Serve the HTML file
    if (req.url === '/') {
        const filePath = path.join(__dirname, 'index-auth.html');
        fs.readFile(filePath, 'utf8', (err, html) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                console.error(err);
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
