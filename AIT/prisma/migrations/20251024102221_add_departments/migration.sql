/*
  Warnings:

  - You are about to drop the column `department` on the `faculty` table. All the data in the column will be lost.
  - Added the required column `departmentId` to the `programs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "departments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "headOfDept" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Insert default departments for existing programs
INSERT INTO "departments" ("name", "code", "description", "createdAt", "updatedAt") VALUES 
('Computer Science', 'CS', 'Department of Computer Science', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Business Administration', 'BA', 'Department of Business Administration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Engineering', 'ENG', 'Department of Engineering', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_faculty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "designation" TEXT,
    "departmentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "faculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_faculty" ("createdAt", "email", "id", "name", "updatedAt") SELECT "createdAt", "email", "id", "name", "updatedAt" FROM "faculty";
DROP TABLE "faculty";
ALTER TABLE "new_faculty" RENAME TO "faculty";
CREATE UNIQUE INDEX "faculty_email_key" ON "faculty"("email");

CREATE TABLE "new_programs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "duration" INTEGER,
    "departmentId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Assign existing programs to departments based on their names
INSERT INTO "new_programs" ("id", "name", "code", "description", "duration", "departmentId", "createdAt", "updatedAt") 
SELECT 
    "id", 
    "name", 
    CASE 
        WHEN "name" LIKE '%Computer Science%' OR "name" LIKE '%BSCS%' OR "name" LIKE '%BSSE%' THEN "name"
        WHEN "name" LIKE '%BBA%' OR "name" LIKE '%MBA%' OR "name" LIKE '%Business%' THEN "name"
        ELSE "name"
    END as "code",
    NULL as "description",
    CASE 
        WHEN "name" LIKE '%Bachelor%' THEN 4
        WHEN "name" LIKE '%Master%' OR "name" LIKE '%MBA%' THEN 2
        ELSE NULL
    END as "duration",
    CASE 
        WHEN "name" LIKE '%Computer Science%' OR "name" LIKE '%BSCS%' OR "name" LIKE '%BSSE%' THEN 1
        WHEN "name" LIKE '%BBA%' OR "name" LIKE '%MBA%' OR "name" LIKE '%Business%' THEN 2
        ELSE 3
    END as "departmentId",
    "createdAt", 
    "updatedAt" 
FROM "programs";

DROP TABLE "programs";
ALTER TABLE "new_programs" RENAME TO "programs";
CREATE UNIQUE INDEX "programs_name_key" ON "programs"("name");
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");
