const AppError = require("../../../utils/app-error");
const ticketRepository = require("../repositories/ticket.repository");
const { ALLOWED_TYPES, createTicketId, validateTicketPayload } = require("../models/ticket.model");

async function createTicket(payload) {
  const validated = validateTicketPayload(payload);
  return ticketRepository.create({
    id: createTicketId(),
    ...validated,
  });
}

async function listTickets(filters) {
  return ticketRepository.findAll(filters);
}

async function getTicketById(ticketId) {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) {
    throw new AppError("Ticket not found.", 404);
  }

  return ticket;
}

async function updateTicket(ticketId, payload) {
  const validated = validateTicketPayload(payload, { partial: true });
  if (Object.keys(validated).length === 0) {
    throw new AppError("Provide at least one field to update.", 400);
  }

  const updatedTicket = await ticketRepository.updateById(ticketId, validated);
  if (!updatedTicket) {
    throw new AppError("Ticket not found.", 404);
  }

  return updatedTicket;
}

async function deleteTicket(ticketId) {
  const deletedTicket = await ticketRepository.deleteById(ticketId);
  if (!deletedTicket) {
    throw new AppError("Ticket not found.", 404);
  }

  return deletedTicket;
}

module.exports = {
  ALLOWED_TYPES,
  createTicket,
  listTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
};
