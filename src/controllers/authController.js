const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/response");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      throw new ApiError(409, "Email already registered");
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    return sendResponse(res, 201, "User registered successfully", {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = generateToken(user._id);

    return sendResponse(res, 200, "Login successful", { user, token });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    return sendResponse(res, 200, "Profile fetched successfully", {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };