import { Elysia } from "elysia";
import { container } from "tsyringe";

import { StudentsController } from "./students.controller";
import { CreateStudentSchema, GetStudentSchema, UpdateStudentSchema, ListStudentsSchema, BulkCreateStudentSchema, BulkUpdateStudentSchema, DeleteStudentSchema, BulkDeleteStudentSchema } from "./students.schema";
import { jwtAuth } from "@/common/middleware/auth.middleware";
import { roleAuth } from "@/common/middleware/role.middleware";

const studentsController = container.resolve(StudentsController);

export const studentsRoutes = new Elysia({ prefix: "/students" })
  .use(jwtAuth)
  .use(roleAuth(["admin", "super_admin", "teacher"])) // All staff can interact with students
  
  .post(
    "/",
    async ({ body, user, set }) => {
      const response = await studentsController.createStudent(user.tenantId, user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    CreateStudentSchema
  )
  .post(
    "/bulk",
    async ({ body, user, set }) => {
      const response = await studentsController.bulkCreateStudents(user.tenantId, body);
      set.status = response.statusCode;
      return response.body;
    },
    BulkCreateStudentSchema
  )
  .patch(
    "/bulk",
    async ({ body, user, set }) => {
      const response = await studentsController.bulkUpdateStudents(user.tenantId, user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    BulkUpdateStudentSchema
  )
  .delete(
    "/bulk",
    async ({ body, user, set }) => {
      const response = await studentsController.bulkDeleteStudents(user.tenantId, user.userId, body);
      set.status = response.statusCode;
      return response.body;
    },
    BulkDeleteStudentSchema
  )
  .get(
    "/",
    async ({ query, user, set }) => {
      const response = await studentsController.listStudents(user.tenantId, query);
      set.status = response.statusCode;
      return response.body;
    },
    ListStudentsSchema
  )
  .get(
    "/:id",
    async ({ params: { id }, user, set }) => {
      const response = await studentsController.getStudent(user.tenantId, id);
      set.status = response.statusCode;
      return response.body;
    },
    GetStudentSchema
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user, set }) => {
      const response = await studentsController.updateStudent(user.tenantId, user.userId, id, body);
      set.status = response.statusCode;
      return response.body;
    },
    UpdateStudentSchema
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, set }) => {
      const response = await studentsController.deleteStudent(user.tenantId, user.userId, id);
      set.status = response.statusCode;
      return response.body;
    },
    DeleteStudentSchema
  );
