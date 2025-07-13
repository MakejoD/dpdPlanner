-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "roleId" TEXT NOT NULL,
    "departmentId" TEXT,
    CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategic_axes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "departmentId" TEXT,
    CONSTRAINT "strategic_axes_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "objectives" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "strategicAxisId" TEXT NOT NULL,
    CONSTRAINT "objectives_strategicAxisId_fkey" FOREIGN KEY ("strategicAxisId") REFERENCES "strategic_axes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PRODUCT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "objectiveId" TEXT NOT NULL,
    CONSTRAINT "products_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "objectives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "activities_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "indicators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PRODUCT',
    "measurementUnit" TEXT NOT NULL,
    "baseline" REAL DEFAULT 0,
    "annualTarget" REAL NOT NULL,
    "q1Target" REAL DEFAULT 0,
    "q2Target" REAL DEFAULT 0,
    "q3Target" REAL DEFAULT 0,
    "q4Target" REAL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "strategicAxisId" TEXT,
    "objectiveId" TEXT,
    "productId" TEXT,
    "activityId" TEXT,
    CONSTRAINT "indicators_strategicAxisId_fkey" FOREIGN KEY ("strategicAxisId") REFERENCES "strategic_axes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "indicators_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "objectives" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "indicators_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "indicators_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "progress_reports" (
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

-- CreateTable
CREATE TABLE "progress_report_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progressReportId" TEXT NOT NULL,
    CONSTRAINT "progress_report_attachments_progressReportId_fkey" FOREIGN KEY ("progressReportId") REFERENCES "progress_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE TABLE "budget_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "assignedAmount" REAL NOT NULL DEFAULT 0,
    "committedAmount" REAL NOT NULL DEFAULT 0,
    "accruedAmount" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "executionPercent" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activityId" TEXT NOT NULL,
    "budgetItemId" TEXT NOT NULL,
    CONSTRAINT "budget_executions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budget_executions_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "departmentId" TEXT,
    CONSTRAINT "activity_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activity_assignments_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activity_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "indicator_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "departmentId" TEXT,
    CONSTRAINT "indicator_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "indicator_assignments_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "indicator_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_resource_key" ON "permissions"("action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_axes_code_key" ON "strategic_axes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_axes_code_year_key" ON "strategic_axes"("code", "year");

-- CreateIndex
CREATE UNIQUE INDEX "objectives_strategicAxisId_code_key" ON "objectives"("strategicAxisId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "products_objectiveId_code_key" ON "products"("objectiveId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "activities_productId_code_key" ON "activities"("productId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "progress_reports_reportedById_activityId_indicatorId_periodType_period_key" ON "progress_reports"("reportedById", "activityId", "indicatorId", "periodType", "period");

-- CreateIndex
CREATE UNIQUE INDEX "budget_items_code_key" ON "budget_items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "budget_executions_activityId_budgetItemId_year_key" ON "budget_executions"("activityId", "budgetItemId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "activity_assignments_userId_activityId_key" ON "activity_assignments"("userId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "indicator_assignments_userId_indicatorId_key" ON "indicator_assignments"("userId", "indicatorId");
