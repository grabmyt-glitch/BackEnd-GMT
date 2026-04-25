const cuid = require("cuid");
const config = require("../config/env");
const AppError = require("../utils/app-error");
const supabase = require("../config/supabase");

const TABLE_NAME = "email_verifications";

/**
 * Generates a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createVerificationRecord(userData, otp) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      id: cuid(),
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone || null,
      password_hash: userData.passwordHash,
      token: otp, // Storing OTP in the token column
      source_of_creation: userData.sourceOfCreation,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    })
    .select()
    .single();

  if (error) {
    throw new AppError(
      `Failed to create verification record: ${error.message}`,
      500,
    );
  }

  return data;
}

async function getVerificationRecordByEmailAndOTP(email, otp) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("email", email)
    .eq("token", otp) // Searching by OTP
    .maybeSingle();

  if (error) {
    throw new AppError(
      `Failed to fetch verification record: ${error.message}`,
      500,
    );
  }

  return data;
}

async function deleteVerificationRecord(id) {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    throw new AppError(
      `Failed to delete verification record: ${error.message}`,
      500,
    );
  }
}

async function checkVerificationRecordExists(email) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new AppError(
      `Failed to check verification record: ${error.message}`,
      500,
    );
  }

  return data;
}

module.exports = {
  generateOTP,
  createVerificationRecord,
  getVerificationRecordByEmailAndOTP,
  deleteVerificationRecord,
  checkVerificationRecordExists,
};
