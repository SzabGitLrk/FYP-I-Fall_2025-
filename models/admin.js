//Admin Schema
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { 
    
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },

  contact_number: { type: String },

  // ✅ Authorization role — useful if you later add SuperAdmin, Moderator, etc.
  role: { type: String, default: "Admin" },

  created_at: { type: Date, default: Date.now }
});

// ✅ Enables login using email & password (hash + salt handled automatically)
adminSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("Admin", adminSchema);
