const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const normalizeSegment = (segment = "") => segment.replace(/^\/+|\/+$/g, "");

const joinPaths = (basePath, routePath) => {
  const base = normalizeSegment(basePath);
  const route = normalizeSegment(routePath);

  if (!base && !route) return "/";
  if (!base) return `/${route}`;
  if (!route) return `/${base}`;

  return `/${base}/${route}`;
};

const ensureOpenApiPathParams = (pathKey) =>
  pathKey.replace(/:([A-Za-z0-9_]+)/g, "{$1}");

const extractPathParams = (pathKey) => {
  const params = [];
  const paramMatches = pathKey.matchAll(/\{([A-Za-z0-9_]+)\}/g);
  for (const match of paramMatches) {
    params.push({
      name: match[1],
      in: "path",
      required: true,
      schema: { type: "string" },
    });
  }
  return params;
};

const AUTH_FREE_OPERATIONS = new Set([
  "post /api/signup",
  "post /api/login",
  "post /api/login/2fa/verify",
  "post /api/login/2fa/resend",
  "post /api/email-otp/send",
  "post /api/email-otp/verify",
  "post /api/reset-password",
  "get /api/session",
  "get /api-docs",
  "get /api-docs.json",
]);

const requiresCookieAuth = (method, pathKey) => {
  const operationKey = `${method.toLowerCase()} ${pathKey}`;
  if (AUTH_FREE_OPERATIONS.has(operationKey)) return false;
  return pathKey.startsWith("/api");
};

const routeTagFromPath = (pathKey) => {
  const parts = pathKey.split("/").filter(Boolean);
  if (!parts.length) return "general";
  if (parts[0] !== "api") return parts[0];
  if (parts[1] === "payment") return "payment";
  if (parts[1] === "complaints") return "complaints";
  if (parts[1]) return parts[1];
  return "api";
};

const buildOperation = (method, pathKey) => {
  const params = extractPathParams(pathKey);
  const operation = {
    tags: [routeTagFromPath(pathKey)],
    summary: `${method.toUpperCase()} ${pathKey}`,
    parameters: params,
    responses: {
      200: { description: "Success" },
      400: { description: "Bad request" },
      401: { description: "Unauthorized" },
      404: { description: "Not found" },
      500: { description: "Server error" },
    },
  };

  if (!params.length) {
    delete operation.parameters;
  }

  if (requiresCookieAuth(method, pathKey)) {
    operation.security = [{ cookieAuth: [] }];
  }

  if (["post", "put", "patch"].includes(method)) {
    operation.requestBody = {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
    };
  }

  return operation;
};

const extractPathsFromRouter = (router, basePath = "") => {
  const paths = {};

  if (!router || !Array.isArray(router.stack)) return paths;

  router.stack.forEach((layer) => {
    if (!layer || !layer.route || !layer.route.path) return;

    const routePath = Array.isArray(layer.route.path)
      ? layer.route.path[0]
      : layer.route.path;

    const fullPath = ensureOpenApiPathParams(joinPaths(basePath, routePath));
    if (!paths[fullPath]) paths[fullPath] = {};

    Object.entries(layer.route.methods || {}).forEach(([method, enabled]) => {
      if (!enabled) return;
      paths[fullPath][method] = buildOperation(method, fullPath);
    });
  });

  return paths;
};

const generatePathsFromMounts = (routeMounts = []) => {
  const generatedPaths = {};

  routeMounts.forEach(({ basePath, router }) => {
    const routerPaths = extractPathsFromRouter(router, basePath);
    Object.entries(routerPaths).forEach(([pathKey, pathValue]) => {
      if (!generatedPaths[pathKey]) generatedPaths[pathKey] = {};
      generatedPaths[pathKey] = { ...generatedPaths[pathKey], ...pathValue };
    });
  });

  return generatedPaths;
};

const generatePathsFromAppRoutes = (app) => {
  const generatedPaths = {};
  if (!app || !app._router || !Array.isArray(app._router.stack)) return generatedPaths;

  app._router.stack.forEach((layer) => {
    if (!layer || !layer.route || !layer.route.path) return;

    const routePath = Array.isArray(layer.route.path)
      ? layer.route.path[0]
      : layer.route.path;

    const fullPath = ensureOpenApiPathParams(joinPaths("", routePath));
    if (!generatedPaths[fullPath]) generatedPaths[fullPath] = {};

    Object.entries(layer.route.methods || {}).forEach(([method, enabled]) => {
      if (!enabled) return;
      generatedPaths[fullPath][method] = buildOperation(method, fullPath);
    });
  });

  return generatedPaths;
};

