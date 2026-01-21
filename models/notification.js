//Notifications Schema
const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
  user_type: {
    type: String,
    enum: ["NGO", "Donor", "Volunteer", "Admin"],
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "user_type" // dynamically refers to the correct collection
  },
  donation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodDonation",
    default: null // some notifications may not be donation-related
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
