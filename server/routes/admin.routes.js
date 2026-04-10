const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { isAdmin } = require("../middleware/roles");
const {
  getPlatformStats,
  listUsers,
  updateUser,
  listAllEvents,
} = require("../controllers/admin.controller");

// All admin routes require authentication + admin role
router.use(protect, isAdmin);

router.get("/stats", getPlatformStats);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.get("/events", listAllEvents);

module.exports = router;
