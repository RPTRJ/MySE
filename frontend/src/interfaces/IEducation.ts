// frontend/interfaces/IEducation.ts
import { UserInterface } from "./IUser";

// Enum สำหรับ Status
export type EducationStatus = "current" | "graduated" | "other";

export interface EducationInterface {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;

  // User Relation
  UserID?: number;
  User?: UserInterface;

  // Education Level Relation
  EducationLevelID?: number;
  EducationLevel?: EducationLevelInterface;

  // School Relation
  SchoolID?: number | null; // Pointer ใน Go คือ nullable
  School?: SchoolInterface | null;
  SchoolName?: string;      // กรณีโรงเรียนอื่นๆ ที่ไม่ได้อยู่ในระบบ

  // School Type Relation
  SchoolTypeID?: number | null;
  SchoolType?: SchoolTypeInterface | null;

  // Curriculum Type Relation
  CurriculumTypeID?: number | null;
  CurriculumType?: CurriculumTypeInterface | null;

  IsProjectBased?: boolean | null;
  Status?: EducationStatus;
  StartDate?: string | null;
  EndDate?: string | null;
  GraduationYear?: number | null;
}

// --- Master Data Interfaces ---

export interface EducationLevelInterface {
  ID?: number;
  Name?: string;
}

export interface SchoolTypeInterface {
  ID?: number;
  Name?: string;
}

export interface CurriculumTypeInterface {
  ID?: number;
  Name?: string;
}

export interface SchoolInterface {
  ID?: number;
  Code?: string;
  Name?: string;
  SchoolTypeID?: number;
  SchoolType?: SchoolTypeInterface;
  IsProjectBased?: boolean;
}