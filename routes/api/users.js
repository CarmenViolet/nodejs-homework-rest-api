const express = require("express");
const router = express.Router();
const { schemas } = require("../../models/users");
const { validateBody, authenticate } = require("../../middlewares");
const ctrl = require("../../controllers/users");

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

module.exports = router;
