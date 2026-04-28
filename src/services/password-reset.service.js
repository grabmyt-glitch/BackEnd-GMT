const cuid = require("cuid");
const config = require("../config/env");
const AppError = require("../utils/app-error");
const supabase = require("../config/supabase");

const TABLE_NAME = "password_resets";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createResetRecord(email, otp) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      id: cuid(),
      email,
      token: otp,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create reset record: ${error.message}`, 500);
  }

  return data;
}

async function getResetRecordByEmailAndOTP(email, otp) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("email", email)
    .eq("token", otp)
    .maybeSingle();

  if (error) {
    throw new AppError(`Failed to fetch reset record: ${error.message}`, 500);
  }

  return data;
}

async function deleteResetRecord(id) {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    throw new AppError(`Failed to delete reset record: ${error.message}`, 500);
  }
}

async function checkResetRecordExists(email) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new AppError(`Failed to check reset record: ${error.message}`, 500);
  }

  return data;
}

module.exports = {
  generateOTP,
  createResetRecord,
  getResetRecordByEmailAndOTP,
  deleteResetRecord,
  checkResetRecordExists,
};
