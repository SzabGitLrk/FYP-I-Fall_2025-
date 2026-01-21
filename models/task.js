//Task Schema
const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
  donation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodDonation",
    required: true
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Volunteer",
    required: true
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NGO",
    required: true
  },
  task_title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Assigned", "In Progress", "Completed", "Failed"],
    default: "Assigned"
  },
  assignedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model("Task", taskSchema);
