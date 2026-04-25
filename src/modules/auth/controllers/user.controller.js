const asyncHandler = require("../../../utils/async-handler");
const userService = require("../services/user.service");

const getAllUsers = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page ? parseInt(req.query.page) : 1,
    limit: req.query.limit ? parseInt(req.query.limit) : 20,
    search: req.query.search || null,
  };

  const result = await userService.getAllUsers(filters);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully.",
    data: result.items,
    pagination: result.pagination,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);

  res.status(200).json({
    success: true,
    message: "User fetched successfully.",
    data: user,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.userId, req.body);

  res.status(200).json({
    success: true,
    message: "User updated successfully.",
    data: user,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.userId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
