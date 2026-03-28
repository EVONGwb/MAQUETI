const app = require("./app"); 
const env = require("./config/env"); 
const { connectDB } = require("./config/db");
const http = require("http");
const { initSocket } = require("./socket");

connectDB().then(() => {
  const server = http.createServer(app);
  initSocket(server);
  server.listen(env.port, () => {
    console.log(`${env.appName} backend running on port ${env.port}`);
  });
});
