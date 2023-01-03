const fs = require("fs/promises");
const path = require("path");
const Jimp = require("jimp");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
require("dotenv").config();
const { nanoid } = require("nanoid");

const { SECRET_KEY } = process.env;

const { User } = require("../models/users");
const { HttpError, ctrlWrapper, sendEmail } = require("../helpers/index");

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);

  const verificationToken = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  const verifyEmail = {
    to: email,
    subject: "Verify your email",
    html: `<a target="_blank" href="http://localhost:3000/api/auth/users/verify/${verificationToken}">Click verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });

  res.status(200).json({
    message: "Verification successful",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw HttpError(400, "Missing required field email");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404, "User is not found");
  }
  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify your email",
    html: `<a target="_blank" href="http://localhost:3000/api/auth/users/verify/${user.verificationToken}">Click verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(200).json({
    message: "Verification email sent",
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  if (!user.verify) {
    throw HttpError(400, "Email not verify");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password invalid");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).end();
};

const getCurrentUser = (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

const updateSubscription = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, req.body);
  res.json(`your subscription has been updated to ${req.body.subscription}`);
};

const updateAvatar = async (req, res) => {
  const avatarsDir = path.join(__dirname, "../", "public", "avatars");
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const avatarImg = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsDir, avatarImg);

  await fs.rename(tempUpload, resultUpload);
  const avatarURL = path.join("avatars", avatarImg);

  await User.findByIdAndUpdate(_id, { avatarURL });

  const image = await Jimp.read(resultUpload);
  await image.resize(250, 250);
  await image.writeAsync(resultUpload);
  res.json({ avatarURL });
};

module.exports = {
  signup: ctrlWrapper(signup),
  login: ctrlWrapper(login),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  logout: ctrlWrapper(logout),
  updateSubscription: ctrlWrapper(updateSubscription),
  updateAvatar: ctrlWrapper(updateAvatar),
  verify: ctrlWrapper(verify),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
};
