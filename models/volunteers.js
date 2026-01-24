// Volunteer Schema
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    // =====================
    // Basic Information
    // =====================
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },

    phone: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    // =====================
    // Invite System (NGO-based)
    // =====================
    invite_code_used: {
      type: String,
      required: true
    },

    invite_code_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InviteCode",
      required: true
    },

    // NGO that added this volunteer
    ngo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      required: true,
      index: true
    },

    // =====================
    // Work / Activity Tracking
    // =====================
    assigned_tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
      }
    ],

    // =====================
    // Admin Controls
    // =====================
    status: {
      type: String,
      enum: ["Active", "Suspended", "Removed"],
      default: "Active"
    },

    removedAt: {
      type: Date,
      default: null
    },

    // =====================
    // Auth / Meta
    // =====================
    role: {
      type: String,
      default: "Volunteer"
    },

    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true // adds createdAt & updatedAt automatically
  }
);

// =====================
// Passport Authentication
// =====================
volunteerSchema.plugin(passportLocalMongoose, {
  usernameField: "email"
});

module.exports = mongoose.model("Volunteer", volunteerSchema);
