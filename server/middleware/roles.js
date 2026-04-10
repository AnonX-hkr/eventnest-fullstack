const { sendForbidden } = require("../utils/apiResponse");

/**
 * requireRole(...roles)
 *
 * Usage:
 *   router.post("/events", protect, requireRole("organizer", "admin"), createEvent);
 *
 * Must be used AFTER the `protect` middleware so req.user is populated.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendForbidden(res, "Authentication required before role check.");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendForbidden(
        res,
        `This action requires one of the following roles: ${allowedRoles.join(", ")}. ` +
          `Your current role is: ${req.user.role}.`
      );
    }

    next();
  };
};

/**
 * requireOwnerOrAdmin
 *
 * Ensures the authenticated user either:
 *   (a) owns the resource (their _id matches resourceUserId), OR
 *   (b) is an admin
 *
 * Usage: call with the owner's userId string after fetching the resource.
 *
 *   const event = await Event.findById(req.params.id);
 *   requireOwnerOrAdmin(req, res, next, event.organizer.toString());
 */
const requireOwnerOrAdmin = (req, res, next, resourceUserId) => {
  if (!req.user) return sendForbidden(res);

  const isOwner = req.user._id.toString() === resourceUserId;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return sendForbidden(res, "You can only modify your own resources.");
  }

  next();
};

/**
 * Shorthand role checkers
 */
const isOrganizer = requireRole("organizer", "admin");
const isAdmin = requireRole("admin");
const isStaffOrAbove = requireRole("organizer", "staff", "admin");
const isAnyRole = requireRole("attendee", "organizer", "staff", "admin");

module.exports = {
  requireRole,
  requireOwnerOrAdmin,
  isOrganizer,
  isAdmin,
  isStaffOrAbove,
  isAnyRole,
};
