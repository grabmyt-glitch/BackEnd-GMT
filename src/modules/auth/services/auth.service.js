const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cuid = require("cuid");

const AppError = require("../../../utils/app-error");
const config = require("../../../config/env");
const {
  validateUserLookupPayload,
  validateSignupPayload,
  validateSigninPayload,
} = require("../models/auth.model");
const userRepository = require("../repositories/user.repository");

const BCRYPT_ROUNDS = 10;

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, encodedHash) {
  if (!encodedHash) {
    return false;
  }
  return bcrypt.compare(password, encodedHash);
}

function generateToken(userId, email) {
  return jwt.sign({ userId, email }, config.jwtSecret, {
    expiresIn: config.jwtExpiry,
  });
}

function toPublicUser(user, token = null) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    ...(token && { accessToken: token }),
  };
}

async function checkUserExists(payload) {
  const validated = validateUserLookupPayload(payload);
  const existingUser = await userRepository.findByEmailOrPhone(validated);

  return {
    exists: Boolean(existingUser),
    user: existingUser ? toPublicUser(existingUser) : null,
  };
}

async function signup(payload) {
  const validated = validateSignupPayload(payload);

  const existingUser = await userRepository.findByEmailOrPhone({
    email: validated.email,
    phone: validated.phone,
  });

  if (existingUser) {
    throw new AppError("User already exists.", 409);
  }

  const passwordHash = validated.password
    ? await hashPassword(validated.password)
    : null;

  const user = await userRepository.create({
    id: cuid(),
    firstName: validated.firstName,
    lastName: validated.lastName,
    email: validated.email,
    phone: validated.phone,
    passwordHash,
  });

  const token = generateToken(user.id, user.email);
  return toPublicUser(user, token);
}

async function signin(payload) {
  const validated = validateSigninPayload(payload);
  let user = null;

  if (validated.phone) {
    user = await userRepository.findByPhone(validated.phone);
    if (!user) {
      throw new AppError("Invalid phone number.", 401);
    }
    const token = generateToken(user.id, user.email);
    return toPublicUser(user, token);
  }

  user = await userRepository.findByEmail(validated.email);
  if (
    !user ||
    !user.passwordHash ||
    !(await verifyPassword(validated.password, user.passwordHash))
  ) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = generateToken(user.id, user.email);
  return toPublicUser(user, token);
}

module.exports = {
  checkUserExists,
  signup,
  signin,
};
