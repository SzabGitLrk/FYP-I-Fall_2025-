require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const MONGO_URL = "mongodb://127.0.0.1:27017/ShareMyFood";
mongoose.connect(MONGO_URL);
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { sendEmail } = require("./utils/sendEmail.js");
const { getCoordinates }=require("./utils/geoCoding.js");
const multer = require("multer");
const { storage, cloudinary } = require("./cloudConfig");
const upload = multer({ storage });

// requiring our models 
// const upload = multer({ storage });
const admin = require("./models/admin.js");
const Task = require("./models/task.js");
const NGO = require("./models/NGO.js");
const donors = require("./models/donar.js");
const InviteCode = require("./models/inviteCode.js");
const food_donations = require("./models/food_donations.js");
const claims = require("./models/claim.js");
const volunteers = require("./models/volunteers.js");
const Contact = require("./models/contact.js");
const Notification=require("./models/notification.js");

// Register ejs-mate BEFORE setting view engine
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sessionOptions = {
  secret: "sharemyfood_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, // security: prevent client-side JS access
  },
};

app.use(session(sessionOptions));
app.use(flash());

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// --- Admin STRATEGY ---
passport.use("admin-local", admin.createStrategy());

// --- NGO STRATEGY ---
passport.use('ngo-local', NGO.createStrategy());

// --- DONOR STRATEGY ---
passport.use('donor-local', donors.createStrategy());

// --- VOLUNTEER STRATEGY ---
passport.use('volunteer-local', volunteers.createStrategy());

// --- SERIALIZATION / DESERIALIZATION ---
// We'll use custom functions to store {id, type} safely
passport.serializeUser((user, done) => {
    if (!user) return done(new Error("No user to serialize"));
    // Save only the _id and role
    done(null, { id: user._id.toString(), role: user.role });
});
passport.deserializeUser(async (obj, done) => {
  try {
    let user = null;
    switch (obj.role) {
      case "Admin":
        user = await admin.findById(obj.id);
        break;
      case "NGO":
        user = await NGO.findById(obj.id);
        break;
      case "Donor":
        user = await donors.findById(obj.id);
        break;
      case "Volunteer":
        user = await volunteers.findById(obj.id);
        break;
      default:
        return done(new Error("Unknown user role"));
    }

    if (!user) return done(new Error("User not found"));
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware to set flash messages and check if any donor is approved
app.use(async (req, res, next) => {
  try {
    // Flash messages
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");

    // Currently logged-in user (null if none)
    res.locals.currUser = req.user || null;

    // Check if any donor is approved by NGO
    const approvedDonorExists = await donors.exists({ status: "Approved" });
    res.locals.approvedDonorExists = approvedDonorExists;

    next();
  } catch (err) {
    console.error(err);
    res.locals.approvedDonorExists = false;
    next();
  }
});
// Dashboard / landing page
app.get("/dashboard", (req, res) => {
  // No need to fetch anything else, middleware handles approvedDonorExists
  res.render("dashboard_view/index.ejs");
});

// About route
app.get("/about", (req, res) => {
  res.render("about_view/index.ejs");
});

// How it works route
app.get("/works", (req, res) => {
  res.render("works/index.ejs");
});
//------------------------------------
// Middleware
//------------------------------------
function isAdminLoggedIn(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "Admin") {
    return next();
  }
  req.flash("error", "You must be logged in as admin!");
  res.redirect("/admin_login");
}

// GET: Contact page for users
app.get("/contact", (req, res) => {
  res.render("contact_view/index.ejs"); // make sure your EJS file exists
});

// POST: Submit contact form
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation: all fields required
    if (!name || !email || !message) {
      req.flash("error", "All fields are required!");
      return res.redirect("/contact");
    }

    // Save the message to database
    const newContact = new Contact({ name, email, message });
    await newContact.save();

    req.flash("success", "Your message has been sent successfully!");
    res.redirect("/contact");
  } catch (err) {
    console.error("Error submitting contact form:", err);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/contact");
  }
});


// Privacy & Terms pages
app.get("/privacy", (req, res) => res.render("privacy_view/index.ejs"));
app.get("/terms", (req, res) => res.render("terms_view/index.ejs"));


// Admin Authentication
app.get("/admin_login", (req, res) => {
  res.render("admin_view/login.ejs");
});

app.post(
  "/admin_login",
  passport.authenticate("admin-local", {
    failureRedirect: "/admin_login",
    failureFlash: true
  }),
  (req, res) => {
    res.redirect("/admin/dashboard");
  }
);


app.post("/admin_logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "You have successfully logged out.");
    res.redirect("/admin_login");
  });
});


// Admin Dashboard & Protected Routes
app.get("/admin/dashboard", isAdminLoggedIn, (req, res) => {
  res.render("admin_view/dashboard.ejs", { currUser: req.user });
});

// View all contacts
app.get("/contactMessages", isAdminLoggedIn, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.render("admin_view/contactMessages.ejs", { contacts });
  } catch (err) {
    console.error("Error fetching contact Messages:", err);
    req.flash("error", "Unable to load contact Messages.");
    res.redirect("/admin/dashboard");
  }
});

