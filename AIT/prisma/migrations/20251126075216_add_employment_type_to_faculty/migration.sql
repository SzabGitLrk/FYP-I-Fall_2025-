-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_faculty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "designation" TEXT,
    "employmentType" TEXT NOT NULL DEFAULT 'PERMANENT',
    "departmentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "faculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_faculty" ("createdAt", "departmentId", "designation", "email", "id", "name", "phone", "updatedAt") SELECT "createdAt", "departmentId", "designation", "email", "id", "name", "phone", "updatedAt" FROM "faculty";
DROP TABLE "faculty";
ALTER TABLE "new_faculty" RENAME TO "faculty";
CREATE UNIQUE INDEX "faculty_email_key" ON "faculty"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
