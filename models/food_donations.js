//Food Donation Schema
const mongoose = require("mongoose");
const foodDonationSchema = new mongoose.Schema({
  // Donor reference
  donor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donor",
    required: true
  },

  // Basic food details
  food_title: {
    type: String,
    required: true,
    trim: true
  },

  quantity: {
    type: String,
    required: true
  },

  // Pickup details
  pickup_address: {
    type: String,
    required: true
  },

  pickup_city: {
    type: String,
    required: true
  },

  // Status and tracking
  status: {
    type: String,
    enum: ["Pending", "Claimed", "Collected", "Distributed", "Rejected"],
    default: "Pending"
  },

  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ngo",
    default: null
  },

  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Volunteer",
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export Model
module.exports = mongoose.model("FoodDonation", foodDonationSchema);