// View pending NGOs
app.get("/pending_ngos", isAdminLoggedIn, async (req, res) => {
  try {
    const pendingNGOs = await NGO.find({ status: "Pending" })
      .select("ngo_name email contact_number created_at licence_number");
    res.render("admin_view/pendingNgos.ejs", { pendingNGOs });
  } catch (err) {
    console.error("Error loading pending NGOs", err);
    req.flash("error", "Unable to load pending NGOs");
    res.redirect("/admin/dashboard");
  }
});

// Approve NGO
app.post("/approve_ngo/:id", isAdminLoggedIn, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      req.flash("error", "NGO not found");
      return res.redirect("/pending_ngos");
    }
    ngo.status = "Approved";
    ngo.approved_by = req.user._id;
    ngo.approved_at = new Date();

    await ngo.save();
    req.flash("success", "NGO approved successfully!");
    res.redirect("/pending_ngos");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/pending_ngos");
  }
});

// Reject NGO
app.post("/reject_ngo/:id", isAdminLoggedIn, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id);
    if (!ngo) {
      req.flash("error", "NGO not found");
      return res.redirect("/pending_ngos");
    }

    ngo.status = "Rejected";
    ngo.approved_by = req.user._id;
    ngo.approved_at = new Date();

    await ngo.save();
    req.flash("success", "NGO rejected successfully!");
    res.redirect("/pending_ngos");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/pending_ngos");
  }
});


// -------------------- GET: Edit Profile --------------------
app.get("/edit-admin", isAdminLoggedIn, async (req, res) => {
  try {
    const adminData = await admin.findById(req.user._id);

    res.render("admin_view/edit_admin.ejs", {
      admin: adminData
    });

  } catch (err) {
    console.log("Error fetching admin details:", err);
    req.flash("error", "Unable to load admin information.");
    res.redirect("/admin/dashboard");
  }
});


// -------------------- POST: Update Basic Details --------------------
app.post("/edit-admin", isAdminLoggedIn, async (req, res) => {
  try {
    const { name, email, contact_number } = req.body;

    await admin.findByIdAndUpdate(req.user._id, {
      name,
      email,
      contact_number
    });

    req.flash("success", "Profile updated successfully!");
    res.redirect("/edit-admin");

  } catch (err) {
    console.log("Admin Update Error:", err);

    if (err.code === 11000) {
      req.flash("error", "Email already exists!");
    } else {
      req.flash("error", "Unable to update admin profile.");
    }

    res.redirect("/edit-admin");
  }
});


// -------------------- GET: Change Password Page --------------------
app.get("/change-password", isAdminLoggedIn, (req, res) => {
  res.render("admin_view/change_password.ejs");
});


// -------------------- POST: Change Password --------------------
app.post("/edit-admin/change-password", isAdminLoggedIn, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash("error", "Passwords do not match!");
      return res.redirect("/change-password");
    }

    const adminDoc = await admin.findById(req.user._id);

    // passport-local-mongoose built-in function
    adminDoc.changePassword(oldPassword, newPassword, async (err) => {
      if (err) {
        req.flash("error", "Old password is incorrect!");
        return res.redirect("/change-password");
      }

      await adminDoc.save();
      req.flash("success", "Password updated successfully!");
      res.redirect("/change-password");
    });

  } catch (err) {
    console.log("Password Change Error:", err);
    req.flash("error", "Unable to change password.");
    res.redirect("/change-password");
  }
});

// GET: View All Approved NGOs
app.get("/all_ngos", isAdminLoggedIn, async (req, res) => {
  try {
    const ngos = await NGO.find({ status: "Approved" }); 
    res.render("NGO_dashboard/allngos.ejs", { ngos });
  } catch (err) {
    console.log(err);
    res.send("Error loading NGOs");
  }
});



app.get("/admin/ngo/:id", isAdminLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const ngo = await NGO.findById(id);
    if (!ngo) {
      return res.send("NGO not found");
    }

    res.render("NGO_dashboard/viewNGO.ejs", { ngo });
  } catch (err) {
    console.log(err);
    res.send("Error loading the NGO");
  }
});



