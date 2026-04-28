const express = require("express");

const authRoutes = require("../modules/auth/routes/auth.routes");
const authController = require("../modules/auth/controllers/auth.controller");
const ticketRoutes = require("../modules/tickets/routes/ticket.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/tickets", ticketRoutes);

// Top-level aliases for frontend convenience
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/verify-reset", authController.verifyResetToken);

module.exports = router;
