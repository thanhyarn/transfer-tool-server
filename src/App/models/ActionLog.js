const mongoose = require("mongoose");

const actionLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ActionLog = mongoose.model("ActionLog", actionLogSchema);

module.exports = ActionLog;