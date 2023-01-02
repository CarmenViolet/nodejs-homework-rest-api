const fs = require("fs/promises");
const path = require("path");
const Jimp = require("jimp");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
require("dotenv").config();
const { SECRET_KEY } = process.env;

const { User } = require("../models/users");
const { HttpError, ctrlWrapper } = require("../helpers/index");

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
  });
  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  const comparedPassword = await bcrypt.compare(password, user.password);

  if (!comparedPassword) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "13h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
    user: { email: user.email, subscription: user.subscription },
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
  };
