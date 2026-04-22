function pickFirstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function normalizePersonalInformation(body = {}) {
  const personalInformation = body.personalInformation || body.personal_information || {};

  return {
    email: pickFirstDefined(
      personalInformation.email,
      body.email,
      body.personalEmail,
      body.personal_email,
    ),
    phone: pickFirstDefined(
      personalInformation.phone,
      body.phone,
      body.personalPhone,
      body.personal_phone,
    ),
  };
}

function normalizeTicketInput(body = {}) {
  const personalInformation = normalizePersonalInformation(body);

  return {
    from: pickFirstDefined(body.from, body.fromLocation, body.from_location),
    to: pickFirstDefined(body.to, body.toLocation, body.to_location),
    date: pickFirstDefined(body.date, body.travelDate, body.travel_date),
    place: pickFirstDefined(body.place, body.location, body.venue),
    price: pickFirstDefined(body.price, body.amount),
    type: pickFirstDefined(body.type, body.ticketType, body.ticket_type),
    startTime: pickFirstDefined(body.startTime, body.starttime, body.start_time),
    endTime: pickFirstDefined(body.endTime, body.endtime, body.end_time),
    personalInformation,
  };
}

function normalizeTicketQuery(query = {}) {
  return {
    q: pickFirstDefined(query.q, query.search, query.keyword),
    type: pickFirstDefined(query.type, query.ticketType, query.ticket_type),
    from: pickFirstDefined(query.from, query.fromLocation, query.from_location),
    to: pickFirstDefined(query.to, query.toLocation, query.to_location),
    place: pickFirstDefined(query.place, query.location, query.venue),
    date: pickFirstDefined(query.date, query.travelDate, query.travel_date),
    startDate: pickFirstDefined(query.startDate, query.startdate, query.start_date),
    endDate: pickFirstDefined(query.endDate, query.enddate, query.end_date),
    minPrice: pickFirstDefined(query.minPrice, query.minprice, query.min_price),
    maxPrice: pickFirstDefined(query.maxPrice, query.maxprice, query.max_price),
    email: pickFirstDefined(query.email, query.personalEmail, query.personal_email),
    phone: pickFirstDefined(query.phone, query.personalPhone, query.personal_phone),
    page: pickFirstDefined(query.page, query.currentPage, query.current_page),
    limit: pickFirstDefined(query.limit, query.pageSize, query.page_size),
    sortBy: pickFirstDefined(query.sortBy, query.sortby, query.sort_by),
    sortOrder: pickFirstDefined(query.sortOrder, query.sortorder, query.sort_order),
  };
}

function formatTicketResponse(ticket) {
  if (!ticket) {
    return ticket;
  }

  return {
    id: ticket.id,
    from: ticket.from,
    to: ticket.to,
    date: ticket.date,
    place: ticket.place,
    price: ticket.price,
    type: ticket.type,
    startTime: ticket.startTime,
    endTime: ticket.endTime,
    personalInformation: {
      email: ticket.personalInformation?.email,
      phone: ticket.personalInformation?.phone,
    },
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

module.exports = {
  normalizeTicketInput,
  normalizeTicketQuery,
  formatTicketResponse,
};