// View all tasks assigned by a specific NGO
app.get("/ngo/:ngoId/tasks", async (req, res) => {
  try {
    const { ngoId } = req.params;

    const tasks = await task.find({ assigned_by: ngoId })
      .populate("assigned_to", "name email phone")   // Volunteer details
      .populate("donation_id", "food_title food_type") // Donation details
      .sort({ assignedAt: -1 });

    res.render("NGO_dashboard/tasks.ejs", {
      title: "NGO Tasks",
      tasks
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading NGO tasks");
  }
});


// =======================
// 1️⃣ GET: Send Notification Form
// =======================
app.get("/ngo/:ngoId/notify", async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.ngoId);

    if (!ngo) {
      return res.status(404).send("NGO not found");
    }

    res.render("NGO_dashboard/sendNotification.ejs", {
      title: "Send Notification",
      ngo
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to load notification page");
  }
});

// =======================
// 2️⃣ POST: Send Notification
// =======================
app.post("/ngo/:ngoId/notify", async (req, res) => {
  try {
    const { message } = req.body;
    await Notification.create({
      user_type: "NGO",
      user_id: req.params.ngoId,
      message
    });
      req.flash("success", "Notification sent successfully to the selected NGO");
      res.redirect("/admin/dashboard");
  } catch (error) {
    console.error(error);
     req.flash("error", "Failed to send notification");
    res.status(500).send("Failed to send notification");
  }
});

// =======================
// 3️⃣ GET: View NGO Notifications
// =======================
app.get("/ngo/:ngoId/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find({
      user_type: "NGO",
      user_id: req.params.ngoId
    }).sort({ createdAt: -1 });

    res.render("NGO_dashboard/notifications.ejs", {
      title: "NGO Notifications",
      notifications
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to load notifications");
  }
});

// =======================
// 4️⃣ Optional: NGO Details Page (so redirects work)
// =======================
app.get("/ngo/:ngoId/details", async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.ngoId);

    if (!ngo) return res.status(404).send("NGO not found");

    res.render("NGO_dashboard/viewNGO.ejs", {
      title: "NGO Details",
      ngo
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to load NGO details");
  }
});

//to fetch volunteers of specific NGO
app.get("/ngo/:ngoId/volunteers", async (req, res) => {
  try {
    const ngoId = req.params.ngoId;
    // Fetch volunteers linked to this NGO
    const volunteer = await volunteers.find({ ngo_id: ngoId });
    res.render("volunteer_view/allvolunteers.ejs", {volunteer});
  } catch (err) {
    console.log(err);
    res.send("Error loading volunteers");
  }
});

//to see all claimed donations
app.get("/ngo/:ngoId/donations", async (req, res) => {
  try {
    const ngoId = req.params.ngoId;

    // Find the NGO
    const ngo = await NGO.findById(ngoId);
    if (!ngo) {
      return res.send("NGO not found");
    }

    // Find all claims made by this NGO
    const claim= await claims.find({ claimedBy: ngoId })
      .populate("foodDonation") // get food donation details
      .populate("claimedBy")    // get NGO details
      .exec();
    res.render("NGO_dashboard/claimed_donationsAdminDashboard.ejs", { ngo, claim });
  } catch (err) {
    console.log(err);
    res.send("Error loading the Claimed Donations!");
  }
});

// GET: Show confirmation page
app.get("/ngo/:ngoId/delete", async (req, res) => {
  try {
    const ngoId = req.params.ngoId;
    const ngo = await NGO.findById(ngoId);

    if (!ngo) return res.send("NGO not found");

    res.render("NGO_dashboard/confirmDelete.ejs", { ngo });
  } catch (err) {
    console.log(err);
    res.send("Error fetching NGO!");
  }
});

// POST: Delete NGO
app.post("/ngo/:ngoId/delete", async (req, res) => {
  try {
    const ngoId = req.params.ngoId;
    const ngo = await NGO.findByIdAndDelete(ngoId);

    if (!ngo) return res.send("NGO not found");

    res.redirect("/all_ngos");
  } catch (err) {
    console.log(err);
    res.send("Error deleting NGO!");
  }
});


// GET: View All Donors
app.get("/all_donors", isAdminLoggedIn, async (req, res) => {
  try {
    const donor = await donors.find({});
    res.render("donor_view/alldonors.ejs", { donor });
  } catch (err) {
    console.log(err);
    res.send("Error loading donors");
  }
});

// GET: View All Volunteers
app.get("/all_volunteers", isAdminLoggedIn, async (req, res) => {
  try {
    const volunteer = await volunteers.find({});
    res.render("volunteer_view/allvolunteers.ejs", { volunteer });
  } catch (err) {
    console.log(err);
    res.send("Error loading volunteers");
  }
});



//------------------------------------
// Middleware: Check if NGO is logged in AND approved
//------------------------------------
function isNGOLoggedIn(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "NGO") {
    if (req.user.status !== "Approved") {
      req.flash("error", "Your account is still awaiting admin approval.");
      return res.redirect("/ngo_login");
    }
    return next();
  }

  req.flash("error", "Please login first!");
  return res.redirect("/ngo_login");
}


// GET: NGO Signup Page
app.get("/ngo_signup", (req, res) => {
  res.render("ngo_login_view/signup.ejs");
});

