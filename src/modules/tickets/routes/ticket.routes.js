const express = require("express");

const ticketController = require("../controllers/ticket.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", ticketController.listTickets);
router.post("/", authenticateToken, ticketController.createTicket);
router.get("/:ticketId", ticketController.getTicket);
router.put("/:ticketId", authenticateToken, ticketController.updateTicket);
router.patch("/:ticketId", authenticateToken, ticketController.updateTicket);
router.delete("/:ticketId", authenticateToken, ticketController.deleteTicket);

module.exports = router;
