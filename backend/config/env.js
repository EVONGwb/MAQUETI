const env = { 
  port: process.env.PORT || 3000, 
  appName: process.env.APP_NAME || "MAQUETI", 
  mode: process.env.NODE_ENV || "development", 
}; 

module.exports = env; 