// POST: NGO Signup (Simple Version – No Geolocation)
app.post("/ngo_signup", async (req, res) => {
  try {
    const {
      ngo_name,
      licence_number,
      email,
      contact_number,
      address,
      head_person_name,
      head_person_contact,
      password
    } = req.body;

    // -------------------------------
    // 1️⃣ Create new NGO object
    // -------------------------------
    const newNGO = new NGO({
      ngo_name,
      licence_number,
      email,
      contact_number,
      address,
      head_person_name,
      head_person_contact,
      status: "Pending",
      role: "NGO"
    });
    //  Register NGO (passport-local-mongoose)
    await NGO.register(newNGO, password);
    // Optional: Notify Admin about new NGO signup
    const admins = await admin.find({ role: "Admin" });

    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_type: "Admin",
        user_id: admin._id,
        message: `New NGO signup request from ${ngo_name}. Please review and approve.`,
        donation_id: null
      }));

      await Notification.insertMany(notifications);
    }
  
    //Success Response
    req.flash(
      "success",
      "Signup successful! Please wait for admin approval."
    );
    return res.redirect("/ngo_login");

  } catch (err) {
    console.error("NGO Signup Error:", err);

    if (err.name === "UserExistsError") {
      req.flash("error", "Email already registered.");
    } else if (err.code === 11000) {
      req.flash("error", "Email or license number already exists.");
    } else {
      req.flash("error", "Signup failed. Please try again.");
    }

    return res.redirect("/ngo_signup");
  }
});

// GET: NGO Login Page
app.get("/ngo_login", (req, res) => {
  res.render("ngo_login_view/login.ejs");
});


// POST: NGO Login
app.post(
  "/ngo_login",
  passport.authenticate("ngo-local", {
    failureRedirect: "/ngo_login",
    failureFlash: true,
  }),
  (req, res, next) => {
    // Only allow approved NGOs
    if (req.user.role === "NGO" && req.user.status !== "Approved") {
      req.logout(err => {
        if (err) return next(err);
        req.flash("error", "Your account is pending approval by the admin.");
        return res.redirect("/ngo_login");
      });
    } else {
      req.flash("success", "Login successful!");
      res.redirect("/ngo/dashboard");
    }
  }
);


// NGO Dashboard (Protected Route)
app.get("/ngo/dashboard", isNGOLoggedIn, async (req, res) => {
  try {
    const ngoId = req.user._id;
    // Count unread notifications for this NGO
    const unreadCount = await Notification.countDocuments({
      user_type: "NGO",
      user_id: ngoId,
      isRead: false
    });
    res.render("NGO_dashboard/index.ejs", {
      ngo: req.user,
      unreadCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading NGO dashboard");
  }
});

app.get("/edit-ngo", isNGOLoggedIn, (req, res) => {
  res.render("NGO_dashboard/edit_ngoInfo.ejs", { ngo: req.user });
});

app.post("/edit-ngo", isNGOLoggedIn, async (req, res) => {
  try {
    const { ngo_name, contact_number, address, head_person_name, head_person_contact } = req.body;

    await NGO.findByIdAndUpdate(req.user._id, {
      ngo_name,
      contact_number,
      address,
      head_person_name,
      head_person_contact
    });

    req.flash("success", "Information updated successfully.");
    res.redirect("/ngo/dashboard");

  } catch (err) {
    console.error(err);
    req.flash("error", "Error updating NGO information.");
    res.redirect("/edit-ngo");
  }
});


// =======================
// GET: View NGO Notifications (Protected)
// =======================
app.get("/ngo/notifications", isNGOLoggedIn, async (req, res) => {
  try {
    const ngoId = req.user._id;

    // Fetch all notifications for this NGO
    const notifications = await Notification.find({
      user_type: "NGO",
      user_id: ngoId
    }).sort({ createdAt: -1 });

    // Optional: mark all unread as read
    await Notification.updateMany(
      { user_type: "NGO", user_id: ngoId, isRead: false },
      { isRead: true }
    );
    res.render("NGO_dashboard/notifications.ejs", {
      title: "NGO Notifications",
      notifications
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to load notifications");
  }
});


//Mark Notification as Read
app.post("/ngo/notifications/:id/mark-read", isNGOLoggedIn, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.redirect("/ngo/notifications"); // Redirect back to notifications page
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to mark notification as read");
  }
});


//Delete Notification
app.post("/ngo/notifications/:id/delete", isNGOLoggedIn, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.redirect("/ngo/notifications"); // Redirect back to notifications page
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete notification");
  }
});

app.get("/ngo/change-password", isNGOLoggedIn, (req, res) => {
  res.render("NGO_dashboard/change_password.ejs");
});

