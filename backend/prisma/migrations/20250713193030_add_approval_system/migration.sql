/*
  Warnings:

  - You are about to drop the `budget_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `budgetItemId` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to alter the column `accruedAmount` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `assignedAmount` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `committedAmount` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `executionPercent` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `paidAmount` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - Added the required column `budgetCode` to the `budget_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `budgetName` to the `budget_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalYear` to the `budget_executions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "budget_items_code_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "budget_items";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "report_approval_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progressReportId" TEXT NOT NULL,
    "actionById" TEXT NOT NULL,
    CONSTRAINT "report_approval_history_progressReportId_fkey" FOREIGN KEY ("progressReportId") REFERENCES "progress_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "report_approval_history_actionById_fkey" FOREIGN KEY ("actionById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_budget_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetCode" TEXT NOT NULL,
    "budgetName" TEXT NOT NULL,
    "description" TEXT,
    "assignedAmount" DECIMAL NOT NULL DEFAULT 0,
    "committedAmount" DECIMAL NOT NULL DEFAULT 0,
    "accruedAmount" DECIMAL NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "commitmentPercent" DECIMAL NOT NULL DEFAULT 0,
    "accruedPercent" DECIMAL NOT NULL DEFAULT 0,
    "executionPercent" DECIMAL NOT NULL DEFAULT 0,
    "fiscalYear" INTEGER NOT NULL,
    "quarter" INTEGER,
    "month" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastModifiedBy" TEXT,
    "activityId" TEXT NOT NULL,
    "departmentId" TEXT,
    "responsibleId" TEXT,
    "modifiedById" TEXT,
    CONSTRAINT "budget_executions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budget_executions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "budget_executions_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "budget_executions_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_budget_executions" ("accruedAmount", "activityId", "assignedAmount", "committedAmount", "createdAt", "executionPercent", "id", "paidAmount", "updatedAt") SELECT "accruedAmount", "activityId", "assignedAmount", "committedAmount", "createdAt", "executionPercent", "id", "paidAmount", "updatedAt" FROM "budget_executions";
DROP TABLE "budget_executions";
ALTER TABLE "new_budget_executions" RENAME TO "budget_executions";
CREATE INDEX "budget_executions_fiscalYear_idx" ON "budget_executions"("fiscalYear");
CREATE INDEX "budget_executions_activityId_idx" ON "budget_executions"("activityId");
CREATE INDEX "budget_executions_budgetCode_idx" ON "budget_executions"("budgetCode");
CREATE UNIQUE INDEX "budget_executions_activityId_budgetCode_fiscalYear_key" ON "budget_executions"("activityId", "budgetCode", "fiscalYear");
CREATE TABLE "new_progress_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "targetValue" REAL NOT NULL DEFAULT 0,
    "executionPercentage" REAL NOT NULL DEFAULT 0,
    "qualitativeComments" TEXT,
    "challenges" TEXT,
    "nextSteps" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reviewComments" TEXT,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "activityId" TEXT,
    "indicatorId" TEXT,
    "reportedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    CONSTRAINT "progress_reports_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "progress_reports_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "progress_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "progress_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_progress_reports" ("activityId", "challenges", "createdAt", "currentValue", "executionPercentage", "id", "indicatorId", "nextSteps", "period", "periodType", "qualitativeComments", "reportedById", "reviewComments", "reviewedAt", "reviewedById", "status", "targetValue", "updatedAt") SELECT "activityId", "challenges", "createdAt", "currentValue", "executionPercentage", "id", "indicatorId", "nextSteps", "period", "periodType", "qualitativeComments", "reportedById", "reviewComments", "reviewedAt", "reviewedById", "status", "targetValue", "updatedAt" FROM "progress_reports";
DROP TABLE "progress_reports";
ALTER TABLE "new_progress_reports" RENAME TO "progress_reports";
CREATE UNIQUE INDEX "progress_reports_reportedById_activityId_indicatorId_periodType_period_key" ON "progress_reports"("reportedById", "activityId", "indicatorId", "periodType", "period");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
