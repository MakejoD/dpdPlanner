-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_indicators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PRODUCT',
    "measurementUnit" TEXT NOT NULL,
    "baseline" REAL DEFAULT 0,
    "annualTarget" REAL NOT NULL,
    "reportingFrequency" TEXT NOT NULL DEFAULT 'trimestral',
    "q1Target" REAL DEFAULT 0,
    "q2Target" REAL DEFAULT 0,
    "q3Target" REAL DEFAULT 0,
    "q4Target" REAL DEFAULT 0,
    "janTarget" REAL DEFAULT 0,
    "febTarget" REAL DEFAULT 0,
    "marTarget" REAL DEFAULT 0,
    "aprTarget" REAL DEFAULT 0,
    "mayTarget" REAL DEFAULT 0,
    "junTarget" REAL DEFAULT 0,
    "julTarget" REAL DEFAULT 0,
    "augTarget" REAL DEFAULT 0,
    "sepTarget" REAL DEFAULT 0,
    "octTarget" REAL DEFAULT 0,
    "novTarget" REAL DEFAULT 0,
    "decTarget" REAL DEFAULT 0,
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
INSERT INTO "new_indicators" ("activityId", "annualTarget", "baseline", "createdAt", "description", "id", "isActive", "measurementUnit", "name", "objectiveId", "productId", "q1Target", "q2Target", "q3Target", "q4Target", "strategicAxisId", "type", "updatedAt") SELECT "activityId", "annualTarget", "baseline", "createdAt", "description", "id", "isActive", "measurementUnit", "name", "objectiveId", "productId", "q1Target", "q2Target", "q3Target", "q4Target", "strategicAxisId", "type", "updatedAt" FROM "indicators";
DROP TABLE "indicators";
ALTER TABLE "new_indicators" RENAME TO "indicators";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