app.post("/ngo/change-password", isNGOLoggedIn, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.user._id);

    const { old_password, new_password } = req.body;

    ngo.changePassword(old_password, new_password, async (err) => {
      if (err) {
        console.log("Password change error:", err);
        req.flash("error", "Incorrect old password.");
        return res.redirect("/ngo/change-password");
      }

      await ngo.save();

      req.flash("success", "Password updated successfully.");
      res.redirect("/ngo/dashboard");
    });

  } catch (err) {
    console.error("Error changing password:", err);
    req.flash("error", "Unable to change password.");
    res.redirect("/ngo/change-password");
  }
});
// ----------------------------
// GET: Upload Documents Page
// ----------------------------
app.get('/upload-documents', isNGOLoggedIn, (req, res) => {
  res.render('NGO_dashboard/upload_documents.ejs', { ngo: req.user });
});
app.post('/upload-documents', isNGOLoggedIn, upload.array('documents', 5), async (req, res) => {
  try {
    console.log("FILES RECEIVED:", req.files); // Now you should see actual files

    if (!req.files || req.files.length === 0) {
      req.flash("error", "No files uploaded.");
      return res.redirect("/upload-documents");
    }

    const uploadedDocs = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: file.path, // Cloudinary URL is stored here
      uploadedAt: new Date(),
    }));

    await NGO.findByIdAndUpdate(req.user._id, {
      $push: { verification_documents: { $each: uploadedDocs } }
    });

    req.flash("success", "Documents uploaded successfully!");
    res.redirect('/upload-documents');

  } catch (err) {
    console.error('Upload error:', err);
    req.flash("error", "Failed to upload documents.");
    res.redirect('/upload-documents');
  }
});

// // GET: NGO - Available Donations
app.get("/ngo/available-donations", isNGOLoggedIn, async (req, res) => {
  try {
    const city = req.query.city || "";
    const type = req.query.type || "";

    let filter = { status: "Pending" };

    if (city.trim() !== "") {
      filter.pickup_city = { $regex: city, $options: "i" };
    }

    if (type.trim() !== "") {
      filter.food_type = type;
    }

    const donations = await food_donations.find(filter).populate("donor_id");

    res.render("NGO_dashboard/available_donations.ejs", {
      donations,
      city,
      type
    });

  } catch (err) {
    console.log("Error loading donations:", err);
    req.flash("error", "Could not load donations.");
    res.redirect("/ngo/dashboard");
  }
});

// POST: NGO claims a donation
app.post("/ngo/claim/:id", isNGOLoggedIn, async (req, res) => {
  try {
    const donation = await food_donations.findById(req.params.id);

    if (!donation) {
      req.flash("error", "Donation not found.");
      return res.redirect("/ngo/available-donations");
    }

    if (donation.status !== "Pending") {
      req.flash("error", "Donation already claimed.");
      return res.redirect("/ngo/available-donations");
    }

    donation.status = "Claimed";
    donation.claimedBy = req.user._id;
    await donation.save();

    await NGO.findByIdAndUpdate(req.user._id, {
      $inc: { claimed_count: 1 },
    });

    req.flash("success", "Donation claimed successfully!");
    res.redirect("/ngo/available-donations");
  } catch (err) {
    console.log(err);
    req.flash("error", "Could not claim donation.");
    res.redirect("/ngo/available-donations");
  }
});



// -----------------------------
// GET: NGO - Claimed Donations
// -----------------------------
app.get("/ngo/claimed-donations", isNGOLoggedIn, async (req, res) => {
  try {
    const donations = await food_donations
      .find({ claimedBy: req.user._id, status: "Claimed" })
      .populate("donor_id");

    res.render("NGO_dashboard/claimed_donations.ejs", { donations });
  } catch (err) {
    console.log(err);
    req.flash("error", "Could not load claimed donations.");
    res.redirect("/ngo/dashboard");
  }
});

app.get("/volunteers", isNGOLoggedIn, async (req, res) => {
  try {
    const volunteer = await volunteers
      .find({ ngo_id: req.user._id })
      .populate("assigned_tasks")
      .populate("invite_code_ref");

    const donations = await food_donations.find({
      claimedBy: req.user._id,
      status: "Claimed",
    });

    res.render("NGO_dashboard/volunteers", { volunteer, donations });
  } catch (err) {
    console.error("Error fetching volunteers:", err);
    res.send("Error fetching volunteers");
  }
});

// --- Load Assign Tasks Page ---
app.get("/assign-tasks", isNGOLoggedIn, async (req, res) => {
  try {
    const volunteersList = await volunteers.find({
      ngo_id: req.user._id,
      status: "Active",
    });

    const claimedDonations = await food_donations.find({
      status: "Claimed",
      claimedBy: req.user._id,
    });

    res.render("NGO_dashboard/assign-tasks.ejs", {
      volunteers: volunteersList,
      donations: claimedDonations,
    });
  } catch (err) {
    console.error("Error loading assign task page:", err);
    req.flash("error", "Unable to load assign task page");
    res.redirect("/ngo_dashboard");
  }
});

// --- Handle Task Assignment ---
app.post("/assign-tasks", isNGOLoggedIn, async (req, res) => {
  try {
    const { volunteer_id, donation_id, task_title, } = req.body;

    if (!volunteer_id || !donation_id || !task_title) {
      req.flash("error", "All fields are required");
      return res.redirect("/assign-tasks");
    }

    // Verify volunteer exists
    const volunteer = await volunteers.findById(volunteer_id);
    if (!volunteer) {
      req.flash("error", "Volunteer not found");
      return res.redirect("/assign-tasks");
    }

    // Verify donation exists
    const donation = await food_donations.findById(donation_id);
    if (!donation) {
      req.flash("error", "Donation not found");
      return res.redirect("/assign-tasks");
    }

    // Create task
    const newTask = await Task.create({
      donation_id,
      assigned_to: volunteer_id,
      assigned_by: req.user._id,
      task_title,
    });

    // Push task to volunteer
    volunteer.assigned_tasks.push(newTask._id);
    await volunteer.save();

    // Update donation with assigned volunteer
    donation.assignedVolunteer = volunteer_id;
    await donation.save();

    req.flash("success", "Task assigned successfully!");
    res.redirect("/assign-tasks");
  } catch (err) {
    console.error("Error assigning task:", err);
    req.flash("error", "Error assigning task.");
    res.redirect("/assign-tasks");
  }
});


