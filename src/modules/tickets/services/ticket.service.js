const AppError = require("../../../utils/app-error");
const ticketRepository = require("../repositories/ticket.repository");
const {
  ALLOWED_TYPES,
  createTicketId,
  validateTicketPayload,
} = require("../models/ticket.model");

async function createTicket(payload, userId) {
  if (!userId) {
    throw new AppError("User ID is required to create a ticket.", 401);
  }

  const validated = validateTicketPayload(payload);
  return ticketRepository.create({
    id: createTicketId(),
    userId,
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

async function updateTicket(ticketId, payload, userId) {
  if (!userId) {
    throw new AppError("User ID is required to update a ticket.", 401);
  }

  const validated = validateTicketPayload(payload, { partial: true });
  if (Object.keys(validated).length === 0) {
    throw new AppError("Provide at least one field to update.", 400);
  }

  // Check if ticket exists and belongs to the user
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) {
    throw new AppError("Ticket not found.", 404);
  }

  if (ticket.userId !== userId) {
    throw new AppError("You can only update your own tickets.", 403);
  }

  const updatedTicket = await ticketRepository.updateById(ticketId, validated);
  if (!updatedTicket) {
    throw new AppError("Ticket not found.", 404);
  }

  return updatedTicket;
}

async function deleteTicket(ticketId, userId) {
  if (!userId) {
    throw new AppError("User ID is required to delete a ticket.", 401);
  }

  // Check if ticket exists and belongs to the user
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) {
    throw new AppError("Ticket not found.", 404);
  }

  if (ticket.userId !== userId) {
    throw new AppError("You can only delete your own tickets.", 403);
  }

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
