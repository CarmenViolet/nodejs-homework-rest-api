const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/contacts");
const { validateBody, authenticate } = require("../../middlewares");
const { schemas } = require("../../models/contact");

router.get("/", authenticate, ctrl.getAll);

router.get("/:id", authenticate, ctrl.getById);

router.post("/", authenticate, validateBody(schemas.addSchema), ctrl.addContact);

router.put(
  "/:id",
  authenticate,
  validateBody(schemas.updateContactSchema),
  ctrl.updateContactById
);

router.patch(
  "/:id/favorite",
  authenticate,
  validateBody(schemas.updateStatusContactSchema),
  ctrl.updateStatus
);

router.delete("/:id", authenticate, ctrl.deleteContact);

module.exports = router;