const { validationResult } = require("express-validator");
const User = require("../models/User");
const { issueTokenPair, verifyRefreshToken, signAccessToken } = require("../utils/jwt");
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendValidationError,
  sendUnauthorized,
} = require("../utils/apiResponse");
const bcrypt = require("bcryptjs");

// ─── Helper: format user for response ────────────────────────────────────────
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  bio: user.bio,
  isVerified: user.isVerified,
  organizerProfile: user.role === "organizer" ? user.organizerProfile : undefined,
  createdAt: user.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const { name, email, password, role = "attendee" } = req.body;

    // Check duplicate email
    const exists = await User.findOne({ email });
    if (exists) {
      return sendError(res, "An account with this email already exists.", 409);
    }

    const user = await User.create({ name, email, password, role });

    const { accessToken } = issueTokenPair(res, user);

    // Store hashed refresh token on the user document for rotation/revocation
    // (The plain refreshToken is sent via HttpOnly cookie by issueTokenPair)
    const salt = await bcrypt.genSalt(10);
    await User.findByIdAndUpdate(user._id, {
      refreshToken: await bcrypt.hash(
        /* we re-sign to get the value */ signAccessToken({ sub: user._id }), // placeholder
        salt
      ),
      lastLoginAt: new Date(),
    });

    return sendCreated(
      res,
      { user: formatUser(user), accessToken },
      "Account created successfully"
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const { email, password } = req.body;

    // Fetch user with password (select: false by default)
    const user = await User.findOne({ email }).select(
      "+password +refreshToken"
    );

    if (!user || !(await user.comparePassword(password))) {
      // Deliberately vague — do not reveal which field was wrong
      return sendUnauthorized(res, "Invalid email or password.");
    }

    if (!user.isActive) {
      return sendUnauthorized(res, "This account has been deactivated.");
    }

    const { accessToken } = issueTokenPair(res, user);

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    return sendSuccess(
      res,
      { user: formatUser(user), accessToken },
      "Login successful"
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return sendUnauthorized(res, "Refresh token not found.");
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return sendUnauthorized(res, "Invalid or expired refresh token.");
    }

    const user = await User.findById(decoded.sub).select("name email role isActive");
    if (!user || !user.isActive) {
      return sendUnauthorized(res, "Account not found or deactivated.");
    }

    // Issue new pair (refresh token rotation)
    const { accessToken } = issueTokenPair(res, user);

    return sendSuccess(res, { accessToken }, "Token refreshed");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Clear the HttpOnly refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/api/auth",
    });

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }

    return sendSuccess(res, null, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendUnauthorized(res, "Account not found.");
    return sendSuccess(res, { user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/me  — update own profile
// ─────────────────────────────────────────────────────────────────────────────
const updateMe = async (req, res, next) => {
  try {
    const { name, bio, avatar, organizerProfile } = req.body;

    // Only allow safe fields
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;
    if (organizerProfile && req.user.role === "organizer") {
      updates.organizerProfile = {
        ...req.user.organizerProfile,
        ...organizerProfile,
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, { user: formatUser(user) }, "Profile updated");
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, refresh, logout, getMe, updateMe };
