const express = require("express");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validators/productValidator");

const router = express.Router();

// Public
router.get("/", getProducts);
router.get("/:id", getProduct);

// Admin only
router.post("/", protect, authorize("admin"), validate(createProductSchema), createProduct);
router.put("/:id", protect, authorize("admin"), validate(updateProductSchema), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;