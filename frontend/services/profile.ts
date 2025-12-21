const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ApiUser = {
  id: number;
  first_name_th?: string;
  last_name_th?: string;
  first_name_en?: string;
  last_name_en?: string;
  email: string;
  phone?: string;
  birthday?: string;
  profile_image_url?: string;
  profile_completed?: boolean;
  pdpa_consent?: boolean;
  type_id?: number;
};

export type ApiEducation = {
  id?: number;
  education_level_id?: number;
  education_level?: { id: number; name: string };
  school_id?: number | null;
  school_name?: string;
  school_type?: { id: number; name: string };
  curriculum_type?: { id: number; name: string };
  status?: string;
  graduation_year?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_project_based?: boolean | null;
};

export type ApiAcademicScore = {
  gpax?: number;
  gpax_semesters?: number;
  gpa_math?: number;
  gpa_science?: number;
  gpa_thai?: number;
  gpa_english?: number;
  gpa_social?: number;
  gpa_total_score?: number;
  transcript_file_path?: string;
};

export type ApiGEDScore = {
  total_score?: number;
  rla_score?: number;
  math_score?: number;
  science_score?: number;
  social_score?: number;
  cert_file_path?: string;
};

export type ApiLanguageScore = {
  id?: number;
  test_type: string;
  score?: string;
  test_level?: string;
  test_date?: string;
  cert_file_path?: string;
  sat_math?: number | null;
};

export type ProfileResponse = {
  user: ApiUser;
  education?: ApiEducation;
  academic_score?: ApiAcademicScore;
  ged_score?: ApiGEDScore;
  language_scores: ApiLanguageScore[];
};

export async function fetchMyProfile(token: string): Promise<ProfileResponse> {
  const res = await fetch(`${API_URL}/users/me/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new HttpError(res.status, data?.error || "Failed to load profile");
  }

  return {
    user: data.user as ApiUser,
    education: data.education as ApiEducation | undefined,
    academic_score: data.academic_score as ApiAcademicScore | undefined,
    ged_score: data.ged_score as ApiGEDScore | undefined,
    language_scores: (data.language_scores as ApiLanguageScore[]) || [],
  };
}
