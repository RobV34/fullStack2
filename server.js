

const http = require('http');
const fs = require('fs');
const EventEmitter = require('events');
const path = require('path');

// Define the event emitter
class MyEmitter extends EventEmitter {};
const myEmitter = new MyEmitter();

// Function to get the daily log file name
function getDailyLogFileName() {
  const now = new Date();
  return `server-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.log`;
}

// Function to log to console and disk
function logEvent(message) {
  console.log(message); // Log to console
  const dailyLogFileName = getDailyLogFileName();
  const dailyLogFilePath = path.join(__dirname, 'logs', dailyLogFileName);

  // Ensure the logs directory exists
  if (!fs.existsSync(path.join(__dirname, 'logs'))) {
    fs.mkdirSync(path.join(__dirname, 'logs'));
  }

  // Append the message to the log file for today's date
  fs.appendFile(dailyLogFilePath, `${new Date().toISOString()} - ${message}\n`, (err) => {
    if (err) {
      console.error('Error writing to log file', err);
    }
  });
}

// Function to serve HTML files
function serveHtml(filePath, req, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 Not Found');
        myEmitter.emit('error', `404 Not Found: ${filePath}`);
        myEmitter.emit('log', `404 Not Found for route: ${req.url}`);
      } else {
        // Some server error
        res.writeHead(500);
        res.end('500 Internal Server Error');
        myEmitter.emit('error', `500 Server Error: ${err.message}`);
        myEmitter.emit('log', `500 Server Error: ${err.message}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content, 'utf-8');
      myEmitter.emit('success', `Page Served: ${filePath}`);
      myEmitter.emit('log', `200 OK, Page Served: ${req.url}`);
    }
  });
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Log every route access
  myEmitter.emit('log', `Route accessed: ${req.url}`);

  // Log for non-home routes
  if (req.url !== '/') {
    myEmitter.emit('log', `Non-home route accessed: ${req.url}`);
  }

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
  serveHtml(filePath, req, res);
});

// Server event listeners
myEmitter.on('log', message => logEvent(message)); // General log event for all messages
myEmitter.on('success', message => logEvent(`SUCCESS: ${message}`)); // Specific log event for successes
myEmitter.on('error', message => logEvent(`ERROR: ${message}`)); // Specific log event for errors

// Server listens on port 3000
const port = 3000;
server.listen(port, () => {
  logEvent(`Server running at http://localhost:${port}/`);
});




