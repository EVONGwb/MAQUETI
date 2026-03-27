const app = require("./app"); 
const env = require("./config/env"); 
const { connectDb } = require("./config/db");

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`${env.appName} backend running on port ${env.port}`);
    });
  })
  .catch(() => {
    console.error("No se pudo conectar a MongoDB");
    process.exit(1);
  });
