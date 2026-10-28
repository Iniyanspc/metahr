-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'CONTRACT', 'INTERN');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'NOTICE', 'EXITED');

-- CreateEnum
CREATE TYPE "ChecklistKind" AS ENUM ('ONBOARDING', 'OFFBOARDING', 'INTERN_END');

-- CreateEnum
CREATE TYPE "TaskAssignee" AS ENUM ('HR', 'MANAGER', 'IT', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "FnfStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SETTLED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('LAPTOP', 'MONITOR', 'ID_CARD', 'PHONE', 'ACCESSORY', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'RETIRED', 'LOST');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('OFFICE', 'WFH', 'CLIENT_SITE');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('WEB', 'REGULARISATION', 'HR_EDIT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AccrualMode" AS ENUM ('UPFRONT_YEARLY', 'MONTHLY', 'NONE');

-- CreateEnum
CREATE TYPE "LedgerKind" AS ENUM ('ACCRUAL', 'CARRY_FORWARD', 'LAPSE', 'COMP_OFF_CREDIT', 'TAKEN', 'REVERSAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "DayHalf" AS ENUM ('FULL', 'FIRST_HALF', 'SECOND_HALF');

-- CreateEnum
CREATE TYPE "ComponentKind" AS ENUM ('EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION');

-- CreateEnum
CREATE TYPE "ComponentCalc" AS ENUM ('FIXED', 'STATUTORY_PF_EMPLOYEE', 'STATUTORY_PF_EMPLOYER', 'STATUTORY_ESI_EMPLOYEE', 'STATUTORY_ESI_EMPLOYER', 'STATUTORY_PT', 'MANUAL_TDS');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'LOCKED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ReimbursementStatus" AS ENUM ('SUBMITTED', 'MANAGER_APPROVED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('OFFER_LETTER', 'ID_PROOF', 'EDUCATION', 'NDA', 'RELIEVING_LETTER', 'EXPERIENCE_LETTER', 'INTERNSHIP_LETTER', 'INTERNSHIP_CERTIFICATE', 'SALARY_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "TemplateKind" AS ENUM ('OFFER_LETTER', 'INTERNSHIP_LETTER', 'INTERNSHIP_COMPLETION', 'EXPERIENCE_LETTER', 'SALARY_CERTIFICATE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOCK', 'EXPORT', 'VIEW_SENSITIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMPTZ,
    "name" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ NOT NULL
);

-- CreateTable
CREATE TABLE "RateLimitHit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "workEmail" TEXT NOT NULL,
    "personalEmail" TEXT,
    "phone" TEXT,
    "dateOfBirth" DATE,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRel" TEXT,
    "photoFileId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employment" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "type" "EmploymentType" NOT NULL,
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ONBOARDING',
    "departmentId" TEXT,
    "designationId" TEXT,
    "managerId" TEXT,
    "joiningDate" DATE NOT NULL,
    "probationEndDate" DATE,
    "endedOn" DATE,
    "endReason" TEXT,
    "convertedFromId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Employment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternDetails" (
    "id" TEXT NOT NULL,
    "employmentId" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "internshipStart" DATE NOT NULL,
    "internshipEnd" DATE NOT NULL,
    "mentorId" TEXT,
    "stipendPaise" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "InternDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutoryDetails" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "panEnc" TEXT,
    "panLast4" TEXT,
    "panHash" TEXT,
    "aadhaarEnc" TEXT,
    "aadhaarLast4" TEXT,
    "uanEnc" TEXT,
    "uanLast4" TEXT,
    "esiNumberEnc" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "StatutoryDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "accountNumberEnc" TEXT NOT NULL,
    "accountLast4" TEXT NOT NULL,
    "ifscEnc" TEXT NOT NULL,
    "bankName" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ChecklistKind" NOT NULL,
    "employmentType" "EmploymentType",
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplateTask" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee" "TaskAssignee" NOT NULL,
    "dueOffsetDays" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "ChecklistTemplateTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "templateId" TEXT,
    "kind" "ChecklistKind" NOT NULL,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTask" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee" "TaskAssignee" NOT NULL,
    "assigneeUserId" TEXT,
    "dueDate" DATE NOT NULL,
    "completedAt" TIMESTAMPTZ,
    "completedById" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "ChecklistTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Separation" (
    "id" TEXT NOT NULL,
    "employmentId" TEXT NOT NULL,
    "resignationDate" DATE NOT NULL,
    "noticePeriodDays" INTEGER NOT NULL,
    "lastWorkingDate" DATE NOT NULL,
    "reason" TEXT,
    "fnfStatus" "FnfStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "fnfAmountPaise" INTEGER,
    "fnfSettledOn" DATE,
    "experienceLetterIssued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Separation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemApp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "SystemApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessGrant" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "accountIdentifier" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "grantedOn" DATE NOT NULL,
    "grantedById" TEXT,
    "revokedOn" DATE,
    "revokedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" DATE,
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_STOCK',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAssignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "assignedOn" DATE NOT NULL,
    "conditionAtIssue" "AssetCondition" NOT NULL,
    "returnedOn" DATE,
    "conditionOnReturn" "AssetCondition",
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInAt" TIMESTAMPTZ,
    "checkOutAt" TIMESTAMPTZ,
    "workMode" "WorkMode" NOT NULL,
    "source" "AttendanceSource" NOT NULL DEFAULT 'WEB',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regularisation" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInAt" TIMESTAMPTZ NOT NULL,
    "checkOutAt" TIMESTAMPTZ,
    "workMode" "WorkMode" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "decidedAt" TIMESTAMPTZ,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Regularisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "allowHalfDay" BOOLEAN NOT NULL DEFAULT true,
    "colour" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicy" (
    "id" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "annualQuotaUnits" INTEGER NOT NULL,
    "accrual" "AccrualMode" NOT NULL,
    "carryForwardMaxUnits" INTEGER NOT NULL DEFAULT 0,
    "allowNegative" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveLedgerEntry" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "leaveYear" INTEGER NOT NULL,
    "kind" "LedgerKind" NOT NULL,
    "units" INTEGER NOT NULL,
    "leaveRequestId" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "LeaveLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "startHalf" "DayHalf" NOT NULL DEFAULT 'FULL',
    "endDate" DATE NOT NULL,
    "endHalf" "DayHalf" NOT NULL DEFAULT 'FULL',
    "units" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "decidedAt" TIMESTAMPTZ,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ComponentKind" NOT NULL,
    "calc" "ComponentCalc" NOT NULL DEFAULT 'FIXED',
    "proratesWithLop" BOOLEAN NOT NULL DEFAULT true,
    "isPfWage" BOOLEAN NOT NULL DEFAULT false,
    "isEsiWage" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "employmentId" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "pfApplicable" BOOLEAN NOT NULL DEFAULT true,
    "esiApplicable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructureLine" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "monthlyAmountPaise" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "SalaryStructureLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "computedAt" TIMESTAMPTZ,
    "lockedAt" TIMESTAMPTZ,
    "lockedById" TEXT,
    "statutorySnapshot" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "employmentId" TEXT NOT NULL,
    "daysInMonth" INTEGER NOT NULL,
    "payableDaysUnits" INTEGER NOT NULL,
    "lopDaysUnits" INTEGER NOT NULL,
    "presentDaysUnits" INTEGER NOT NULL,
    "grossPaise" INTEGER NOT NULL,
    "deductionsPaise" INTEGER NOT NULL,
    "netPaise" INTEGER NOT NULL,
    "tdsPaise" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidOn" DATE,
    "transactionRef" TEXT,
    "bankSnapshot" JSONB,
    "payslipFileId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntryLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ComponentKind" NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "PayrollEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollAdjustment" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "kind" "ComponentKind" NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "relatesToYear" INTEGER,
    "relatesToMonth" INTEGER,
    "appliedInEntryId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "PayrollAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reimbursement" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "expenseDate" DATE NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "receiptFileId" TEXT NOT NULL,
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'SUBMITTED',
    "managerDecidedById" TEXT,
    "managerDecidedAt" TIMESTAMPTZ,
    "hrDecidedById" TEXT,
    "hrDecidedAt" TIMESTAMPTZ,
    "decisionNote" TEXT,
    "payrollEntryId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Reimbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankExportFormat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "delimiter" TEXT NOT NULL DEFAULT ',',
    "hasHeader" BOOLEAN NOT NULL DEFAULT true,
    "columns" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "BankExportFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonDocument" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "visibleToEmployee" BOOLEAN NOT NULL DEFAULT true,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "PersonDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "kind" "TemplateKind" NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL DEFAULT 'company',
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "addressLines" TEXT NOT NULL,
    "logoFileId" TEXT,
    "pfRegistrationNo" TEXT,
    "esiRegistrationNo" TEXT,
    "ptRegistrationNo" TEXT,
    "weeklyOffs" JSONB NOT NULL,
    "halfDayMinMinutes" INTEGER NOT NULL,
    "fullDayMinMinutes" INTEGER NOT NULL,
    "leaveYearStartMonth" INTEGER NOT NULL DEFAULT 1,
    "passwordManagerUrl" TEXT,
    "itOwnerPersonId" TEXT,
    "internEndLeadDays" INTEGER NOT NULL DEFAULT 14,
    "statutory" JSONB,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "RateLimitHit_key_createdAt_idx" ON "RateLimitHit"("key", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Person_userId_key" ON "Person"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_workEmail_key" ON "Person"("workEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Person_photoFileId_key" ON "Person"("photoFileId");

-- CreateIndex
CREATE INDEX "Person_lastName_firstName_idx" ON "Person"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Employment_employeeCode_key" ON "Employment"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employment_convertedFromId_key" ON "Employment"("convertedFromId");

-- CreateIndex
CREATE INDEX "Employment_personId_endedOn_idx" ON "Employment"("personId", "endedOn");

-- CreateIndex
CREATE INDEX "Employment_managerId_idx" ON "Employment"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "InternDetails_employmentId_key" ON "InternDetails"("employmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StatutoryDetails_personId_key" ON "StatutoryDetails"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "StatutoryDetails_panHash_key" ON "StatutoryDetails"("panHash");

-- CreateIndex
CREATE INDEX "BankAccount_personId_idx" ON "BankAccount"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_title_key" ON "Designation"("title");

-- CreateIndex
CREATE INDEX "Checklist_personId_kind_idx" ON "Checklist"("personId", "kind");

-- CreateIndex
CREATE INDEX "ChecklistTask_assigneeUserId_completedAt_idx" ON "ChecklistTask"("assigneeUserId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Separation_employmentId_key" ON "Separation"("employmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemApp_name_key" ON "SystemApp"("name");

-- CreateIndex
CREATE INDEX "AccessGrant_personId_revokedOn_idx" ON "AccessGrant"("personId", "revokedOn");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_serialNumber_key" ON "Asset"("serialNumber");

-- CreateIndex
CREATE INDEX "AssetAssignment_personId_returnedOn_idx" ON "AssetAssignment"("personId", "returnedOn");

-- CreateIndex
CREATE INDEX "AssetAssignment_assetId_returnedOn_idx" ON "AssetAssignment"("assetId", "returnedOn");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_personId_date_key" ON "AttendanceRecord"("personId", "date");

-- CreateIndex
CREATE INDEX "Regularisation_status_date_idx" ON "Regularisation"("status", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_name_key" ON "Holiday"("date", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_code_key" ON "LeaveType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicy_leaveTypeId_employmentType_key" ON "LeavePolicy"("leaveTypeId", "employmentType");

-- CreateIndex
CREATE INDEX "LeaveLedgerEntry_personId_leaveTypeId_leaveYear_idx" ON "LeaveLedgerEntry"("personId", "leaveTypeId", "leaveYear");

-- CreateIndex
CREATE INDEX "LeaveRequest_personId_startDate_idx" ON "LeaveRequest"("personId", "startDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_code_key" ON "SalaryComponent"("code");

-- CreateIndex
CREATE INDEX "SalaryStructure_employmentId_effectiveFrom_idx" ON "SalaryStructure"("employmentId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructureLine_structureId_componentId_key" ON "SalaryStructureLine"("structureId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_year_month_key" ON "PayrollRun"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_payslipFileId_key" ON "PayrollEntry"("payslipFileId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_runId_employmentId_key" ON "PayrollEntry"("runId", "employmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Reimbursement_receiptFileId_key" ON "Reimbursement"("receiptFileId");

-- CreateIndex
CREATE INDEX "Reimbursement_status_idx" ON "Reimbursement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BankExportFormat_name_key" ON "BankExportFormat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_storageKey_key" ON "StoredFile"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "PersonDocument_fileId_key" ON "PersonDocument"("fileId");

-- CreateIndex
CREATE INDEX "PersonDocument_personId_category_idx" ON "PersonDocument"("personId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_kind_version_key" ON "DocumentTemplate"("kind", "version");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_fileId_key" ON "GeneratedDocument"("fileId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_convertedFromId_fkey" FOREIGN KEY ("convertedFromId") REFERENCES "Employment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternDetails" ADD CONSTRAINT "InternDetails_employmentId_fkey" FOREIGN KEY ("employmentId") REFERENCES "Employment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternDetails" ADD CONSTRAINT "InternDetails_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatutoryDetails" ADD CONSTRAINT "StatutoryDetails_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplateTask" ADD CONSTRAINT "ChecklistTemplateTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTask" ADD CONSTRAINT "ChecklistTask_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Separation" ADD CONSTRAINT "Separation_employmentId_fkey" FOREIGN KEY ("employmentId") REFERENCES "Employment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "SystemApp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Regularisation" ADD CONSTRAINT "Regularisation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicy" ADD CONSTRAINT "LeavePolicy_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveLedgerEntry" ADD CONSTRAINT "LeaveLedgerEntry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveLedgerEntry" ADD CONSTRAINT "LeaveLedgerEntry_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveLedgerEntry" ADD CONSTRAINT "LeaveLedgerEntry_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_employmentId_fkey" FOREIGN KEY ("employmentId") REFERENCES "Employment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureLine" ADD CONSTRAINT "SalaryStructureLine_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureLine" ADD CONSTRAINT "SalaryStructureLine_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_employmentId_fkey" FOREIGN KEY ("employmentId") REFERENCES "Employment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_payslipFileId_fkey" FOREIGN KEY ("payslipFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntryLine" ADD CONSTRAINT "PayrollEntryLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "PayrollEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollAdjustment" ADD CONSTRAINT "PayrollAdjustment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollAdjustment" ADD CONSTRAINT "PayrollAdjustment_appliedInEntryId_fkey" FOREIGN KEY ("appliedInEntryId") REFERENCES "PayrollEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_receiptFileId_fkey" FOREIGN KEY ("receiptFileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_payrollEntryId_fkey" FOREIGN KEY ("payrollEntryId") REFERENCES "PayrollEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonDocument" ADD CONSTRAINT "PersonDocument_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonDocument" ADD CONSTRAINT "PersonDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One primary bank account per person (ignoring soft-deleted rows)
CREATE UNIQUE INDEX "BankAccount_one_primary_per_person" ON "BankAccount" ("personId") WHERE "isPrimary" AND "deletedAt" IS NULL;

-- One current employment per person
CREATE UNIQUE INDEX "Employment_one_current_per_person" ON "Employment" ("personId") WHERE "endedOn" IS NULL AND "deletedAt" IS NULL;
