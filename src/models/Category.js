const mongoose = require("mongoose");
const slugify = require("../utils/slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [50, "Category name must be at most 50 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description must be at most 500 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name
categorySchema.pre("validate", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name);
  }
});

categorySchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Category", categorySchema);