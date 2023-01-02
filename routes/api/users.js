const express = require("express");
const ctrl = require("../../controllers/users");
const { validateBody, authenticate, upload } = require("../../middlewares");
const { schemas } = require("../../models/user");

const router = express.Router();

router.post("/users/signup", validateBody(schemas.signupSchema), ctrl.signup);
router.post("/users/login", validateBody(schemas.loginSchema), ctrl.login);
router.get("/users/current", authenticate, ctrl.getCurrentUser);
router.get("/users/logout", authenticate, ctrl.logout);
router.patch(
  "/users",
  authenticate,
  validateBody(schemas.updateSubscriptionSchema),
  ctrl.updateSubscription
);
router.patch(
  "/users/avatars",
  authenticate,
  upload.single("avatar"),
  ctrl.updateAvatar
);

module.exports = router;