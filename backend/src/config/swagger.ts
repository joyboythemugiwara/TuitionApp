import { swagger } from "@elysiajs/swagger";

export const swaggerConfig = swagger({
  path: "/docs",
  documentation: {
    info: {
      title: "TuitionHub API",
      version: "1.0.0",
      description: "Tuition Center Fee Management SaaS API",
    },
    tags: [
      { name: "Auth", description: "Authentication & sessions" },
      { name: "Tenants", description: "Tenant management" },
      { name: "Users", description: "User management" },
      { name: "Students", description: "Student management" },
      { name: "Batches", description: "Batch management" },
      { name: "Fees", description: "Fee records" },
      { name: "Payments", description: "Payments" },
      { name: "Announcements", description: "Announcements" },
      { name: "Notifications", description: "Notification logs" },
      { name: "Reports", description: "Reports & analytics" },
      { name: "Dashboard", description: "Dashboard metrics" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
});
