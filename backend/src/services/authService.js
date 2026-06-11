const User = require('../models/User');
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const { generateAccessAndRefreshTokens } = require('../utils/generateTokens');
const { ERROR_CODES } = require('../utils/constants');

const registerUser = async ({ name, email, password }) => {
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new ApiError(400, 'User already exists');
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshTokens;

  return { user: userResponse, accessToken, refreshToken };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password', [], true, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshTokens;

  return { user: userResponse, accessToken, refreshToken };
};

const logoutUser = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (!user) return;

  user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
  await user.save({ validateBeforeSave: false });
};

const logoutAllDevices = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });
};

const updateProfile = async (userId, { name, avatar }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name) user.name = name;
  if (avatar) user.avatar = avatar;

  await user.save({ validateBeforeSave: false });

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshTokens;

  return userResponse;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new ApiError(400, 'Invalid current password', [], true, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save({ validateBeforeSave: false });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  logoutAllDevices,
  updateProfile,
  changePassword
};
