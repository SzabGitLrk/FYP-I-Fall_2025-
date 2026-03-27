const mongoose = require("mongoose");

const foodDonationSchema = new mongoose.Schema({

  // 🔹 Donor reference
  donor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donor",
    required: true,
    index: true
  },

  // 🔹 Basic food details
  food_title: {
    type: String,
    required: true,
    trim: true
  },

  quantity: {
    type: String,
    required: true
  },

  description: {
    type: String,
    trim: true
  },

  // 🔹 Pickup details (Human readable)
  pickup_address: {
    type: String,
    required: true
  },

  pickup_city: {
    type: String,
    required: true,
    index: true
  },

  // 🔥 GEO Location (for nearby NGO search)
  pickup_location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  // 🔹 Current status
  status: {
    type: String,
    enum: [
      "Pending",       // waiting for NGO
      "Notified",      // NGOs notified
      "Claimed",       
      "Collected",     
      "Distributed",   
      "Rejected"
    ],
    default: "Pending"
  },

  // 🔹 NGO who claimed it
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NGO",
    default: null
  },

  claimedAt: {
    type: Date
  },

  // 🔹 Assigned volunteer
  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Volunteer",
    default: null
  },

  // 🔹 Expiry (VERY IMPORTANT for food safety)
  expiryTime: {
    type: Date
  },

  // 🔹 Notification tracking (VERY IMPORTANT)
  notifiedNGOs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO"
    }
  ],

  notificationSent: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }

});

// 🔑 REQUIRED for geo queries
foodDonationSchema.index({ pickup_location: "2dsphere" });

// Compound index for faster filtering
foodDonationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("FoodDonation", foodDonationSchema);

