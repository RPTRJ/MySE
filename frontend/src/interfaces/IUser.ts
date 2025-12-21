// frontend/interfaces/IUser.ts

export interface UserInterface {
  ID?: number;            // gorm.Model
  CreatedAt?: string;     // gorm.Model
  UpdatedAt?: string;     // gorm.Model
  DeletedAt?: string | null; // gorm.Model

  FirstNameTH?: string;
  LastNameTH?: string;
  FirstNameEN?: string;
  LastNameEN?: string;
  Email?: string;
  // Password ไม่ต้องนำมาใส่ใน Frontend Interface
  ProfileImageURL?: string;
  IDNumber?: string;
  Phone?: string;
  Birthday?: string;      // Go time.Time มักส่งมาเป็น String (ISO8601)
  PDPAConsent?: boolean;
  PDPAConsentAt?: string | null;
  ProfileCompleted?: boolean;

  // Foreign Keys
  AccountTypeID?: number;
  IDDocTypeID?: number;

  // Relations (ถ้ามี Interface ของ UserTypes หรือ IDTypes สามารถ import มาใส่ได้)
  AccountType?: any; 
  IDDocType?: any;
}