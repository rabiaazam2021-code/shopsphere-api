const express = require("express");
const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validators/categoryValidator");

const router = express.Router();

// Public
router.get("/", getCategories);
router.get("/:id", getCategory);

// Admin only
router.post("/", protect, authorize("admin"), validate(createCategorySchema), createCategory);
router.put("/:id", protect, authorize("admin"), validate(updateCategorySchema), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;