// POST: NGO Logout
app.post("/ngo_logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully");
    res.redirect("/ngo_login");
  });
});



// Middleware to protect donor routes
function isDonorLoggedIn(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "Donor") {
    return next();
  }
  req.flash("error", "You must be logged in as a donor!");
  res.redirect("/donor_login");
}

//DONOR SIGNUP

// Signup form
app.get("/donor_signup", (req, res) => {
  res.render("donor_view/signup.ejs");
});

// Handle signup form submit
app.post("/donor_signup", async (req, res) => {
  try {
    const { name, email, phone, address, city, organizationType, password } = req.body;
    const newDonor = new donors({
      name,
      email,
      phone,
      address,
      city,
      organizationType,
    });
    await donors.register(newDonor, password); //Passport-local-mongoose handles hashing
    req.flash("success", "Registration successful! You can now login.");
    res.redirect("/donor_login");
  } catch (err) {
    req.flash("error", "Error registering donor: " + err.message);
    res.redirect("/donor_signup");
  }
});

// Login form
app.get("/donor_login", (req, res) => {
  res.render("donor_view/login.ejs");
});

// Handle login submit
app.post(
  "/donor_login",
  passport.authenticate("donor-local", {
    failureRedirect: "/donor_login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/donor/dashboard");
  }
);

app.get("/donor/dashboard", isDonorLoggedIn, async (req, res) => {
  try {
    const donor = await donors.findById(req.user._id).populate("foodDonations");

    const totalDonations = donor.foodDonations ? donor.foodDonations.length : 0;

    res.render("donor_view/dashboard.ejs", { donor, totalDonations });
  } catch (err) {
    console.log("Error loading donor dashboard:", err);
    req.flash("error", "Unable to load dashboard");
    res.redirect("/");
  }
});


// GET: Edit Donor Info
app.get("/donor/edit-info", isDonorLoggedIn, async (req, res) => {
  try {
    const donor = await donors.findById(req.user._id);
    res.render("donor_view/editDonor.ejs", { donor });
  } catch (err) {
    console.log("Error loading donor info:", err);
    req.flash("error", "Unable to load your information.");
    res.redirect("/donor/dashboard");
  }
});

// POST: Update Donor Information
app.post("/donor/edit-info", isDonorLoggedIn, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      city,
      organizationType
    } = req.body;

    await donors.findByIdAndUpdate(req.user._id, {
      name,
      phone,
      address,
      city,
      organizationType
    });

    req.flash("success", "Your information has been updated!");
    res.redirect("/donor/dashboard");
  } catch (err) {
    console.log("Donor Update Error:", err);
    req.flash("error", "Unable to update information.");
    res.redirect("/donor/edit-info");
  }
});

app.get("/donor/change-password", isDonorLoggedIn, (req, res) => {
  res.render("donor_view/change_password.ejs");
});



app.post("/donor/change-password", isDonorLoggedIn, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash("error", "New passwords do not match!");
      return res.redirect("/donor/change-password");
    }
    const donor = await donors.findById(req.user._id);

    await donor.changePassword(oldPassword, newPassword);
    await donor.save();

    req.flash("success", "Password updated successfully!");
    res.redirect("/donor/dashboard");
  } catch (err) {
    console.log("Password Change Error:", err);
    req.flash("error", "Old password is incorrect!");
    res.redirect("/donor/change-password");
  }
});




// GET: Show Add Food Donation Form
app.get("/donate-food", isDonorLoggedIn, (req, res) => {
  res.render("donor_view/donate_food.ejs");
});
// POST: Handle Food Donation Form Submission
app.post("/donate-food", isDonorLoggedIn, async (req, res) => {
  try {
    const {
      food_title,
      quantity,
      pickup_address,
      pickup_city
    } = req.body;

    //Create new food donation
    const newDonation = new food_donations({
      donor_id: req.user._id,
      food_title,
      quantity,
      pickup_address,
      pickup_city
    });

    await newDonation.save();
    // Update donor stats
    await donors.findByIdAndUpdate(req.user._id, {
      $inc: { total_donations: 1 },
      $push: { foodDonations: newDonation._id }
    });

    
    // Notification for NGOs
    // (No location-based filtering now)
    const approvedNGOs = await NGO.find({ status: "Approved" });

    if (approvedNGOs.length > 0) {
      const notifications = approvedNGOs.map(ngo => ({
        user_type: "NGO",
        user_id: ngo._id,
        donation_id: newDonation._id,
        message: `New food donation: ${newDonation.food_title}`
      }));

      await Notification.insertMany(notifications);
    }

    // Redirect with success
    req.flash(
      "success",
      `Food donation added! ${approvedNGOs.length} NGOs notified.`
    );
    res.redirect("/donor/dashboard");

  } catch (error) {
    console.error("Donation Error:", error);
    req.flash("error", "Failed to add donation. Please try again.");
    res.redirect("/donate-food");
  }
});





