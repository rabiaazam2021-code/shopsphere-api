const Joi = require("joi");

const objectId = Joi.string()
  .hex()
  .length(24)
  .messages({
    "string.hex": "{{#label}} must be a valid id",
    "string.length": "{{#label}} must be a valid id",
  });

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(1000).allow(""),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).default(0),
  category: objectId.required(),
  images: Joi.array().items(Joi.string().uri()).default([]),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(1000).allow(""),
  price: Joi.number().min(0),
  stock: Joi.number().integer().min(0),
  category: objectId,
  images: Joi.array().items(Joi.string().uri()),
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update" });

module.exports = { createProductSchema, updateProductSchema };