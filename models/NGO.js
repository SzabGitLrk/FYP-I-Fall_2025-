//NGO Schema
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const ngoSchema = new mongoose.Schema({
  ngo_name: {
    type: String,
    required: true
  },

  licence_number: {
    type: String,
    required: true,
    unique: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  contact_number: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  head_person_name: {
    type: String,
    required: true
  },

  head_person_contact: {
    type: String,
    required: true
  },

  verification_documents: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },

  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },

  approved_at: {
    type: Date
  },

  volunteers_count: {
    type: Number,
    default: 0
  },

  claimed_count: {
    type: Number,
    default: 0
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  role: {
    type: String,
    default: "NGO"
  }
});

// 🔐 Authentication using email
ngoSchema.plugin(passportLocalMongoose, {
  usernameField: "email"
});


module.exports = mongoose.model("NGO", ngoSchema);
