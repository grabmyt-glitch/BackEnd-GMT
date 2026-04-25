const express = require("express");

const authRoutes = require("../modules/auth/routes/auth.routes");
const ticketRoutes = require("../modules/tickets/routes/ticket.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/tickets", ticketRoutes);

module.exports = router;
