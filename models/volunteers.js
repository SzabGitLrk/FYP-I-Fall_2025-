//Volunteer Schema
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const volunteerSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },

  // Invite system
  invite_code_used: {
    type: String,
    required: true,
  },
  invite_code_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InviteCode",
    required: true,
  },

  ngo_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NGO",
    required: true,
  },

  // Work tracking
  assigned_tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
  ],

  status: {
    type: String,
    enum: ["Active", "Suspended", "Removed"],
    default: "Active",
  },

  createdAt: { type: Date, default: Date.now },

  // ✅ Add role field for Passport / user type
  role: { type: String, default: "Volunteer" },
});

// ✅ Add Passport plugin (handles password hash, salt, and auth methods automatically)
volunteerSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("Volunteer", volunteerSchema);
