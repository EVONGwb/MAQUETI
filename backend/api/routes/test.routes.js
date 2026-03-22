const express = require("express");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    message: "MAQUETI API funcionando correctamente",
  });
});

module.exports = router;
