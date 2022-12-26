const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/contacts");
const { validateBody } = require("../../middlewares");
const { schemas } = require("../../models/contact");

router.get("/", ctrl.getAll);

router.get("/:id", ctrl.getById);

router.post("/", validateBody(schemas.addSchema), ctrl.add);

router.put("/:id", validateBody(schemas.addSchema), ctrl.updateById);

router.patch(
  "/:id/favorite",
  validateBody(schemas.favoriteSchema),
  ctrl.updateFavorite
);

router.delete("/:id", ctrl.deleteById);

module.exports = router;
