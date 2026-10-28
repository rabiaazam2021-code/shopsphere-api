const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const ApiError = require("../utils/ApiError");
const sendResponse = require("../utils/response");

const ALLOWED_SORT_FIELDS = ["price", "name", "createdAt", "stock"];

// Makes user's search text safe to use inside a regex
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/products  (admin)
const createProduct = async (req, res, next) => {
  try {
    const categoryExists = await Category.exists({ _id: req.body.category });
    if (!categoryExists) {
      throw new ApiError(404, "Category not found");
    }

    const product = await Product.create(req.body);
    await product.populate("category", "name slug");

    return sendResponse(res, 201, "Product created successfully", { product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products  (public)
// ?page=1&limit=10&search=phone&category=ID&minPrice=100&maxPrice=5000&inStock=true&sort=-price
const getProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, inStock, sort } = req.query;

    // Pagination
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    // Filters
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ name: regex }, { description: regex }];
    }

    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        throw new ApiError(400, "Invalid category id");
      }
      filter.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        if (Number.isNaN(Number(minPrice))) {
          throw new ApiError(400, "minPrice must be a number");
        }
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        if (Number.isNaN(Number(maxPrice))) {
          throw new ApiError(400, "maxPrice must be a number");
        }
        filter.price.$lte = Number(maxPrice);
      }
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    // Sorting (e.g. sort=price or sort=-price)
    let sortBy = "-createdAt";
    if (sort) {
      const field = sort.startsWith("-") ? sort.slice(1) : sort;
      if (!ALLOWED_SORT_FIELDS.includes(field)) {
        throw new ApiError(
          400,
          `Invalid sort field. Allowed: ${ALLOWED_SORT_FIELDS.join(", ")}`
        );
      }
      sortBy = sort;
    }

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit);

    return sendResponse(res, 200, "Products fetched successfully", {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id  (public)
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug"
    );
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return sendResponse(res, 200, "Product fetched successfully", { product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id  (admin)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (req.body.category) {
      const categoryExists = await Category.exists({ _id: req.body.category });
      if (!categoryExists) {
        throw new ApiError(404, "Category not found");
      }
    }

    const fields = ["name", "description", "price", "stock", "category", "images"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    await product.populate("category", "name slug");

    return sendResponse(res, 200, "Product updated successfully", { product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id  (admin)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return sendResponse(res, 200, "Product deleted successfully", null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};