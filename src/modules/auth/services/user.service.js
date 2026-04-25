const bcrypt = require("bcrypt");
const AppError = require("../../../utils/app-error");
const userRepository = require("../repositories/user.repository");

const BCRYPT_ROUNDS = 10;

function toPublicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getAllUsers(filters = {}) {
  const result = await userRepository.findAll(filters);
  return {
    items: result.items.map(toPublicUser),
    pagination: result.pagination,
  };
}

async function getUserById(userId) {
  if (!userId) {
    throw new AppError("User ID is required.", 400);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return toPublicUser(user);
}

async function updateUser(userId, payload) {
  if (!userId) {
    throw new AppError("User ID is required.", 400);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const updates = {};

  if (payload.firstName !== undefined && payload.firstName !== null) {
    const firstName = String(payload.firstName).trim();
    if (!firstName) {
      throw new AppError("Field `firstName` cannot be empty.", 400);
    }
    if (firstName.length > 50) {
      throw new AppError(
        "Field `firstName` must not exceed 50 characters.",
        400,
      );
    }
    updates.firstName = firstName;
  }

  if (payload.lastName !== undefined && payload.lastName !== null) {
    const lastName = String(payload.lastName).trim();
    if (!lastName) {
      throw new AppError("Field `lastName` cannot be empty.", 400);
    }
    if (lastName.length > 50) {
      throw new AppError(
        "Field `lastName` must not exceed 50 characters.",
        400,
      );
    }
    updates.lastName = lastName;
  }

  if (payload.phone !== undefined && payload.phone !== null) {
    const phone = String(payload.phone)
      .trim()
      .replace(/[\s()-]/g, "");
    if (phone) {
      // Validate phone if provided
      const phoneRegex = /^\+?[1-9]\d{6,14}$/;
      if (!phoneRegex.test(phone)) {
        throw new AppError(
          "Field `phone` must be a valid phone number (7-15 digits, optional + prefix).",
          400,
        );
      }

      // Check if phone is already used by another user
      const existingUser = await userRepository.findByPhone(phone);
      if (existingUser && existingUser.id !== userId) {
        throw new AppError("Phone number is already in use.", 409);
      }
    }
    updates.phone = phone || null;
  }

  if (payload.password !== undefined && payload.password !== null) {
    const password = String(payload.password).trim();
    if (password.length < 6) {
      throw new AppError(
        "Field `password` must be at least 6 characters.",
        400,
      );
    }
    if (password.length > 128) {
      throw new AppError(
        "Field `password` must not exceed 128 characters.",
        400,
      );
    }
    updates.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("Provide at least one field to update.", 400);
  }

  const updatedUser = await userRepository.updateById(userId, updates);
  return toPublicUser(updatedUser);
}

async function deleteUser(userId) {
  if (!userId) {
    throw new AppError("User ID is required.", 400);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  await userRepository.deleteById(userId);
  return { message: "User deleted successfully." };
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
