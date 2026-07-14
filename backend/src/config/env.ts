import { envsafe, port, str, url } from "envsafe";

export const env = envsafe({
    NODE_ENV: str({
        devDefault: "development",
        choices: ["development", "production", "test"],
    }),
    PORT: port({
        devDefault: 3000,
    }),
    DATABASE_URL: url({}),
    // JWT
    JWT_SECRET: str(),
    JWT_EXPIRES_IN: str({
        devDefault: "7d",
    }),
    JWT_REFRESH_SECRET: str(),
    JWT_REFRESH_EXPIRES_IN: str({
        devDefault: "30d",
    }),

    // Redis
    REDIS_URL: url(),

    // Cloudflare R2
    R2_ENDPOINT: url(),
    R2_ACCESS_KEY: str({ allowEmpty: true, devDefault: "" }),
    R2_SECRET_KEY: str({ allowEmpty: true, devDefault: "" }),
    R2_BUCKET: str(),
    R2_PUBLIC_URL: url(),

    // Meta WhatsApp Business API
    META_WABA_TOKEN: str({ allowEmpty: true, devDefault: "" }),
    META_PHONE_NUMBER_ID: str({ allowEmpty: true, devDefault: "" }),
    META_API_VERSION: str({
        devDefault: "v19.0",
    }),

    // SMS (MSG91)
    MSG91_AUTH_KEY: str({ allowEmpty: true, devDefault: "" }),
    MSG91_SENDER_ID: str({
        devDefault: "TUTNHB",
    }),

    // Razorpay
    RAZORPAY_KEY_ID: str({ allowEmpty: true, devDefault: "" }),
    RAZORPAY_KEY_SECRET: str({ allowEmpty: true, devDefault: "" }),
    RAZORPAY_WEBHOOK_SECRET: str({ allowEmpty: true, devDefault: "" }),

    // Firebase FCM
    FCM_PROJECT_ID: str({ allowEmpty: true, devDefault: "" }),
    FCM_CLIENT_EMAIL: str({ allowEmpty: true, devDefault: "" }),
    FCM_PRIVATE_KEY: str({ allowEmpty: true, devDefault: "" }),

    APP_URL: url({
        devDefault: "http://localhost:3000",
    }),
    FRONTEND_URL: url({
        devDefault: "http://localhost:3001",
    }),

    // Email (Resend)
    RESEND_API_KEY: str({ allowEmpty: true, devDefault: "" }),

    RESEND_EMAIL_FROM: str({ devDefault: "TuitionHub <noreply@tuitionhub.app>" }),
});
