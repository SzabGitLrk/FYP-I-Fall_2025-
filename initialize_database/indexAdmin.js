const mongoose = require("mongoose");
const Admin = require("../models/admin");
const initDB = require("./sampleAdmin");

const MONGO_URL = "mongodb://127.0.0.1:27017/ShareMyFood";

async function main() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to DB");
  } catch (err) {
    console.log("❌ DB Connection Error:", err);
    process.exit(1);
  }
}

async function initData() {
  try {
    await Admin.deleteMany({});
    console.log("🧹 Cleared existing admins");

    for (const adminData of initDB.data) {
      const { password, ...rest } = adminData;
      const newAdmin = new Admin(rest);
      await Admin.register(newAdmin, password); // ✅ Passport hashes password
    }

    console.log("🌱 Admins seeded successfully!");
    mongoose.connection.close();
  } catch (err) {
    console.log("❌ Error initializing admin data:", err);
  }
}

main().then(initData);
