const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true,
  },
  fromWarehouse: {
    type: String,
    required: true,
  },
  toWarehouse: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Transfer = mongoose.model("Transfer", transferSchema);

module.exports = Transfer;
