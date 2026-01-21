const mongoose = require("mongoose");

const inviteCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // unique code
  ngo_id: { type: mongoose.Schema.Types.ObjectId, ref: "NGO", required: true },
  purpose: { type: String, enum: ["VolunteerRegistration"], default: "VolunteerRegistration" },

  // optional limit on uses
  max_uses: { type: Number, default: 1 },
  used_count: { type: Number, default: 0 },

  expiresAt: { type: Date, required: true }, // expiry date
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("InviteCode", inviteCodeSchema);
