import { Controller, Inject } from "@/common/decorators";
import { StudentsService } from "./students.service";
import { CreateStudentRequest, UpdateStudentRequest } from "./students.types";
import { successResponse } from "@/common/responses";

@Controller()
export class StudentsController {
  constructor(@Inject(StudentsService) private readonly service: StudentsService) {}

  async createStudent(tenantId: string, actorId: string, body: CreateStudentRequest) {
    const student = await this.service.createStudent(tenantId, actorId, body);
    return successResponse("Student registered successfully", student, 201);
  }

  async getStudent(tenantId: string, studentId: string) {
    const student = await this.service.getStudent(tenantId, studentId);
    return successResponse("Student retrieved successfully", student);
  }

  async updateStudent(tenantId: string, actorId: string, studentId: string, body: UpdateStudentRequest) {
    const student = await this.service.updateStudent(tenantId, actorId, studentId, body);
    return successResponse("Student updated successfully", student);
  }

  async bulkCreateStudents(tenantId: string, body: { students: CreateStudentRequest[] }) {
    const students = await this.service.bulkCreateStudents(tenantId, body);
    return successResponse("Students created successfully", students, 201);
  }

  async bulkUpdateStudents(tenantId: string, actorId: string, body: { studentIds: string[], updates: { batchId?: string | null, status?: "active" | "inactive" } }) {
    await this.service.bulkUpdateStudents(tenantId, actorId, body);
    return successResponse("Students updated successfully", null);
  }

  async listStudents(tenantId: string, query: { batchId?: string; status?: "active" | "inactive"; search?: string; sort?: "name" | "createdAt" | "monthlyFee"; order?: "asc" | "desc"; page?: number; limit?: number }) {
    const result = await this.service.listStudents(tenantId, query);
    return {
      statusCode: 200,
      body: {
        success: true,
        message: "Students retrieved successfully",
        data: result.data,
        meta: result.meta,
      }
    };
  }

  async deleteStudent(tenantId: string, actorId: string, studentId: string) {
    await this.service.deleteStudent(tenantId, actorId, studentId);
    return successResponse("Student deleted successfully", null);
  }

  async bulkDeleteStudents(tenantId: string, actorId: string, body: { studentIds: string[] }) {
    await this.service.bulkDeleteStudents(tenantId, actorId, body.studentIds);
    return successResponse("Students deleted successfully", null);
  }
}
