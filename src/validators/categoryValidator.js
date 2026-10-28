const Joi = require("joi");

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  description: Joi.string().trim().max(500).allow(""),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  description: Joi.string().trim().max(500).allow(""),
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update" });

module.exports = { createCategorySchema, updateCategorySchema };