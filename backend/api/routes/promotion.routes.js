const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { listFeaturedProducts, getPromotionConfig, listMyPromotions, requestPromotion } = require("../../controllers/promotion.controller");

router.get("/promotions/featured", listFeaturedProducts);
router.get("/promotions/config", getPromotionConfig);
router.get("/promotions/me", authMiddleware, listMyPromotions);
router.post("/promotions/request", authMiddleware, requestPromotion);

module.exports = router;
