import { Controller, Inject } from "@/common/decorators";
import { UploadsService } from "./uploads.service";
import { successResponse } from "@/common/responses";

@Controller()
export class UploadsController {
  constructor(@Inject(UploadsService) private readonly service: UploadsService) {}

  async generatePresignedUrl(tenantId: string, body: { filename: string; contentType: string; folder: string }) {
    const data = await this.service.generatePresignedUrl(
      tenantId,
      body.folder,
      body.filename,
      body.contentType
    );

    return successResponse("Pre-signed URL generated successfully", data, 201);
  }
}
