const asyncHandler = require("../../../utils/async-handler");
const authService = require("../services/auth.service");
const {
  normalizeUserLookupInput,
  normalizeSignupInput,
  normalizeSigninInput,
  formatAuthUserResponse,
} = require("../utils/auth-payload");

const checkUserExists = asyncHandler(async (req, res) => {
  const result = await authService.checkUserExists(
    normalizeUserLookupInput(req.body),
  );

  res.status(200).json({
    success: true,
    message: result.exists ? "User already exists." : "User does not exist.",
    data: result,
  });
});

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(normalizeSignupInput(req.body));

  res.status(201).json({
    success: result.success,
    message: result.message,
    data: formatAuthUserResponse(result.data),
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required.",
      errors: [!email ? "email is missing" : "otp is missing"],
    });
  }

  const result = await authService.verifyEmail(email, otp);

  res.status(200).json({
    success: result.success,
    message: result.message,
    data: formatAuthUserResponse(result.data),
  });
});

const signin = asyncHandler(async (req, res) => {
  const user = await authService.signin(normalizeSigninInput(req.body));

  res.status(200).json({
    success: true,
    message: "Signin successful.",
    data: formatAuthUserResponse(user),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  const result = await authService.requestPasswordReset(email);
  res.status(200).json({
    success: result.success,
    message: result.message,
    ...(result.token && { token: result.token }),
    ...(result.data && { data: result.data }),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, token: bodyToken, newPassword } = req.body;

  const authHeader = req.headers && req.headers.authorization;
  const bearer =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  // If bearer looks like a JWT (signed token), try to verify and use it
  let jwtEmail = null;
  if (bearer) {
    try {
      const decoded = require("jsonwebtoken").verify(
        bearer,
        require("../../../config/env").jwtSecret,
      );
      jwtEmail = decoded && decoded.email;
    } catch (err) {
      // ignore - will fallback to OTP flow
    }
  }

  // Determine which email to use
  const targetEmail = jwtEmail || email;
  const tokenToUse = jwtEmail ? null : bodyToken || bearer;

  if (!targetEmail || !newPassword || (!tokenToUse && !jwtEmail)) {
    return res.status(400).json({
      success: false,
      message:
        "Email and newPassword are required. Provide token in body or Authorization header, or use the verification flow to obtain a temporary Bearer token.",
    });
  }

  const result = await authService.resetPassword(
    targetEmail,
    tokenToUse,
    newPassword,
  );
  res.status(200).json({ success: result.success, message: result.message });
});

const verifyResetToken = asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) {
    return res
      .status(400)
      .json({ success: false, message: "Email and token are required." });
  }

  const result = await authService.verifyResetToken(email, token);
  res.status(200).json({
    success: result.success,
    message: result.message,
    token: result.token,
  });
});

module.exports = {
  checkUserExists,
  signup,
  verifyEmail,
  signin,
  forgotPassword,
  resetPassword,
  verifyResetToken,
};
