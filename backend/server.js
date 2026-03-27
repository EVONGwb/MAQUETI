const app = require("./app"); 
const env = require("./config/env"); 
const { connectDB } = require("./config/db");

connectDB().then(() => {
  app.listen(env.port, () => {
    console.log(`${env.appName} backend running on port ${env.port}`);
  });
});
