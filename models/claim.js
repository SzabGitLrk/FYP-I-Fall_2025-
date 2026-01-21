//Claim Schema
const mongoose = require("mongoose");
const claimSchema = new mongoose.Schema({
  foodDonation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodDonation",
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NGO",
    required: true
  },
  claimedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Claimed", "Collected", "Distributed", "Cancelled"],
    default: "Claimed"
  }
});

module.exports = mongoose.model("Claim", claimSchema);
