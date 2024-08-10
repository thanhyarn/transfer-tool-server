var express = require("express");
const router = express.Router();
// const verifyToken = require("../App/middleware/verifyToken");

const History = require("../App/controllers/historyController");

router.get("/get-all", History.getAll);

module.exports = router;
