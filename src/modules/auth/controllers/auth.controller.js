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

module.exports = {
  checkUserExists,
  signup,
  verifyEmail,
  signin,
};
