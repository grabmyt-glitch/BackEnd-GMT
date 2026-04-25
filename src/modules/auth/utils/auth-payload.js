function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Check length constraints
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  // Check local part length (before @)
  const [localPart] = trimmed.split("@");
  if (!localPart || localPart.length > 64) return false;
  return emailRegex.test(trimmed);
}

function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.trim().replace(/[\s()-]/g, "");
  // Phone: optional +, then 7-15 digits
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(cleaned);
}

function normalizeInput(body = {}) {
  return {
    firstName: body.firstName ?? body.firstname ?? body.first_name ?? "",
    lastName: body.lastName ?? body.lastname ?? body.last_name ?? "",
    email: body.email ?? "",
    phone:
      body.phone ?? body.phoneNumber ?? body.mobile ?? body.mobileNumber ?? "",
    password: body.password ?? "",
  };
}

function normalizeUserLookupInput(body = {}) {
  const normalized = normalizeInput(body);
  return {
    email: normalized.email,
    phone: normalized.phone,
  };
}

function normalizeSignupInput(body = {}) {
  return normalizeInput(body);
}

function normalizeSigninInput(body = {}) {
  return normalizeInput(body);
}

function formatAuthUserResponse(user) {
  return user;
}

module.exports = {
  isValidEmail,
  isValidPhone,
  normalizeUserLookupInput,
  normalizeSignupInput,
  normalizeSigninInput,
  formatAuthUserResponse,
};
