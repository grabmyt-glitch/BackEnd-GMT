const asyncHandler = require("../../../utils/async-handler");
const ticketService = require("../services/ticket.service");
const {
  normalizeTicketInput,
  normalizeTicketQuery,
  formatTicketResponse,
} = require("../utils/ticket-payload");

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(
    normalizeTicketInput(req.body),
    req.user.userId,
  );

  res.status(201).json({
    success: true,
    message: "Ticket created successfully.",
    data: formatTicketResponse(ticket),
  });
});

const listTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.listTickets(
    normalizeTicketQuery(req.query),
  );

  res.status(200).json({
    success: true,
    message: "Tickets fetched successfully.",
    data: result.items.map(formatTicketResponse),
    pagination: result.pagination,
  });
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.params.ticketId);

  res.status(200).json({
    success: true,
    message: "Ticket fetched successfully.",
    data: formatTicketResponse(ticket),
  });
});

const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicket(
    req.params.ticketId,
    normalizeTicketInput(req.body),
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    message: "Ticket updated successfully.",
    data: formatTicketResponse(ticket),
  });
});

const deleteTicket = asyncHandler(async (req, res) => {
  await ticketService.deleteTicket(req.params.ticketId, req.user.userId);

  res.status(200).json({
    success: true,
    message: "Ticket deleted successfully.",
  });
});

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
};
