const express = require("express");

const ticketRoutes = require("../modules/tickets/routes/ticket.routes");

const router = express.Router();

router.use("/tickets", ticketRoutes);

module.exports = router;
