-- CreateTable
CREATE TABLE "programs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "semesters_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "courses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "facultyId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "courses_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "courses_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "faculty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "timetables" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "timeSlotId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "timetables_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "timetables_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "timetables_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "timetables_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "time_slots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "faculty_preferences" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "facultyId" INTEGER NOT NULL,
    "preferredTimeSlots" JSONB,
    "unavailableTimeSlots" JSONB,
    "preferredDays" JSONB,
    "unavailableDays" JSONB,
    "maxDailyHours" INTEGER NOT NULL DEFAULT 8,
    "maxConsecutiveHours" INTEGER NOT NULL DEFAULT 4,
    "preferredBreakDuration" INTEGER NOT NULL DEFAULT 30,
    "preferredTeachingPatterns" JSONB,
    "avoidBackToBackClasses" BOOLEAN NOT NULL DEFAULT false,
    "preferredRoomTypes" JSONB,
    "preferredBuildings" JSONB,
    "preferredCourseTypes" JSONB,
    "maxCoursesPerDay" INTEGER NOT NULL DEFAULT 4,
    "flexibilityLevel" TEXT NOT NULL DEFAULT 'MODERATE',
    "priorityLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "faculty_preferences_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "room_enhancements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomId" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "optimalCapacity" INTEGER NOT NULL,
    "equipment" JSONB,
    "roomCharacteristics" JSONB,
    "suitableForCourseTypes" JSONB,
    "departmentPreferences" JSONB,
    "building" TEXT,
    "floor" TEXT,
    "accessibilityFeatures" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "room_enhancements_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_enhancements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "expectedEnrollment" INTEGER NOT NULL DEFAULT 30,
    "maxEnrollment" INTEGER NOT NULL DEFAULT 50,
    "minEnrollment" INTEGER NOT NULL DEFAULT 10,
    "requiredEquipment" JSONB,
    "preferredEquipment" JSONB,
    "requiredRoomType" TEXT,
    "preferredRoomFeatures" JSONB,
    "preferredTimeSlots" JSONB,
    "avoidTimeSlots" JSONB,
    "prerequisiteCourses" JSONB,
    "corequisiteCourses" JSONB,
    "requiresSpecialSetup" BOOLEAN NOT NULL DEFAULT false,
    "setupTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "cleanupTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_enhancements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conflict_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conflictType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedEntities" JSONB NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detectedBy" TEXT,
    "detectionMethod" TEXT,
    "resolutionApplied" JSONB,
    "resolutionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "impactScore" REAL,
    "resolutionSuccess" BOOLEAN,
    "userFeedback" TEXT,
    "timetableSnapshot" JSONB,
    "contextData" JSONB,
    "relatedConflicts" JSONB,
    "cascadingEffects" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "optimization_metrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generationId" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallQualityScore" REAL NOT NULL,
    "constraintSatisfaction" REAL NOT NULL,
    "preferenceSatisfaction" REAL NOT NULL,
    "loadBalanceScore" REAL NOT NULL,
    "resourceUtilization" REAL NOT NULL,
    "hardConstraintViolations" INTEGER NOT NULL DEFAULT 0,
    "softConstraintViolations" INTEGER NOT NULL DEFAULT 0,
    "facultyPreferenceScore" REAL NOT NULL,
    "roomUtilizationScore" REAL NOT NULL,
    "timeDistributionScore" REAL NOT NULL,
    "generationTimeMs" INTEGER NOT NULL,
    "iterationsRequired" INTEGER NOT NULL,
    "convergenceAchieved" BOOLEAN NOT NULL DEFAULT false,
    "algorithmParameters" JSONB NOT NULL,
    "constraintWeights" JSONB NOT NULL,
    "previousGenerationId" TEXT,
    "improvementScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT,
    "timetableData" JSONB NOT NULL,
    "qualityMetrics" JSONB NOT NULL,
    "comparisonMetrics" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "parentScenarioId" INTEGER,
    "tags" JSONB,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "scenarios_parentScenarioId_fkey" FOREIGN KEY ("parentScenarioId") REFERENCES "scenarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT,
    "manufacturer" TEXT,
    "specifications" JSONB,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isOperational" BOOLEAN NOT NULL DEFAULT true,
    "lastMaintenanceDate" DATETIME,
    "nextMaintenanceDate" DATETIME,
    "requiredForCourseTypes" JSONB,
    "compatibleRoomTypes" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedDate" DATETIME,
    "purchaseDate" DATETIME,
    "purchaseCost" REAL,
    "warrantyExpiration" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_name_key" ON "programs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_programId_number_key" ON "semesters"("programId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_email_key" ON "faculty"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "rooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_start_end_key" ON "time_slots"("start", "end");

-- CreateIndex
CREATE UNIQUE INDEX "timetables_day_roomId_timeSlotId_key" ON "timetables"("day", "roomId", "timeSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "timetables_day_facultyId_timeSlotId_key" ON "timetables"("day", "facultyId", "timeSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "timetables_day_courseId_timeSlotId_key" ON "timetables"("day", "courseId", "timeSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_preferences_facultyId_key" ON "faculty_preferences"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "room_enhancements_roomId_key" ON "room_enhancements"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "course_enhancements_courseId_key" ON "course_enhancements"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "optimization_metrics_generationId_key" ON "optimization_metrics"("generationId");
