import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/config/env";
import { Service } from "@/common/decorators";
import { randomUUID } from "crypto";

@Service()
export class UploadsService {
  private s3Client: S3Client | null = null;

  constructor() {
    if (env.R2_ACCESS_KEY && env.R2_SECRET_KEY) {
      this.s3Client = new S3Client({
        region: "auto",
        endpoint: env.R2_ENDPOINT,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY,
          secretAccessKey: env.R2_SECRET_KEY,
        },
      });
    }
  }

  /**
   * Generates a pre-signed URL allowing the frontend to upload a file directly to Cloudflare R2
   */
  async generatePresignedUrl(
    tenantId: string, 
    folder: string, 
    filename: string, 
    contentType: string
  ): Promise<{ uploadUrl: string; fileUrl: string; fileKey: string }> {
    
    if (!this.s3Client) {
      throw new Error("Cloud Storage (R2/S3) is not configured in environment variables.");
    }

    // Clean filename and generate a unique key
    const cleanFileName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueId = randomUUID();
    const fileKey = `${tenantId}/${folder}/${uniqueId}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: fileKey,
      ContentType: contentType,
    });

    // URL expires in 15 minutes
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });

    // Return the relative path to be saved in the database
    // E.g., "/tenantId/avatars/uuid-photo.jpg"
    const fileUrl = `/${fileKey}`;

    return {
      uploadUrl,
      fileUrl,
      fileKey
    };
  }
}
