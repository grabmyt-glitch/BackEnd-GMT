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
const emailService = require("../../../services/email.service");
const emailVerificationService = require("../../../services/email-verification.service");
const passwordResetService = require("../../../services/password-reset.service");

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

  // Check if user already exists
  const existingUser = await userRepository.findByEmailOrPhone({
    email: validated.email,
    phone: validated.phone,
  });

  if (existingUser) {
    throw new AppError("User already exists.", 409);
  }

  // Check if there's already a pending verification for this email
  const existingVerification =
    await emailVerificationService.checkVerificationRecordExists(
      validated.email,
    );
  if (existingVerification) {
    throw new AppError(
      "A verification code has already been sent to this address. Please check your inbox.",
      409,
    );
  }

  const passwordHash = validated.password
    ? await hashPassword(validated.password)
    : null;

  // Generate 6-digit OTP
  const otp = emailVerificationService.generateOTP();

  // Store pending user data with OTP
  const userData = {
    firstName: validated.firstName,
    lastName: validated.lastName,
    email: validated.email,
    phone: validated.phone,
    passwordHash,
    sourceOfCreation: "grabbmytickets",
  };

  const verificationRecord =
    await emailVerificationService.createVerificationRecord(userData, otp);

  // Send verification email with OTP
  try {
    await emailService.sendVerificationEmail(
      validated.email,
      validated.firstName,
      otp,
    );
  } catch (error) {
    // If email fails to send, clean up the pending verification record so the user can try again
    await emailVerificationService
      .deleteVerificationRecord(verificationRecord.id)
      .catch(console.error);
    throw new AppError(
      "Failed to send verification email. Please try again.",
      500,
    );
  }

  return {
    success: true,
    message:
      "Signup successful. Please enter the 6-digit code sent to your email to activate your account.",
    data: {
      email: validated.email,
      firstName: validated.firstName,
    },
  };
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

async function verifyEmail(email, otp) {
  if (!email || !otp) {
    throw new AppError("Email and OTP are required.", 400);
  }

  // Find the pending verification record by email and OTP
  const verificationRecord =
    await emailVerificationService.getVerificationRecordByEmailAndOTP(
      email,
      otp,
    );
  if (!verificationRecord) {
    throw new AppError("Invalid or expired verification code.", 401);
  }

  // Check if token has expired
  if (new Date() > new Date(verificationRecord.expires_at)) {
    await emailVerificationService.deleteVerificationRecord(
      verificationRecord.id,
    );
    throw new AppError(
      "Verification code has expired. Please signup again.",
      401,
    );
  }

  // Create the actual user account
  const user = await userRepository.create({
    id: cuid(),
    firstName: verificationRecord.first_name,
    lastName: verificationRecord.last_name,
    email: verificationRecord.email,
    phone: verificationRecord.phone,
    passwordHash: verificationRecord.password_hash,
    sourceOfCreation: verificationRecord.source_of_creation,
  });

  // Delete the verification record
  await emailVerificationService.deleteVerificationRecord(
    verificationRecord.id,
  );

  // Send welcome email (non-blocking)
  emailService
    .sendWelcomeEmail(user.email, user.firstName)
    .catch(console.error);

  // Generate access token
  const accessToken = generateToken(user.id, user.email);
  return {
    success: true,
    message: "Email verified successfully. Your account is now active.",
    data: toPublicUser(user, accessToken),
  };
}

async function requestPasswordReset(email) {
  if (!email) {
    throw new AppError("Email is required.", 400);
  }

  // Find user (do not reveal existence in response)
  const user = await userRepository.findByEmail(email);

  // Generate OTP/token
  const otp = passwordResetService.generateOTP();

  // Create reset record
  const resetRecord = await passwordResetService.createResetRecord(email, otp);

  // Send password reset email (non-blocking for privacy, but handle errors)
  try {
    await emailService.sendPasswordResetEmail(
      email,
      user ? user.firstName : "",
      otp,
    );
  } catch (error) {
    await passwordResetService
      .deleteResetRecord(resetRecord.id)
      .catch(console.error);
    throw new AppError(
      "Failed to send password reset email. Please try again.",
      500,
    );
  }

  return {
    success: true,
    message:
      "If an account with that email exists, a password reset email has been sent.",
    token: otp,
    data: {
      email,
      firstName: user ? user.firstName : null,
    },
  };
}

async function resetPassword(email, otp, newPassword) {
  // If otp is null and caller intends to skip token verification (e.g. using a
  // short-lived JWT issued after verifying the reset token), allow direct update.
  if (!email || !newPassword) {
    throw new AppError("Email and new password are required.", 400);
  }

  // When otp is provided, verify the reset record.
  if (otp) {
    const resetRecord = await passwordResetService.getResetRecordByEmailAndOTP(
      email,
      otp,
    );

    if (!resetRecord) {
      throw new AppError("Invalid or expired password reset token.", 401);
    }

    if (new Date() > new Date(resetRecord.expires_at)) {
      await passwordResetService.deleteResetRecord(resetRecord.id);
      throw new AppError("Password reset token has expired.", 401);
    }

    // proceed to update
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updateById(user.id, { passwordHash });

    // Delete reset record
    await passwordResetService.deleteResetRecord(resetRecord.id);

    return {
      success: true,
      message: "Password has been reset successfully.",
    };
  }

  // No otp provided; caller should be authenticated via short-lived JWT.
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updateById(user.id, { passwordHash });

  return {
    success: true,
    message: "Password has been reset successfully.",
  };
}

async function verifyResetToken(email, otp) {
  if (!email || !otp) {
    throw new AppError("Email and token are required.", 400);
  }

  const resetRecord = await passwordResetService.getResetRecordByEmailAndOTP(
    email,
    otp,
  );

  if (!resetRecord) {
    throw new AppError("Invalid or expired password reset token.", 401);
  }

  if (new Date() > new Date(resetRecord.expires_at)) {
    await passwordResetService.deleteResetRecord(resetRecord.id);
    throw new AppError("Password reset token has expired.", 401);
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  // Delete the reset record (single-use) and generate a short-lived JWT
  await passwordResetService.deleteResetRecord(resetRecord.id);

  const tempToken = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwtSecret,
    {
      expiresIn: config.passwordResetJwtExpiry,
    },
  );

  return {
    success: true,
    token: tempToken,
    message:
      "Reset token verified. Use the returned token as Bearer to set a new password.",
  };
}

module.exports = {
  checkUserExists,
  signup,
  verifyEmail,
  signin,
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
};
