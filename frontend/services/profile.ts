const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type ScoreType = "ged" | "academic" | "none" | "";

export interface ProfileUser {
  id?: number;
  first_name_th?: string;
  last_name_th?: string;
  first_name_en?: string;
  last_name_en?: string;
  phone?: string;
  birthday?: string;
  profile_image_url?: string;
  email?: string;
}

export interface ProfileEducation {
  id?: number;
  education_level_id?: number;
  curriculum_type_id?: number;
  curriculum_id?: number;
  is_project_based?: boolean;
  education_level?: { id: number; name: string };
  curriculum_type?: { id: number; name: string };
}

export interface GEDScore {
  total_score?: number;
  rla_score?: number;
  math_score?: number;
  science_score?: number;
  social_score?: number;
  cert_file_path?: string;
}

export interface AcademicScore {
  gpax?: number;
  gpax_semesters?: number;
  gpa_math?: number;
  gpa_science?: number;
  gpa_thai?: number;
  gpa_english?: number;
  gpa_social?: number;
  gpa_total_score?: number;
  transcript_file_path?: string;
}

export interface LanguageScore {
  id?: number;
  test_type: string;
  score?: string;
  test_level?: string;
  sat_math?: number | null;
  test_date?: string;
  cert_file_path?: string;
}

export interface BTDTestScore {
  id?: number;
  test_type: string;
  subject?: string;
  raw_score?: number;
  exam_year?: number;
  cert_file_path?: string;
}

export interface StudentProfile {
  user: ProfileUser;
  education?: ProfileEducation;
  ged_score?: GEDScore;
  academic_score?: AcademicScore;
  language_scores: LanguageScore[];
  btd_test_scores: BTDTestScore[];
  options: {
    education_levels: { id: number; name: string }[];
    curriculum_types: { id: number; name: string }[];
  };
}

export interface UpdateStudentProfilePayload {
  user: {
    first_name_th?: string;
    last_name_th?: string;
    first_name_en?: string;
    last_name_en?: string;
    phone?: string;
    birthday?: string;
    profile_image_url?: string;
  };
  education?: {
    education_level_id?: number;
    education_level_name?: string;
    curriculum_type_id?: number;
    curriculum_type_name?: string;
    curriculum_id?: number;
    is_project_based?: boolean;
  };
  score_type: ScoreType;
  ged_score?: GEDScore;
  academic_score?: AcademicScore;
  language_scores: LanguageScore[];
  btd_test_scores: BTDTestScore[];
}

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function uploadFile(file: File): Promise<string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    throw new Error("อัปโหลดไฟล์ไม่สำเร็จ");
  }
  const json = await res.json();
  return json.url || json.data?.url || json?.url;
}

const normalizeDate = (value?: string) =>
  value ? value.split("T")[0] : undefined;

function normalizeEducation(raw: any): ProfileEducation | undefined {
  if (!raw) return undefined;
  return {
    id: raw.id ?? raw.ID,
    education_level_id: raw.education_level_id ?? raw.EducationLevelID,
    curriculum_type_id: raw.curriculum_type_id ?? raw.CurriculumTypeID,
    curriculum_id: raw.curriculum_id ?? raw.CurriculumID,
    is_project_based: raw.is_project_based ?? raw.IsProjectBased,
    education_level: raw.education_level
      ? {
          id:
            raw.education_level.id ??
            raw.education_level.ID ??
            raw.EducationLevel?.ID,
          name:
            raw.education_level.name ??
            raw.education_level.Name ??
            raw.EducationLevel?.Name,
        }
      : undefined,
    curriculum_type: raw.curriculum_type
      ? {
          id:
            raw.curriculum_type.id ??
            raw.curriculum_type.ID ??
            raw.CurriculumType?.ID,
          name:
            raw.curriculum_type.name ??
            raw.curriculum_type.Name ??
            raw.CurriculumType?.Name,
        }
      : undefined,
  };
}

function normalizeOptions(raw: any) {
  const levels = raw?.education_levels || raw?.EducationLevels || [];
  const types = raw?.curriculum_types || raw?.CurriculumTypes || [];

  return {
    education_levels: levels.map((l: any) => ({
      id: l.id ?? l.ID,
      name: l.name ?? l.Name,
    })),
    curriculum_types: types.map((t: any) => ({
      id: t.id ?? t.ID,
      name: t.name ?? t.Name,
    })),
  };
}

function normalizeLanguage(raw: any): LanguageScore {
  return {
    id: raw.id ?? raw.ID,
    test_type: raw.test_type ?? raw.TestType ?? "",
    score: raw.score ?? raw.Score,
    test_level: raw.test_level ?? raw.TestLevel,
    sat_math:
      raw.sat_math ?? raw.SATMath ?? raw.satMath ?? raw.SAT_Math ?? null,
    test_date: normalizeDate(raw.test_date ?? raw.TestDate),
    cert_file_path: raw.cert_file_path ?? raw.CertFilePath,
  };
}

function normalizeBTD(raw: any): BTDTestScore {
  return {
    id: raw.id ?? raw.ID,
    test_type: raw.test_type ?? raw.TestType ?? "",
    subject: raw.subject ?? raw.Subject,
    raw_score: raw.raw_score ?? raw.RawScore,
    exam_year: raw.exam_year ?? raw.ExamYear,
    cert_file_path: raw.cert_file_path ?? raw.CertFilePath,
  };
}

function normalizeProfile(raw: any): StudentProfile {
  const user = raw.user || {};
  return {
    user: {
      id: user.id ?? user.ID,
      first_name_th: user.first_name_th ?? user.FirstNameTH,
      last_name_th: user.last_name_th ?? user.LastNameTH,
      first_name_en: user.first_name_en ?? user.FirstNameEN,
      last_name_en: user.last_name_en ?? user.LastNameEN,
      phone: user.phone ?? user.Phone,
      birthday: normalizeDate(user.birthday ?? user.Birthday),
      profile_image_url: user.profile_image_url ?? user.ProfileImageURL,
      email: user.email ?? user.Email,
    },
    education: normalizeEducation(raw.education),
    ged_score: raw.ged_score || raw.GEDScore || undefined,
    academic_score: raw.academic_score || raw.AcademicScore || undefined,
    language_scores: (raw.language_scores || raw.LanguageScores || []).map(
      normalizeLanguage
    ),
    btd_test_scores: (raw.btd_test_scores || raw.BTDTestScores || []).map(
      normalizeBTD
    ),
    options: normalizeOptions(raw.options || raw.Options || {}),
  };
}

export async function getStudentProfile(): Promise<StudentProfile> {
  const res = await fetch(`${API_URL}/students/me/profile`, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ");
  }

  const json = await res.json();
  return normalizeProfile(json.data || {});
}

export async function updateStudentProfile(
  payload: UpdateStudentProfilePayload
): Promise<StudentProfile> {
  const res = await fetch(`${API_URL}/students/me/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ");
  }

  const json = await res.json();
  return normalizeProfile(json.data || {});
}

export const profileUploads = {
  uploadFile,
};
