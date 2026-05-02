const cuid = require("cuid");

const AppError = require("../../../utils/app-error");

const ALLOWED_TYPES = ["bus", "train", "flight", "event", "concert", "movie"];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function validateTicketPayload(payload, { partial = false } = {}) {
  const errors = [];
  const normalized = {};
  const personalInformation = payload.personalInformation || {};
  const hasEmailField =
    Object.prototype.hasOwnProperty.call(personalInformation, "email") ||
    Object.prototype.hasOwnProperty.call(payload, "email");
  const hasPhoneField =
    Object.prototype.hasOwnProperty.call(personalInformation, "phone") ||
    Object.prototype.hasOwnProperty.call(payload, "phone");

  const fields = {
    from: sanitizeText(payload.from),
    to: sanitizeText(payload.to),
    date: sanitizeText(payload.date),
    place: sanitizeText(payload.place),
    type: normalizeType(payload.type),
    startTime: sanitizeText(payload.startTime),
    endTime: sanitizeText(payload.endTime),
    email: normalizeEmail(personalInformation.email ?? payload.email),
    phone: sanitizeText(personalInformation.phone ?? payload.phone),
  };

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "from")) {
    if (!fields.from) errors.push("Field `from` is required.");
    normalized.from = fields.from;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "to")) {
    if (!fields.to) errors.push("Field `to` is required.");
    normalized.to = fields.to;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "date")) {
    if (!DATE_PATTERN.test(fields.date)) {
      errors.push("Field `date` must be in YYYY-MM-DD format.");
    }
    normalized.date = fields.date;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "place")) {
    if (!fields.place) errors.push("Field `place` is required.");
    normalized.place = fields.place;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "price")) {
    const price = Number(payload.price);
    if (Number.isNaN(price) || price < 0) {
      errors.push("Field `price` must be a valid positive number or 0.");
    }
    normalized.price = price;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "type")) {
    if (!ALLOWED_TYPES.includes(fields.type)) {
      errors.push(`Field \`type\` must be one of: ${ALLOWED_TYPES.join(", ")}.`);
    }
    normalized.type = fields.type;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "startTime")) {
    if (!TIME_PATTERN.test(fields.startTime)) {
      errors.push("Field `startTime` must be in HH:MM or HH:MM:SS format.");
    }
    normalized.startTime = fields.startTime;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "endTime")) {
    if (!TIME_PATTERN.test(fields.endTime)) {
      errors.push("Field `endTime` must be in HH:MM or HH:MM:SS format.");
    }
    normalized.endTime = fields.endTime;
  }

  const hasPersonalInformation =
    Object.prototype.hasOwnProperty.call(payload, "personalInformation") ||
    hasEmailField ||
    hasPhoneField ||
    !partial;

  if (hasPersonalInformation) {
    const hasAnyContact = Boolean(fields.email) || Boolean(fields.phone);
    if (!partial && !hasAnyContact) {
      errors.push(
        "Provide at least one contact field: `personalInformation.email` or `personalInformation.phone`.",
      );
    }

    if (hasEmailField && fields.email && !/^\S+@\S+\.\S+$/.test(fields.email)) {
      errors.push("Field `personalInformation.email` must be a valid email.");
    }

    if (hasPhoneField && !fields.phone) {
      errors.push("Field `personalInformation.phone` cannot be empty.");
    }

    normalized.personalInformation = {};

    if (!partial || hasEmailField) {
      normalized.personalInformation.email = fields.email;
    }

    if (!partial || hasPhoneField) {
      normalized.personalInformation.phone = fields.phone;
    }
  }

  if (normalized.startTime && normalized.endTime && normalized.startTime >= normalized.endTime) {
    errors.push("Field `endTime` must be greater than `startTime`.");
  }

  if (errors.length > 0) {
    throw new AppError("Validation failed.", 400, errors);
  }

  return normalized;
}

function createTicketId() {
  return cuid();
}

module.exports = {
  ALLOWED_TYPES,
  createTicketId,
  validateTicketPayload,
};
