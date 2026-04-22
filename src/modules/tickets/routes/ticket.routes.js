const express = require("express");

const ticketController = require("../controllers/ticket.controller");

const router = express.Router();

router.get("/", ticketController.listTickets);
router.post("/", ticketController.createTicket);
router.get("/:ticketId", ticketController.getTicket);
router.put("/:ticketId", ticketController.updateTicket);
router.patch("/:ticketId", ticketController.updateTicket);
router.delete("/:ticketId", ticketController.deleteTicket);

module.exports = router;