app.get("/donations-history", isDonorLoggedIn, async (req, res) => {
  try {
    const donations = await food_donations.find({
      donor_id: req.user._id
    }).populate('claimedBy');

    res.render("donor_view/donation_history.ejs", { donations });

  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to fetch donation history.");
    res.redirect("/donor/dashboard");
  }
});


app.get("/donor/total-donations", isDonorLoggedIn, async (req, res) => {
  try {
    const donor = await donors.findById(req.user._id);

    if (!donor) {
      req.flash("error", "Donor not found.");
      return res.redirect("/donor/dashboard");
    }

    // Fetch all donations for listing (optional)
    const donations = await food_donations.find({ donor_id: req.user._id }).sort({ createdAt: -1 });

    const totalDonations = donor.total_donations || donations.length;

    res.render("donor_view/total_donations.ejs", {
      donor,
      donations,
      totalDonations
    });

  } catch (err) {
    console.error("TOTAL DONATIONS ERROR:", err);
    req.flash("error", "Unable to load total donations.");
    res.redirect("/donor/dashboard");
  }
});



//DONOR LOGOUT
app.post("/donor_logout", isDonorLoggedIn, (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "You have successfully logged out.");
    res.redirect("/donor_login");
  });
});



function isNGOAuthenticated(req, res, next) {
  if (req.user && req.user.role === "NGO") {
    return next();
  } else {
    return res.status(401).send("Unauthorized: NGO login required");
  }
}


// --- Generate Invite Code (GET) ---
app.get("/generate-invite", isNGOAuthenticated, (req, res) => {
  const ngo = req.user;
  res.render("invite_view/index.ejs", { ngo });
});



// --- Generate Invite Code (POST) --
app.post("/generate-invite", isNGOAuthenticated, async (req, res) => {
  try {
    const ngo = req.user;
    const { volunteerEmail } = req.body;
    if (!volunteerEmail)
      return res.status(400).send("Volunteer email is required.");

    // Generate unique invite code
    let code;
    let exists = true;
    while (exists) {
      code = `VOL-${nanoid(6).toUpperCase()}`;
      exists = await InviteCode.findOne({ code });
    }

    // Create invite in DB
    const invite = new InviteCode({
      code,
      ngo_id: ngo._id,
      max_uses: 1,
      used_count: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await invite.save();

    // Email content
    const registerLink = `http://localhost:3000/volunteer_signup/${code}`;
    const message = `
      Hello,

      You have been invited to join ${ngo.name} as a Volunteer on ShareMyFood.

      Your invitation code: ${code}

      Click below to register:
      ${registerLink}

      This code will expire in 7 days.
      Best regards,
      ShareMyFood Team
    `;

    await sendEmail(volunteerEmail, "Volunteer Invitation | ShareMyFood", message);
    res.status(201).json({
      message: `Invite code generated and email sent to ${volunteerEmail}.`,
      inviteLink: registerLink,
    });
  } catch (error) {
    console.error("❌ Error generating invite:", error);
    res.status(500).send("Error generating invite code: " + error.message);
  }
});

// --- Volunteer Signup (GET) ---
app.get("/volunteer_signup/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const invite = await InviteCode.findOne({ code });
    if (!invite) return res.status(400).send("Invalid invite code.");
    if (invite.used_count >= invite.max_uses)
      return res.status(400).send("This invite has already been used.");
    if (invite.expiresAt < new Date())
      return res.status(400).send("This invite has expired.");

    res.render("volunteer_view/signup.ejs", { invite });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading signup form.");
  }
});

// --- Volunteer Signup (POST) ---
app.post("/volunteer_signup/:code", async (req, res) => {
  const { code } = req.params;
  const { name, email, phone, address, city, password } = req.body;

  try {
    const invite = await InviteCode.findOne({ code });
    if (!invite) return res.status(400).send("Invalid invite code.");
    if (invite.used_count >= invite.max_uses)
      return res.status(400).send("This invite has already been used.");
    if (invite.expiresAt < new Date())
      return res.status(400).send("This invite has expired.");

    // Create volunteer
    const newVolunteer = new volunteers({
      name,
      email,
      phone,
      address,
      city,
      invite_code_used: code,
      invite_code_ref: invite._id,
      ngo_id: invite.ngo_id,
      role: "Volunteer", // Important for authentication
    });

    await volunteers.register(newVolunteer, password);

    // Increment usage
    invite.used_count += 1;
    await invite.save();

    const message = encodeURIComponent("Volunteer registered successfully! You can now log in.");
res.redirect("/volunteer_login?success=" + message);
    // res.redirect("Volunteer registered successfully! You can now log in."+"/volunteer_login");
  } catch (error) {
    console.error("Error registering volunteer:", error);
    res.status(500).send("Error registering volunteer: " + error.message);
  }
});

