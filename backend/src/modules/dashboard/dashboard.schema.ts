import { t } from "elysia";

export const DashboardStatsSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Object({
        totalStudents: t.Number(),
        activeBatches: t.Number(),
        monthlyRevenue: t.Number(),
        pendingFees: t.Number(),
        recentPayments: t.Array(t.Any()),
        defaulters: t.Array(t.Any()),
        todaysClasses: t.Array(t.Any()),
        recentAnnouncements: t.Array(t.Any()),
        revenueHistory: t.Array(
          t.Object({
            month: t.String(),
            revenue: t.Number()
          })
        ),
      }),
    })
  },
  detail: {
    tags: ["Dashboard"],
    summary: "Get high-level dashboard statistics",
    security: [{ bearerAuth: [] }]
  }
};
