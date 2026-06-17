-- CreateTable
CREATE TABLE "system_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "max_fuel_deviation" INTEGER NOT NULL DEFAULT 20,
    "max_working_hours" INTEGER NOT NULL DEFAULT 12,
    "check_odometer" BOOLEAN NOT NULL DEFAULT true,
    "auto_detect_anomalies" BOOLEAN NOT NULL DEFAULT true,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "ocr_mode" VARCHAR(32) NOT NULL DEFAULT 'balanced',
    "min_confidence" INTEGER NOT NULL DEFAULT 85,
    "auto_manual_review" BOOLEAN NOT NULL DEFAULT true,
    "audit_log" BOOLEAN NOT NULL DEFAULT true,
    "data_retention" INTEGER NOT NULL DEFAULT 36,
    "enable_2fa" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
