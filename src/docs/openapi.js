const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "MongoDB ObjectId (24 hex characters)",
  schema: { type: "string", example: "6ae10df5225ee2f6b42baa9f" },
};

const secured = [{ bearerAuth: [] }];

const ref = (name) => ({ $ref: `#/components/responses/${name}` });

const json = (schemaName) => ({
  "application/json": { schema: { $ref: `#/components/schemas/${schemaName}` } },
});

const envelope = (description, dataSchema) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: dataSchema,
        },
      },
    },
  },
});

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "ShopSphere API",
    version: "1.0.0",
    description:
      "REST API for a small online store: users, products and categories. Built with Node.js, Express and MongoDB.\n\n" +
      "**How to test protected routes:** call `POST /api/auth/login`, copy the token, click the **Authorize** button and paste it.\n\n" +
      "Every response uses the format `{ success, message, data }`. Errors also include `errors`.",
  },
  servers: [{ url: "http://localhost:5000", description: "Local server" }],
  tags: [
    { name: "Auth", description: "Register, login and profile" },
    { name: "Categories", description: "Product categories (create, update and delete are admin only)" },
    { name: "Products", description: "Products with pagination, search, filter and sort (create, update and delete are admin only)" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new customer",
        requestBody: { required: true, content: json("RegisterInput") },
        responses: {
          201: envelope("User registered successfully", {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/User" },
              token: { type: "string" },
            },
          }),
          400: ref("ValidationError"),
          409: ref("Conflict"),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and get a JWT token",
        requestBody: { required: true, content: json("LoginInput") },
        responses: {
          200: envelope("Login successful", {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/User" },
              token: { type: "string" },
            },
          }),
          400: ref("ValidationError"),
          401: ref("Unauthorized"),
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the logged-in user's profile",
        security: secured,
        responses: {
          200: envelope("Profile fetched successfully", {
            type: "object",
            properties: { user: { $ref: "#/components/schemas/User" } },
          }),
          401: ref("Unauthorized"),
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all categories",
        responses: {
          200: envelope("Categories fetched successfully", {
            type: "object",
            properties: {
              count: { type: "integer", example: 2 },
              categories: {
                type: "array",
                items: { $ref: "#/components/schemas/Category" },
              },
            },
          }),
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create a category (admin)",
        security: secured,
        requestBody: { required: true, content: json("CategoryInput") },
        responses: {
          201: envelope("Category created successfully", {
            type: "object",
            properties: { category: { $ref: "#/components/schemas/Category" } },
          }),
          400: ref("ValidationError"),
          401: ref("Unauthorized"),
          403: ref("Forbidden"),
          409: ref("Conflict"),
        },
      },
    },
    "/api/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get one category",
        parameters: [idParam],
        responses: {
          200: envelope("Category fetched successfully", {
            type: "object",
            properties: { category: { $ref: "#/components/schemas/Category" } },
          }),
          400: ref("ValidationError"),
          404: ref("NotFound"),
        },
      },
      put: {
        tags: ["Categories"],
        summary: "Update a category (admin)",
        security: secured,
        parameters: [idParam],
        requestBody: { required: true, content: json("CategoryUpdate") },
        responses: {
          200: envelope("Category updated successfully", {
            type: "object",
            properties: { category: { $ref: "#/components/schemas/Category" } },
          }),
          400: ref("ValidationError"),
          401: ref("Unauthorized"),
          403: ref("Forbidden"),
          404: ref("NotFound"),
          409: ref("Conflict"),
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete a category (admin). Fails if it still has products",
        security: secured,
        parameters: [idParam],
        responses: {
          200: envelope("Category deleted successfully", { nullable: true, example: null }),
          400: ref("ValidationError"),
          401: ref("Unauthorized"),
          403: ref("Forbidden"),
          404: ref("NotFound"),
          409: ref("Conflict"),
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List products with pagination, search, filter and sort",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
          { name: "limit", in: "query", description: "Items per page (max 50)", schema: { type: "integer", default: 10, maximum: 50 } },
          { name: "search", in: "query", description: "Searches in name and description", schema: { type: "string", example: "phone" } },
          { name: "category", in: "query", description: "Category id", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number", example: 100 } },
          { name: "maxPrice", in: "query", schema: { type: "number", example: 1000 } },
          { name: "inStock", in: "query", description: "Only products with stock above 0", schema: { type: "boolean" } },
          {
            name: "sort",
            in: "query",
            description: "Field name, add - for descending. Allowed fields: price, name, createdAt, stock",
            schema: { type: "string", example: "-price" },
          },
        ],
        responses: {
          200: envelope("Products fetched successfully", {
            type: "object",
            properties: {
              products: {
                type: "array",
                items: { $ref: "#/components/schemas/Product" },
              },
              pagination: { $ref: "#/components/schemas/Pagination" },
            },
          }),
          400: ref("ValidationError"),
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create a product (admin)",
        security: secured,
        requestBody: { required: true, content: json("ProductInput") },
        responses: {
          201: envelope("Product created successfully", {
            type: "object",
            properties: { product: { $ref: "#/components/schemas/Product" } },
          }),
          400: ref("ValidationError"),
          401: ref("Unauthorized"),
          403: ref("Forbidden"),
          404: ref("NotFound"),
        },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get one product",
        parameters: [idParam],
        responses: {
          200: envelope("Product fetched successfully", {
            type: "object",
            properties: { product: { $ref: "#/components/schemas/Product" } },
          }),
          400: ref("ValidationError"),
          404: ref("NotFound"),
        },
      },
      put: {
        tags: ["Products"],
        summary: "Update a product (admin)",
        security: secured,
        parameters: [idParam],
        requestBody: { required: true, content: json("ProductUpdate") },
        responses: {
          200: envelope("Product updated successfully", {
            type: "object",
            properties: { product: { $ref: "#/components/schemas/Product" } },
          }),
          400: ref("ValidationError"),
          401: ref("Unauthorized"),
          403: ref("Forbidden"),
          404: ref("NotFound"),
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Delete a product (admin)",
        security: secured,
        parameters: [idParam],
        responses: {
          200: envelope("Product deleted successfully", { nullable: true, example: null }),
          400: ref("ValidationError"),
          401: ref("Unauthorized"),
          403: ref("Forbidden"),
          404: ref("NotFound"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6adfd81d830e37cead43573a" },
          name: { type: "string", example: "Rabia" },
          email: { type: "string", example: "rabia@test.com" },
          role: { type: "string", enum: ["customer", "admin"], example: "customer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6ae10df5225ee2f6b42baa9f" },
          name: { type: "string", example: "Electronics" },
          slug: { type: "string", example: "electronics" },
          description: { type: "string", example: "Phones, laptops and gadgets" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6ae112b746354419aed0840d" },
          name: { type: "string", example: "iPhone 15" },
          slug: { type: "string", example: "iphone-15" },
          description: { type: "string", example: "Latest Apple smartphone" },
          price: { type: "number", example: 999 },
          stock: { type: "integer", example: 10 },
          category: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string", example: "Electronics" },
              slug: { type: "string", example: "electronics" },
            },
          },
          images: {
            type: "array",
            items: { type: "string", example: "https://example.com/iphone15.jpg" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer", example: 5 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          totalPages: { type: "integer", example: 1 },
          hasNextPage: { type: "boolean", example: false },
          hasPrevPage: { type: "boolean", example: false },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50, example: "Rabia" },
          email: { type: "string", format: "email", example: "rabia@test.com" },
          password: { type: "string", minLength: 6, example: "123456" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "rabia@test.com" },
          password: { type: "string", example: "123456" },
        },
      },
      CategoryInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50, example: "Electronics" },
          description: { type: "string", maxLength: 500, example: "Phones, laptops and gadgets" },
        },
      },
      CategoryUpdate: {
        type: "object",
        description: "Send at least one field",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50 },
          description: { type: "string", maxLength: 500 },
        },
      },
      ProductInput: {
        type: "object",
        required: ["name", "price", "category"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100, example: "iPhone 15" },
          description: { type: "string", maxLength: 1000, example: "Latest Apple smartphone" },
          price: { type: "number", minimum: 0, example: 999 },
          stock: { type: "integer", minimum: 0, example: 10 },
          category: { type: "string", description: "Category id", example: "6ae10df5225ee2f6b42baa9f" },
          images: {
            type: "array",
            items: { type: "string", format: "uri", example: "https://example.com/iphone15.jpg" },
          },
        },
      },
      ProductUpdate: {
        type: "object",
        description: "Send at least one field",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          description: { type: "string", maxLength: 1000 },
          price: { type: "number", minimum: 0 },
          stock: { type: "integer", minimum: 0 },
          category: { type: "string" },
          images: { type: "array", items: { type: "string", format: "uri" } },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            nullable: true,
            items: { type: "string", example: "name is required" },
          },
          data: { nullable: true, example: null },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Bad request: invalid data, invalid id or invalid query",
        content: json("Error"),
      },
      Unauthorized: {
        description: "Missing, invalid or expired token, or wrong email/password",
        content: json("Error"),
      },
      Forbidden: {
        description: "Logged in, but not an admin",
        content: json("Error"),
      },
      NotFound: {
        description: "Resource not found",
        content: json("Error"),
      },
      Conflict: {
        description: "Duplicate value or category still has products",
        content: json("Error"),
      },
    },
  },
};

module.exports = openapi;