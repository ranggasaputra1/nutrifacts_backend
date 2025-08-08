var express = require("express");
var router = express.Router();
const { authenticateToken } = require("../middleware/verify-token");

/* GET home page. */
router.get("/", authenticateToken, function (req, res, next) {
  res.render("index", { title: "NutriFacts" });
});

module.exports = router;
