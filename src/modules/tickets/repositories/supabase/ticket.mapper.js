function toPersistence(ticket) {
  return {
    ticket_id: ticket.id,
    from_location: ticket.from,
    to_location: ticket.to,
    travel_date: ticket.date,
    place: ticket.place,
    price: ticket.price,
    ticket_type: ticket.type,
    start_time: ticket.startTime,
    end_time: ticket.endTime,
    personal_email: ticket.personalInformation.email,
    personal_phone: ticket.personalInformation.phone,
  };
}

function toDomain(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.ticket_id,
    from: row.from_location,
    to: row.to_location,
    date: row.travel_date,
    place: row.place,
    price: Number(row.price),
    type: row.ticket_type,
    startTime: row.start_time,
    endTime: row.end_time,
    personalInformation: {
      email: row.personal_email,
      phone: row.personal_phone,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  toPersistence,
  toDomain,
};
