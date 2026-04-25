const AppError = require("../../../utils/app-error");

// More robust email pattern - RFC 5322 simplified
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone pattern: optional +, country code optional, 7-15 digits total
const PHONE_PATTERN = /^\+?[1-9]\d{6,14}$/;

function sanitizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeEmail(value) {
  return sanitizeText(value).toLowerCase();
}

function normalizePhone(value) {
  return sanitizeText(value).replace(/[\s()-]/g, "");
}

function validateUserLookupPayload(payload) {
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const errors = [];

  if (!email && !phone) {
    errors.push("Provide either `email` or `phone`.");
  }

  if (email) {
    if (email.length < 5 || email.length > 254) {
      errors.push("Field `email` must be between 5 and 254 characters.");
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.push(
        "Field `email` must be a valid email (e.g., user@example.com).",
      );
    } else {
      const [localPart] = email.split("@");
      if (!localPart || localPart.length > 64) {
        errors.push("Field `email` local part must not exceed 64 characters.");
      }
    }
  }

  if (phone) {
    if (phone.length < 7 || phone.length > 15) {
      errors.push("Field `phone` must be between 7 and 15 digits.");
    } else if (!PHONE_PATTERN.test(phone)) {
      errors.push(
        "Field `phone` must be a valid phone number (7-15 digits, optional + prefix).",
      );
    }
  }

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, errors);
  }

  return {
    email: email || null,
    phone: phone || null,
  };
}

function validateSignupPayload(payload) {
  const firstName = sanitizeText(payload.firstName);
  const lastName = sanitizeText(payload.lastName);
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const password = sanitizeText(payload.password);
  const errors = [];

  if (!firstName) {
    errors.push("Field `firstName` is required.");
  } else if (firstName.length > 50) {
    errors.push("Field `firstName` must not exceed 50 characters.");
  }

  if (!lastName) {
    errors.push("Field `lastName` is required.");
  } else if (lastName.length > 50) {
    errors.push("Field `lastName` must not exceed 50 characters.");
  }

  if (!email && !phone) {
    errors.push("Provide either `email` or `phone` for signup.");
  }

  if (email) {
    if (email.length < 5 || email.length > 254) {
      errors.push("Field `email` must be between 5 and 254 characters.");
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.push(
        "Field `email` must be a valid email (e.g., user@example.com).",
      );
    } else {
      const [localPart] = email.split("@");
      if (!localPart || localPart.length > 64) {
        errors.push("Field `email` local part must not exceed 64 characters.");
      }
    }
  }

  if (phone) {
    if (phone.length < 7 || phone.length > 15) {
      errors.push("Field `phone` must be between 7 and 15 digits.");
    } else if (!PHONE_PATTERN.test(phone)) {
      errors.push(
        "Field `phone` must be a valid phone number (7-15 digits, optional + prefix).",
      );
    }
  }

  if (email && !password) {
    errors.push("Field `password` is required when using `email` signup.");
  }

  if (password && password.length < 6) {
    errors.push("Field `password` must be at least 6 characters.");
  } else if (password && password.length > 128) {
    errors.push("Field `password` must not exceed 128 characters.");
  }

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, errors);
  }

  return {
    firstName,
    lastName,
    email: email || null,
    phone: phone || null,
    password: password || null,
  };
}

function validateSigninPayload(payload) {
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const password = sanitizeText(payload.password);
  const errors = [];

  if (!email && !phone) {
    errors.push(
      "Provide either (`email` and `password`) or `phone` for signin.",
    );
  }

  if (email && phone) {
    errors.push("Provide only one login method: email/password or phone.");
  }

  if (email) {
    if (email.length < 5 || email.length > 254) {
      errors.push("Field `email` must be between 5 and 254 characters.");
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.push(
        "Field `email` must be a valid email (e.g., user@example.com).",
      );
    } else {
      const [localPart] = email.split("@");
      if (!localPart || localPart.length > 64) {
        errors.push("Field `email` local part must not exceed 64 characters.");
      }
    }
    if (!password) {
      errors.push("Field `password` is required for email signin.");
    }
  }

  if (phone) {
    if (phone.length < 7 || phone.length > 15) {
      errors.push("Field `phone` must be between 7 and 15 digits.");
    } else if (!PHONE_PATTERN.test(phone)) {
      errors.push(
        "Field `phone` must be a valid phone number (7-15 digits, optional + prefix).",
      );
    }
  }

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, errors);
  }

  return {
    email: email || null,
    phone: phone || null,
    password: password || null,
  };
}

module.exports = {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  normalizeEmail,
  normalizePhone,
  validateUserLookupPayload,
  validateSignupPayload,
  validateSigninPayload,
};
