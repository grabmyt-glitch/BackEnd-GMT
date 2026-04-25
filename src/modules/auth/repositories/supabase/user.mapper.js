function toPersistence(user) {
  return {
    user_id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    phone: user.phone,
    password_hash: user.passwordHash,
  };
}

function toDomain(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  toPersistence,
  toDomain,
};
