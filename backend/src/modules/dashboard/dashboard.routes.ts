import { Elysia, t } from "elysia";
import { container } from "tsyringe";
import { DashboardController } from "./dashboard.controller";
import { DashboardStatsSchema } from "./dashboard.schema";
import { jwtAuth } from "@/common/middleware/auth.middleware";

const dashboardController = container.resolve(DashboardController);

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .use(jwtAuth)
  .get(
    "/dashboard",
    async ({ user, set }) => {
      const response = await dashboardController.getDashboardStats(user.tenantId);
      set.status = response.statusCode;
      return response.body;
    },
    DashboardStatsSchema
  )
  .post(
    "/export",
    async ({ user, body, set }) => {
      // Pushes the export task into the queue
      const response = await dashboardController.exportDashboard(user.tenantId, (body as any).email);
      set.status = response.statusCode;
      return response.body;
    },
    {
      body: t.Object({ email: t.String() }),
      detail: { tags: ["Dashboard"], summary: "Trigger a background export of the dashboard to CSV" }
    }
  );
