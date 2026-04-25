const supabase = require("../../../../config/supabase");
const AppError = require("../../../../utils/app-error");
const { toPersistence, toDomain } = require("./user.mapper");

const TABLE_NAME = process.env.SUPABASE_USERS_TABLE || "users";

async function create(user) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(toPersistence(user))
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return toDomain(data);
}

async function findByEmail(email) {
  if (!email) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return toDomain(data);
}

async function findByPhone(phone) {
  if (!phone) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return toDomain(data);
}

async function findByEmailOrPhone({ email, phone }) {
  if (email) {
    const byEmail = await findByEmail(email);
    if (byEmail) {
      return byEmail;
    }
  }

  if (phone) {
    return findByPhone(phone);
  }

  return null;
}

async function findById(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return toDomain(data);
}

async function findAll(filters = {}) {
  let query = supabase.from(TABLE_NAME).select("*");

  if (filters.search) {
    query = query.or(
      `firstName.ilike.%${filters.search}%,lastName.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`,
    );
  }

  const limit = Math.min(filters.limit || 20, 100);
  const offset = (filters.page || 1 - 1) * limit;

  query = query
    .order("createdAt", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError(error.message, 500);
  }

  return {
    items: data ? data.map(toDomain) : [],
    pagination: {
      page: filters.page || 1,
      limit,
      total: count || 0,
    },
  };
}

async function updateById(userId, updates) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(toPersistence(updates))
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return toDomain(data);
}

async function deleteById(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return toDomain(data);
}

module.exports = {
  create,
  findByEmail,
  findByPhone,
  findByEmailOrPhone,
  findById,
  findAll,
  updateById,
  deleteById,
};
