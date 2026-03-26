// Notifications Schema
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user_type: {
      type: String,
      enum: ["NGO", "Admin"],
      required: true
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "user_type"
    },

    donation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodDonation"
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    isRead: {
      type: Boolean,
      default: false
    },

    emailSent: {
      type: Boolean,
      default: false
    },

    smsSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // ✅ Automatically adds createdAt & updatedAt
  }
);

// ✅ Optional but recommended for performance
notificationSchema.index({ user_id: 1, user_type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);