const buildSwaggerSpec = (routeMounts = []) => {
  const authPathOverrides = {
    "/api/signup": {
      post: {
        tags: ["auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["role", "email", "password", "termsAccepted", "emailVerificationToken"],
                properties: {
                  role: { type: "string", enum: ["customer", "company", "worker"] },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  termsAccepted: { type: "boolean" },
                  emailVerificationToken: { type: "string" },
                  documents: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Signup successful" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/login": {
      post: {
        tags: ["auth"],
        summary: "Login with email/password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login success or 2FA challenge",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { $ref: "#/components/schemas/LoginSuccessResponse" },
                    { $ref: "#/components/schemas/LoginTwoFactorChallengeResponse" },
                  ],
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/login/2fa/verify": {
      post: {
        tags: ["auth"],
        summary: "Verify 2FA OTP and complete login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginTwoFactorVerifyRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginSuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/email-otp/send": {
      post: {
        tags: ["auth"],
        summary: "Send OTP for signup or password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EmailOtpSendRequest" },
            },
          },
        },
        responses: {
          200: { description: "OTP sent" },
          429: { description: "Rate limited" },
        },
      },
    },
    "/api/email-otp/verify": {
      post: {
        tags: ["auth"],
        summary: "Verify OTP and receive verification token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EmailOtpVerifyRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP verified",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VerificationTokenResponse" },
              },
            },
          },
        },
      },
    },
    "/api/reset-password": {
      post: {
        tags: ["auth"],
        summary: "Reset password using verified token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: { description: "Password reset successful" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/2fa/status": {
      get: {
        tags: ["auth"],
        summary: "Get current user 2FA status",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "2FA status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TwoFactorStatusResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["auth"],
        summary: "Enable/Disable 2FA",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TwoFactorStatusUpdateRequest" },
            },
          },
        },
        responses: {
          200: { description: "2FA setting updated" },
        },
      },
    },
  };

  const paymentAndRevenuePathOverrides = {
    "/api/payment/worker/create-order": {
      post: {
        tags: ["payment"],
        summary: "Create Razorpay order for worker deposit or milestone",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["projectId", "projectType", "paymentType"],
                properties: {
                  projectId: { type: "string" },
                  projectType: { type: "string", enum: ["architect", "interior"] },
                  paymentType: { type: "string", enum: ["deposit", "milestone"] },
                  milestonePercentage: { type: "number", enum: [25, 50, 75, 100] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Order created" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/payment/worker/verify-payment": {
      post: {
        tags: ["payment"],
        summary: "Verify worker Razorpay payment and collect escrow funds",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "projectId",
                  "projectType",
                  "paymentType",
                  "razorpay_order_id",
                  "razorpay_payment_id",
                  "razorpay_signature",
                ],
                properties: {
                  projectId: { type: "string" },
                  projectType: { type: "string", enum: ["architect", "interior"] },
                  paymentType: { type: "string", enum: ["deposit", "milestone"] },
                  milestonePercentage: { type: "number", enum: [25, 50, 75, 100] },
                  razorpay_order_id: { type: "string" },
                  razorpay_payment_id: { type: "string" },
                  razorpay_signature: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Payment verified and escrow updated" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/payment/company/create-order": {
      post: {
        tags: ["payment"],
        summary: "Create Razorpay order for company phase payment (75/25 split, 5% platform fee)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["projectId", "milestonePercentage"],
                properties: {
                  projectId: { type: "string" },
                  milestonePercentage: { type: "number", enum: [25, 50, 75, 100] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Razorpay order created" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/payment/company/verify-payment": {
      post: {
        tags: ["payment"],
        summary: "Verify company Razorpay payment and release initial 75%",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["projectId", "razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
                properties: {
                  projectId: { type: "string" },
                  milestonePercentage: { type: "number", enum: [25, 50, 75, 100] },
                  razorpay_order_id: { type: "string" },
                  razorpay_payment_id: { type: "string" },
                  razorpay_signature: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Payment verified" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/payment/company/release-milestone": {
      post: {
        tags: ["payment"],
        summary: "Release held 25% to company and mark platform fee due",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["projectId", "milestonePercentage"],
                properties: {
                  projectId: { type: "string" },
                  milestonePercentage: { type: "number", enum: [25, 50, 75, 100] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Milestone released" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/payment/company/summary/{projectId}": {
      get: {
        tags: ["payment"],
        summary: "Get company project payment summary",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Payment summary" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { description: "Not found" },
        },
      },
    },
    "/api/company/platform-fee-invoice": {
      post: {
        tags: ["company"],
        summary: "Upload invoice proof for company platform fee payment",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["projectId", "milestonePercentage", "invoice"],
                properties: {
                  projectId: { type: "string" },
                  milestonePercentage: { type: "number", enum: [25, 50, 75, 100] },
                  invoice: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Invoice uploaded" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/platform-manager/company-payments": {
      get: {
        tags: ["platform-manager"],
        summary: "Get unified pending platform fee queue for company and worker projects",
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "Queue items" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/platform-manager/company-payments/{projectId}/{milestonePercentage}/collect": {
      post: {
        tags: ["platform-manager"],
        summary: "Verify and mark platform fee collected for company/worker milestone",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "milestonePercentage",
            in: "path",
            required: true,
            schema: { type: "number" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  projectType: { type: "string", enum: ["construction", "architect", "interior"] },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Platform fee collected" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/admin/revenue/platform-intelligence": {
      get: {
        tags: ["admin"],
        summary: "Get detailed platform revenue intelligence with filters, charts and transaction ledger",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "timeframe",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["all", "week", "month", "quarter", "year"] },
          },
          {
            name: "startDate",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" },
          },
          {
            name: "endDate",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" },
          },
          {
            name: "projectType",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["all", "construction", "architect", "interior"] },
          },
          {
            name: "feeStatus",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["all", "collected", "pending", "yet_to_come"] },
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 20 },
          },
        ],
        responses: {
          200: { description: "Intelligence payload" },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { description: "Server error" },
        },
      },
    },
  };

  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Build & Beyond API",
        version: "1.0.0",
        description: "Auto-generated API documentation for Build & Beyond backend routes.",
      },
      servers: [
        {
          url: process.env.SWAGGER_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
          description: "Local server",
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "token",
          },
        },
        schemas: {
          MessageResponse: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              message: { type: "string" },
              error: { type: "string" },
            },
          },
          LoginRequest: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string" },
            },
          },
          LoginSuccessResponse: {
            type: "object",
            properties: {
              message: { type: "string", example: "Login successful" },
              redirect: { type: "string", example: "/customerdashboard" },
            },
          },
          LoginTwoFactorChallengeResponse: {
            type: "object",
            properties: {
              requiresTwoFactor: { type: "boolean", example: true },
              twoFactorToken: { type: "string" },
              email: { type: "string", format: "email" },
              message: { type: "string" },
            },
          },
          LoginTwoFactorVerifyRequest: {
            type: "object",
            required: ["email", "otp", "twoFactorToken"],
            properties: {
              email: { type: "string", format: "email" },
              otp: { type: "string", minLength: 6, maxLength: 6 },
              twoFactorToken: { type: "string" },
            },
          },
          EmailOtpSendRequest: {
            type: "object",
            required: ["email", "purpose"],
            properties: {
              email: { type: "string", format: "email" },
              purpose: { type: "string", enum: ["signup", "forgot-password"] },
            },
          },
          EmailOtpVerifyRequest: {
            type: "object",
            required: ["email", "otp", "purpose"],
            properties: {
              email: { type: "string", format: "email" },
              otp: { type: "string", minLength: 6, maxLength: 6 },
              purpose: { type: "string", enum: ["signup", "forgot-password"] },
            },
          },
          VerificationTokenResponse: {
            type: "object",
            properties: {
              message: { type: "string", example: "OTP verified" },
              verificationToken: { type: "string" },
            },
          },
          ResetPasswordRequest: {
            type: "object",
            required: ["email", "newPassword", "verificationToken"],
            properties: {
              email: { type: "string", format: "email" },
              newPassword: { type: "string", minLength: 8 },
              verificationToken: { type: "string" },
            },
          },
          TwoFactorStatusResponse: {
            type: "object",
            properties: {
              twoFactorEnabled: { type: "boolean" },
            },
          },
          TwoFactorStatusUpdateRequest: {
            type: "object",
            required: ["enabled"],
            properties: {
              enabled: { type: "boolean" },
            },
          },
        },
        responses: {
          BadRequest: {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          Unauthorized: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    apis: [path.join(__dirname, "../routes/*.js")],
  };

  const jsdocSpec = swaggerJsdoc(options);
  const generatedPaths = generatePathsFromMounts(routeMounts);

  return {
    ...jsdocSpec,
    paths: {
      ...generatedPaths,
      ...(jsdocSpec.paths || {}),
      ...authPathOverrides,
      ...paymentAndRevenuePathOverrides,
    },
  };
};

const setupSwagger = (app, routeMounts = []) => {
  const spec = buildSwaggerSpec(routeMounts);
  const appLevelPaths = generatePathsFromAppRoutes(app);
  spec.paths = {
    ...appLevelPaths,
    ...(spec.paths || {}),
  };

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
  app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(spec);
  });
};

module.exports = { setupSwagger, buildSwaggerSpec };
