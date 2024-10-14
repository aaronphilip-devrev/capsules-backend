const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
require("dotenv").config();

// Import models
const User = require("./models/user");
const TimeCapsule = require("./models/timeCapsule");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Connect to MongoDB
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB database connection established successfully"))
  .catch((err) => console.log("MongoDB connection error: ", err));

// Middleware to check if user is authenticated
const authMiddleware = (req, res, next) => {
  const userId = req.headers.authorization?.split(' ')[1];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.userId = userId;
  next();
};

// Registration route
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save user to database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // If credentials are valid, you might want to generate a token here
    // For simplicity, we're just sending a success message
    res.json({ message: "Login successful", userId: user._id });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all time capsules for a user
app.get('/timecapsules', authMiddleware, async (req, res) => {
  try {
    const capsules = await TimeCapsule.find({ creator: req.userId })
      .sort({ createdAt: -1 });
    res.json(capsules);
  } catch (error) {
    console.error('Error fetching time capsules:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new time capsule with image upload
app.post('/timecapsules', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, content, recipients } = req.body;
    let imageBase64 = null;

    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
    }

    const newCapsule = new TimeCapsule({
      creator: new mongoose.Types.ObjectId(req.userId),
      title,
      content,
      image: imageBase64,
      recipients: recipients ? recipients.split(',').map(id => new mongoose.Types.ObjectId(id)) : []
    });

    const savedCapsule = await newCapsule.save();
    res.status(201).json(savedCapsule);
  } catch (error) {
    console.error('Error creating time capsule:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
