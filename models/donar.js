//Donor Schema
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const donorSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },

  // Organization Type
  organizationType: {
    type: String,
    enum: ["Individual", "Restaurant", "Hotel", "Canteen", "Wedding Hall"],
    required: true,
  },

  // Food Donations (after signup)
  foodDonations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodDonation",
    },
  ],

  // Total Donations count
  total_donations: { type: Number, default: 0 }, 

  createdAt: { type: Date, default: Date.now },

  // Role for Passport / user type
  role: { type: String, default: "Donor" },
});

// Passport plugin for authentication (hashes password + adds helper methods)
donorSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("Donor", donorSchema);
