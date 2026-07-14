import { t } from "elysia";

export const GeneratePresignedUrlSchema = {
  body: t.Object({
    filename: t.String({ description: "Original name of the file" }),
    contentType: t.String({ description: "MIME type (e.g. image/jpeg, application/pdf)" }),
    folder: t.Union([
      t.Literal("avatars"),
      t.Literal("documents"),
      t.Literal("receipts")
    ], { description: "The folder to place the file in" }),
  }),
  response: {
    201: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        uploadUrl: t.String(),
        fileUrl: t.String(),
        fileKey: t.String(),
      }),
    })
  },
  detail: {
    tags: ["Uploads"],
    summary: "Generate a pre-signed URL to upload a file to Cloud Storage (R2/S3)",
    security: [{ bearerAuth: [] }]
  }
};
