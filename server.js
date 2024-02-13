// Purpose: A simple web server that serves HTML files with embedded weather data on the home page.


const http = require("http");
const fs = require("fs");
const EventEmitter = require("events");
const path = require("path");
const weather = require("weather-js");

// Define the event emitter
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

// Function to get the daily log file name
function getDailyLogFileName() {
  const now = new Date();
  return `server-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}.log`;
}

// Function to log to console and disk
function logEvent(message) {
  console.log(message); // Log to console
  const dailyLogFileName = getDailyLogFileName();
  const dailyLogFilePath = path.join(__dirname, "logs", dailyLogFileName);

  // Ensure the logs directory exists
  if (!fs.existsSync(path.join(__dirname, "logs"))) {
    fs.mkdirSync(path.join(__dirname, "logs"));
  }

  // Append the message to the log file for today's date
  fs.appendFile(dailyLogFilePath, `${new Date().toISOString()} - ${message}\n`, (err) => {
    if (err) {
      console.error("Error writing to log file", err);
    }
  });
}

// Function to serve HTML files with embedded weather data for the home page
function serveHtml(filePath, req, res) {
  if (req.url === "/") {
    // Fetch the weather data for a specific location
    weather.find({ search: 'Gander, NL', degreeType: 'C' }, function(err, result) {
      if (err) {
        console.error(err);
        res.writeHead(500);
        res.end("Internal Server Error");
        return;
      }

      // Prepare the weather information to be displayed
      const weatherInfo = result[0].current; 
      const locationInfo = result[0].location;
      // Adapt this line if the structure of result is different
      const weatherHtml = `<h2>${locationInfo.name}</h2>
                           <h3>${weatherInfo.skytext}</h3>
                           <p>Temperature: ${weatherInfo.temperature}</p>
                           <p>Humidity: ${weatherInfo.humidity}%</p>
                           <p>Wind: ${weatherInfo.winddisplay}</p>`;
      
      // Embed the weather information into the HTML before serving
      fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end("Error loading home page.");
          return;
        }

        const updatedContent = content.replace('{{weather}}', weatherHtml);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(updatedContent);
      });
    });
  } else {
    // Serve other files normally without weather data
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === "ENOENT") {
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end("404 Not Found");
        } else {
          res.writeHead(500);
          res.end("500 Internal Server Error");
        }
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content, "utf-8");
      }
    });
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  myEmitter.emit("log", `Route accessed: ${req.url}`);

  const baseDir = path.join(__dirname, "views");
  const routePaths = {
    "/": "index.html",
    "/about": "about.html",
    "/contact": "contact.html",
    "/products": "products.html",
    "/subscribe": "subscribe.html",
  };

  const filePath = routePaths[req.url]
    ? path.join(baseDir, routePaths[req.url])
    : path.join(baseDir, "404.html");

  serveHtml(filePath, req, res);
});

// Server event listeners
myEmitter.on("log", (message) => logEvent(message));
myEmitter.on("success", (message) => logEvent(`SUCCESS: ${message}`));
myEmitter.on("error", (message) => logEvent(`ERROR: ${message}`));

const port = 3000;
server.listen(port, () => {
  logEvent(`Server running at http://localhost:${port}/`);
});
