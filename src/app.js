const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const openapi = require("./docs/openapi");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShopSphere API is running",
    data: null,
  });
});

// API documentation (Swagger UI)
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: "ShopSphere API Docs",
    swaggerOptions: { persistAuthorization: true },
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errors: null,
    data: null,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;