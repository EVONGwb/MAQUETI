const app = require("./app"); 
const env = require("./config/env"); 
require("./config/db"); // IMPORTANTE: inicializa la base de datos 

app.listen(env.port, () => { 
  console.log(`${env.appName} backend running on port ${env.port}`); 
}); 