// --- Volunteer Login (GET) ---
app.get("/volunteer_login", (req, res) => {
  res.render("volunteer_view/login.ejs");
});

// --- Volunteer Login (POST) ---
app.post("/volunteer_login", (req, res, next) => {
  passport.authenticate("volunteer-local", (err, volunteer, info) => {
    if (err) return next(err);
    if (!volunteer) {
      req.flash("error", info?.message || "Invalid email or password");
      return res.redirect("/volunteer_login");
    }
    req.login(volunteer, (err) => {
      if (err) return next(err);
      req.flash("success", "Login successful!");
      return res.redirect("/volunteer_dashboard");
    });
  })(req, res, next);
});

// --- Volunteer Dashboard ---
const isVolunteerAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated() || req.user.role !== "Volunteer") {
    req.flash("error", "Please log in first.");
    return res.redirect("/volunteer_login");
  }
  next();
};


// --- Volunteer Dashboard ---
app.get("/volunteer_dashboard", isVolunteerAuthenticated, async (req, res) => {
  try {
    const volunteer = req.user;

    const assigned = await Task.countDocuments({
      assigned_to: volunteer._id,
      status: "Assigned"
    });

    const inProgress = await Task.countDocuments({
      assigned_to: volunteer._id,
      status: "In Progress"
    });

    const completed = await Task.countDocuments({
      assigned_to: volunteer._id,
      status: "Completed"
    });

    res.render("volunteer_view/dashboard.ejs", {
      volunteer,
      stats: {
        assigned,
        inProgress,
        completed
      }
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/volunteer_login");
    }
});


// --- View Current Tasks ---
app.get("/volunteer/tasks", isVolunteerAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({
      assigned_to: req.user._id
    })
      .populate("donation_id")
      .populate("assigned_by");

    res.render("volunteer_view/tasks.ejs", { tasks });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to load tasks");
    res.redirect("/volunteer_dashboard");
  }
});

// --- Start a Task ---
app.post("/volunteer/task/:id/start", isVolunteerAuthenticated, async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { status: "In Progress" });
    req.flash("success", "Task started successfully");
    res.redirect("/volunteer/tasks");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to start task");
    res.redirect("/volunteer/tasks");
  }
});

// --- Complete a Task ---
app.post("/volunteer/task/:id/complete", isVolunteerAuthenticated, async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, {
      status: "Completed",
      completedAt: new Date()
    });
    req.flash("success", "Task completed successfully");
    res.redirect("/volunteer/tasks");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to complete task");
    res.redirect("/volunteer/tasks");
  }
});

// --- Fail a Task ---
app.post("/volunteer/task/:id/fail", isVolunteerAuthenticated, async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { status: "Failed" });
    req.flash("error", "Task marked as failed");
    res.redirect("/volunteer/tasks");
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to update task");
    res.redirect("/volunteer/tasks");
  }
});

// --- Task History (Completed / Failed) ---
app.get("/volunteer/task-history", isVolunteerAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({
      assigned_to: req.user._id,
      status: { $in: ["Completed", "Failed"] }
    }).populate("donation_id");

    res.render("volunteer_view/task_history.ejs", { tasks });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to load history");
    res.redirect("/volunteer_dashboard");
  }
});


app.get("/volunteer/profile", isVolunteerAuthenticated, (req, res) => {
  res.render("volunteer_view/profile.ejs", { volunteer: req.user });
});

app.post("/volunteer/profile/update", isVolunteerAuthenticated, async (req, res) => {
  try {
    const { name, phone, address, city } = req.body;

    await volunteers.findByIdAndUpdate(req.user._id, {
      name,
      phone,
      address,
      city
    });

    req.flash("success", "Profile updated successfully");
    res.redirect("/volunteer/profile");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to update profile");
    res.redirect("/volunteer/profile");
  }
});

app.get("/volunteer/change-password", isVolunteerAuthenticated, (req, res) => {
  res.render("volunteer_view/change_password.ejs");
});

app.post("/volunteer/change-password", isVolunteerAuthenticated, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash("error", "New passwords do not match");
      return res.redirect("/volunteer/change-password");
    }

    const volunteer = await volunteers.findById(req.user._id);

    volunteer.changePassword(oldPassword, newPassword, (err) => {
      if (err) {
        req.flash("error", "Old password is incorrect");
        return res.redirect("/volunteer/change-password");
      }

      req.flash("success", "Password updated successfully");
      res.redirect("/volunteer_dashboard");
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/volunteer/change-password");
  }
});





// --- Volunteer Logout ---
app.post("/volunteer_logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You have logged out successfully!");
    res.redirect("/volunteer_login");
  });

});



app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});



