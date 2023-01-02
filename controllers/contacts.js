const { Contact } = require("../models/contacts.js");

const { HttpError, ctrlWrapper } = require("../helpers");

const getAll = async (req, res) => {
  const { _id: owner } = req.user;
  const { page = 1, limit = 20, favorite } = req.query;
  const skip = (page - 1) * limit;
  const result = await Contact.find(
    favorite ? { owner, favorite } : { owner },
    "-createdAt -updatedAt",
    {
      skip,
      limit,
    }
  ).populate("owner", "email");
  if (!result) {
    throw HttpError(404);
  }
  res.json(result);
};

const getById = async (req, res) => {
  const result = await Contact.findById(req.params.id);
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json(result);
};

const addContact = async (req, res) => {
  const { _id: owner } = req.user;
  const result = await Contact.create({ ...req.body, owner });
  res.status(201).json(result);
};

const deleteContact = async (req, res) => {
  const _id = req.params.contactId;
  const owner = req.user._id;
  const removeContact = await Contact.findOneAndRemove({ _id, owner });
  if (!removeContact) {
    throw HttpError(404);
  }
  res.json(removeContact);
};

const updateContactById = async (req, res, next) => {
  const result = await Contact.findOneAndUpdate(
    {
      _id: req.params.id,
      owner: req.user._id,
    },
    req.body,
    {
      new: true,
    }
  );
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json(result);
};

const updateStatus = async (req, res) => {
  const _id = req.params.contactId;
  const owner = req.user._id;
  const data = req.body;
  const contact = await Contact.findOneAndUpdate({ _id, owner }, data, {
    new: true,
  });
  if (!contact) {
    throw HttpError(404);
  }
  res.json(contact);
};

module.exports = {
  getAll: ctrlWrapper(getAll),
  getById: ctrlWrapper(getById),
  addContact: ctrlWrapper(addContact),
  updateContactById: ctrlWrapper(updateContactById),
  updateStatus: ctrlWrapper(updateStatus),
  deleteContact: ctrlWrapper(deleteContact),
};
