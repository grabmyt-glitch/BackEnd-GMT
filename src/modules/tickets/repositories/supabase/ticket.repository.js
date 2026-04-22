const supabase = require("../../../../config/supabase");
const AppError = require("../../../../utils/app-error");
const { toPersistence, toDomain } = require("./ticket.mapper");

const TABLE_NAME = process.env.SUPABASE_TICKETS_TABLE || "tickets";

function sanitizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeType(value) {
  return sanitizeText(value).toLowerCase();
}

function normalizeEmail(value) {
  return sanitizeText(value).toLowerCase();
}

function buildListQuery(filters) {
  let query = supabase.from(TABLE_NAME).select("*", { count: "exact" });
  const {
    q,
    type,
    from,
    to,
    place,
    date,
    startDate,
    endDate,
    minPrice,
    maxPrice,
    email,
    phone,
    limit = 10,
    page = 1,
    sortBy = "created_at",
    sortOrder = "desc",
  } = filters;

  if (q) {
    query = query.or(
      [
        `ticket_id.ilike.%${q}%`,
        `from_location.ilike.%${q}%`,
        `to_location.ilike.%${q}%`,
        `place.ilike.%${q}%`,
        `ticket_type.ilike.%${q}%`,
        `personal_email.ilike.%${q}%`,
        `personal_phone.ilike.%${q}%`,
      ].join(","),
    );
  }

  if (type) query = query.eq("ticket_type", normalizeType(type));
  if (from) query = query.ilike("from_location", `%${sanitizeText(from)}%`);
  if (to) query = query.ilike("to_location", `%${sanitizeText(to)}%`);
  if (place) query = query.ilike("place", `%${sanitizeText(place)}%`);
  if (date) query = query.eq("travel_date", sanitizeText(date));
  if (startDate) query = query.gte("travel_date", sanitizeText(startDate));
  if (endDate) query = query.lte("travel_date", sanitizeText(endDate));
  if (minPrice !== undefined) query = query.gte("price", Number(minPrice));
  if (maxPrice !== undefined) query = query.lte("price", Number(maxPrice));
  if (email) query = query.ilike("personal_email", `%${normalizeEmail(email)}%`);
  if (phone) query = query.ilike("personal_phone", `%${sanitizeText(phone)}%`);

  const sortableColumns = new Set([
    "created_at",
    "updated_at",
    "travel_date",
    "price",
    "start_time",
    "end_time",
    "place",
    "from_location",
    "to_location",
    "ticket_type",
  ]);

  const resolvedSortBy = sortableColumns.has(sortBy) ? sortBy : "created_at";
  const ascending = String(sortOrder).toLowerCase() === "asc";
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const fromRow = (safePage - 1) * safeLimit;
  const toRow = fromRow + safeLimit - 1;

  return {
    query: query.order(resolvedSortBy, { ascending }).range(fromRow, toRow),
    page: safePage,
    limit: safeLimit,
  };
}

async function create(ticket) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(toPersistence(ticket))
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return toDomain(data);
}

async function findAll(filters) {
  const { query, page, limit } = buildListQuery(filters);
  const { data, error, count } = await query;

  if (error) {
    throw new AppError(error.message, 500);
  }

  return {
    items: data.map(toDomain),
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  };
}

async function findById(ticketId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("ticket_id", ticketId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return toDomain(data);
}

async function updateById(ticketId, update) {
  const persistenceUpdate = {};

  if (update.from !== undefined) persistenceUpdate.from_location = update.from;
  if (update.to !== undefined) persistenceUpdate.to_location = update.to;
  if (update.date !== undefined) persistenceUpdate.travel_date = update.date;
  if (update.place !== undefined) persistenceUpdate.place = update.place;
  if (update.price !== undefined) persistenceUpdate.price = update.price;
  if (update.type !== undefined) persistenceUpdate.ticket_type = update.type;
  if (update.startTime !== undefined) persistenceUpdate.start_time = update.startTime;
  if (update.endTime !== undefined) persistenceUpdate.end_time = update.endTime;
  if (update.personalInformation?.email !== undefined) {
    persistenceUpdate.personal_email = update.personalInformation.email;
  }
  if (update.personalInformation?.phone !== undefined) {
    persistenceUpdate.personal_phone = update.personalInformation.phone;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(persistenceUpdate)
    .eq("ticket_id", ticketId)
    .select()
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return toDomain(data);
}

async function deleteById(ticketId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("ticket_id", ticketId)
    .select("ticket_id")
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

module.exports = {
  create,
  findAll,
  findById,
  updateById,
  deleteById,
};
