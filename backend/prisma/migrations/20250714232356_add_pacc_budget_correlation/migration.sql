/*
  Warnings:

  - You are about to drop the `report_approval_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `accruedPercent` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to drop the column `budgetCode` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to drop the column `budgetName` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to drop the column `commitmentPercent` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to drop the column `lastModifiedBy` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedById` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to drop the column `responsibleId` on the `budget_executions` table. All the data in the column will be lost.
  - You are about to alter the column `accruedAmount` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - You are about to alter the column `assignedAmount` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - You are about to alter the column `committedAmount` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - You are about to alter the column `executionPercent` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - You are about to alter the column `paidAmount` on the `budget_executions` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - You are about to drop the column `rejectionReason` on the `progress_reports` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `progress_reports` table. All the data in the column will be lost.
  - Added the required column `amount` to the `budget_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `executionType` to the `budget_executions` table without a default value. This is not possible if the table is not empty.
  - Made the column `month` on table `budget_executions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `quarter` on table `budget_executions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "report_approval_history";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "procurement_processes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "procurementType" TEXT NOT NULL,
    "procurementMethod" TEXT NOT NULL,
    "estimatedAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'DOP',
    "plannedStartDate" DATETIME,
    "plannedEndDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "quarter" TEXT,
    "month" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANIFICADO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "budgetCode" TEXT,
    "isRecurrent" BOOLEAN NOT NULL DEFAULT false,
    "legalFramework" TEXT NOT NULL DEFAULT 'LEY_340_06',
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activityId" TEXT,
    CONSTRAINT "procurement_processes_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetCode" TEXT NOT NULL,
    "budgetType" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "allocatedAmount" REAL NOT NULL,
    "executedAmount" REAL NOT NULL DEFAULT 0,
    "availableAmount" REAL NOT NULL,
    "quarter" TEXT,
    "month" TEXT,
    "source" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "object" TEXT,
    "sigefCode" TEXT,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activityId" TEXT,
    "procurementProcessId" TEXT,
    CONSTRAINT "budget_allocations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "budget_allocations_procurementProcessId_fkey" FOREIGN KEY ("procurementProcessId") REFERENCES "procurement_processes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "poa_pacc_budget_correlations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "hasProcurementNeeds" BOOLEAN NOT NULL DEFAULT false,
    "procurementCompliance" REAL NOT NULL DEFAULT 0,
    "hasBudgetAllocation" BOOLEAN NOT NULL DEFAULT false,
    "budgetCompliance" REAL NOT NULL DEFAULT 0,
    "overallCompliance" REAL NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'BAJO',
    "complianceStatus" TEXT NOT NULL DEFAULT 'EN_CUMPLIMIENTO',
    "lastReviewDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewDate" DATETIME,
    "observations" TEXT,
    "recommendations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "poa_pacc_budget_correlations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compliance_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL,
    "reportPeriod" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "quarter" TEXT,
    "month" TEXT,
    "totalActivities" INTEGER NOT NULL DEFAULT 0,
    "activitiesOnTrack" INTEGER NOT NULL DEFAULT 0,
    "activitiesAtRisk" INTEGER NOT NULL DEFAULT 0,
    "activitiesDelayed" INTEGER NOT NULL DEFAULT 0,
    "totalProcurements" INTEGER NOT NULL DEFAULT 0,
    "procurementsCompleted" INTEGER NOT NULL DEFAULT 0,
    "procurementsInProcess" INTEGER NOT NULL DEFAULT 0,
    "procurementsDelayed" INTEGER NOT NULL DEFAULT 0,
    "totalBudget" REAL NOT NULL DEFAULT 0,
    "budgetExecuted" REAL NOT NULL DEFAULT 0,
    "budgetAvailable" REAL NOT NULL DEFAULT 0,
    "executionPercentage" REAL NOT NULL DEFAULT 0,
    "overallCompliance" REAL NOT NULL DEFAULT 0,
    "complianceGrade" TEXT,
    "recommendations" TEXT,
    "actionPlan" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "approvedAt" DATETIME,
    "approvedBy" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_budget_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "documentNumber" TEXT,
    "executionType" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "sigefReference" TEXT,
    "observations" TEXT,
    "year" INTEGER,
    "assignedAmount" REAL DEFAULT 0,
    "committedAmount" REAL DEFAULT 0,
    "accruedAmount" REAL DEFAULT 0,
    "paidAmount" REAL DEFAULT 0,
    "executionPercent" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activityId" TEXT,
    "budgetItemId" TEXT,
    "budgetAllocationId" TEXT,
    CONSTRAINT "budget_executions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budget_executions_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "budget_executions_budgetAllocationId_fkey" FOREIGN KEY ("budgetAllocationId") REFERENCES "budget_allocations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_budget_executions" ("accruedAmount", "activityId", "assignedAmount", "committedAmount", "createdAt", "description", "executionPercent", "fiscalYear", "id", "month", "paidAmount", "quarter", "updatedAt") SELECT "accruedAmount", "activityId", "assignedAmount", "committedAmount", "createdAt", "description", "executionPercent", "fiscalYear", "id", "month", "paidAmount", "quarter", "updatedAt" FROM "budget_executions";
DROP TABLE "budget_executions";
ALTER TABLE "new_budget_executions" RENAME TO "budget_executions";
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
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "reviewComments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "budget_items_code_key" ON "budget_items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "poa_pacc_budget_correlations_activityId_key" ON "poa_pacc_budget_correlations"("activityId");
