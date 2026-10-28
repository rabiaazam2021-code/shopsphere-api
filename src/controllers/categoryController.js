const Category = require("../models/Category");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/response");

// POST /api/categories  (admin)
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ name, description });
    return sendResponse(res, 201, "Category created successfully", { category });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories  (public)
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort("name");
    return sendResponse(res, 200, "Categories fetched successfully", {
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id  (public)
const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return sendResponse(res, 200, "Category fetched successfully", { category });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id  (admin)
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    if (req.body.name !== undefined) category.name = req.body.name;
    if (req.body.description !== undefined) category.description = req.body.description;

    await category.save();
    return sendResponse(res, 200, "Category updated successfully", { category });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id  (admin)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      throw new ApiError(
        409,
        `Cannot delete category: it has ${productCount} product(s). Delete or move them first`
      );
    }

    await category.deleteOne();
    return sendResponse(res, 200, "Category deleted successfully", null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};