import { Elysia } from "elysia";
import { container } from "tsyringe";

import { AnnouncementsController } from "./announcements.controller";
import { CreateAnnouncementSchema, GetAnnouncementSchema, UpdateAnnouncementSchema, ListAnnouncementsSchema } from "./announcements.schema";
import { jwtAuth } from "@/common/middleware/auth.middleware";
import { roleAuth } from "@/common/middleware/role.middleware";

const announcementsController = container.resolve(AnnouncementsController);

export const announcementsRoutes = new Elysia({ prefix: "/announcements" })
  .use(jwtAuth)
  .use(roleAuth(["admin", "super_admin", "teacher"])) // Teachers and Admins can create announcements
  
  .post(
    "/",
    async ({ body, user, set }) => {
      const response = await announcementsController.createAnnouncement(user.tenantId, user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    CreateAnnouncementSchema
  )
  .get(
    "/",
    async ({ query, user, set }) => {
      const response = await announcementsController.listAnnouncements(user.tenantId, query);
      set.status = response.statusCode;
      return response.body;
    },
    ListAnnouncementsSchema
  )
  .get(
    "/:id",
    async ({ params: { id }, user, set }) => {
      const response = await announcementsController.getAnnouncement(user.tenantId, id);
      set.status = response.statusCode;
      return response.body;
    },
    GetAnnouncementSchema
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user, set }) => {
      const response = await announcementsController.updateAnnouncement(user.tenantId, id, body);
      set.status = response.statusCode;
      return response.body;
    },
    UpdateAnnouncementSchema
  );
