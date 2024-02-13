const http = require('http');
const fs = require('fs');
const EventEmitter = require('events');
const path = require('path');

// Define the event emitter
class MyEmitter extends EventEmitter {};
const myEmitter = new MyEmitter();

// Function to log to console and disk
function logEvent(message) {
  console.log(message);
  const logStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });
  logStream.write(`${new Date().toISOString()} - ${message}\n`, () => {
    logStream.close(); // Close the stream to avoid memory leaks
  });
}

// Function to serve HTML files
function serveHtml(filePath, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found, serve 404 page
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
        myEmitter.emit('error', `404 Not Found: ${filePath}`);
      } else {
        // Some server error
        res.writeHead(500);
        res.end('500 Internal Server Error');
        myEmitter.emit('error', `500 Server Error: ${err.message}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content, 'utf-8');
      myEmitter.emit('success', `Page Served: ${filePath}`);
    }
  });
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Define the base directory for HTML views
  const baseDir = path.join(__dirname, 'views');
  
  // Use a map or an object to define routes to file paths
  const routePaths = {
    '/': 'index.html',
    '/about': 'about.html',
    '/contact': 'contact.html',
    '/products': 'products.html',
    '/subscribe': 'subscribe.html'
  };

  // Check if the route is defined, or serve a 404 page
  const filePath = routePaths[req.url] ? path.join(baseDir, routePaths[req.url]) : path.join(baseDir, '404.html');

  // Serve the HTML file
  serveHtml(filePath, res);
});

// Server event listeners
myEmitter.on('success', message => logEvent(message));
myEmitter.on('error', message => logEvent(message));

// Server listens on port 3000
const port = 3000;
server.listen(port, () => {
  logEvent(`Server running at http://localhost:${port}/`);
});



