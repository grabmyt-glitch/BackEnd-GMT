const asyncHandler = require("../../../utils/async-handler");
const authService = require("../services/auth.service");
const {
  normalizeUserLookupInput,
  normalizeSignupInput,
  normalizeSigninInput,
  formatAuthUserResponse,
} = require("../utils/auth-payload");

const checkUserExists = asyncHandler(async (req, res) => {
  const result = await authService.checkUserExists(normalizeUserLookupInput(req.body));

  res.status(200).json({
    success: true,
    message: result.exists ? "User already exists." : "User does not exist.",
    data: result,
  });
});

const signup = asyncHandler(async (req, res) => {
  const user = await authService.signup(normalizeSignupInput(req.body));

  res.status(201).json({
    success: true,
    message: "Signup successful.",
    data: formatAuthUserResponse(user),
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
  signin,
};
