const User = require("../models/User");
const Event = require("../models/Event");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const {
  sendSuccess,
  sendError,
  sendNotFound,
} = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats  — platform overview
// ─────────────────────────────────────────────────────────────────────────────
const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalEvents, totalOrders, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Order.countDocuments({ status: "confirmed" }),
      Order.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    const organizers = await User.countDocuments({ role: "organizer" });
    const publishedEvents = await Event.countDocuments({ status: "published" });

    return sendSuccess(res, {
      totalUsers,
      organizers,
      totalEvents,
      publishedEvents,
      totalOrders,
      totalRevenue: revenueAgg[0]?.total ?? 0,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users  — paginated user list
// ─────────────────────────────────────────────────────────────────────────────
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const search = req.query.search;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (req.query.role) filter.role = req.query.role;

    const [users, total] = await Promise.all([
      User.find(filter).select("-password -refreshToken -verifyToken -passwordResetToken").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id  — update user role or active status
// ─────────────────────────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    // Prevent demoting yourself
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, "Admins cannot modify their own account through this endpoint.", 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) return sendNotFound(res, "User");

    const allowedRoles = ["attendee", "organizer", "staff", "admin"];
    if (role && allowedRoles.includes(role)) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    return sendSuccess(res, { user: user.toPublic() }, "User updated.");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/events  — all events with organizer info
// ─────────────────────────────────────────────────────────────────────────────
const listAllEvents = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizer", "name email")
        .select("title status category startDate venue totalSold organizer createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlatformStats, listUsers, updateUser, listAllEvents };
