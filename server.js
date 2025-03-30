const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/password-manager",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwords: [
    {
      appName: String,
      username: String,
      password: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const User = mongoose.model("User", userSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    }
  );
};

// Routes
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error creating user" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key"
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
  }
});

// Password management routes
app.post("/api/passwords", authenticateToken, async (req, res) => {
  try {
    const { appName, username, password, category } = req.body;

    if (!appName || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.passwords.push({
      appName,
      username,
      password,
      category,
    });

    await user.save();
    res.status(201).json({ message: "Password saved successfully" });
  } catch (error) {
    console.error("Error saving password:", error);
    res.status(500).json({ error: "Error saving password" });
  }
});

app.get("/api/passwords", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json(user.passwords);
  } catch (error) {
    res.status(500).json({ error: "Error fetching passwords" });
  }
});

// Add this new route after the GET /api/passwords route
app.delete(
  "/api/passwords/:passwordId",
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const passwordId = req.params.passwordId;
      user.passwords = user.passwords.filter(
        (pwd) => pwd._id.toString() !== passwordId
      );

      await user.save();
      res.json({ message: "Password deleted successfully" });
    } catch (error) {
      console.error("Error deleting password:", error);
      res.status(500).json({ error: "Error deleting password" });
    }
  }
);

// Password generation
app.get("/api/generate-password", (req, res) => {
  const length = parseInt(req.query.length) || 16;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  res.json({ password });
});

// Update the check-password endpoint
app.post("/api/check-password", async (req, res) => {
  try {
    const { password } = req.body;

    // Hash the password using SHA-1 (required by Google's API)
    const hashedPassword = crypto
      .createHash("sha1")
      .update(password)
      .digest("hex");

    // Make request to Google's Password Checkup API
    const response = await axios.post(
      "https://passwordsleakcheck.googleapis.com/v1/checkPassword",
      {
        hashPrefix: hashedPassword.substring(0, 10).toUpperCase(),
        hashSuffix: hashedPassword.substring(10).toUpperCase(),
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Client-Version": "1.0.0",
        },
      }
    );

    res.json({
      isLeaked: response.data.isLeaked || false,
      breachCount: response.data.breachCount || 0,
    });
  } catch (error) {
    console.error("Error checking password:", error);
    res.status(500).json({ error: "Error checking password" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
