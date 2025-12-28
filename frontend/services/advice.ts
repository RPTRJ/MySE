const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type SkillDTO = {
  id: number;
  skill_name_th: string;
  skill_name_en: string;
  category: number;
  description?: string;
};

export type CourseDTO = {
  id: number;
  course_code: string;
  course_name_th: string;
  course_name_en: string;
  credits: number;
  category: number;
  description?: string;
};

export type AdviceDTO = {
  id: number;
  program_code: string;
  program_name_th: string;
  program_name_en: string;
  description?: string;
  is_active?: boolean;
  skills?: SkillDTO[];
  courses?: CourseDTO[];
};

export type CreateSkillPayload = Omit<SkillDTO, "id">;
export type CreateCoursePayload = Omit<CourseDTO, "id">;
export type CreateAdvicePayload = {
  program_code: string;
  program_name_th: string;
  program_name_en: string;
  description?: string;
  is_active?: boolean;
  skill_ids?: number[];
  course_ids?: number[];
};

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeSkill(raw: any): SkillDTO {
  return {
    id: Number(raw.id ?? raw.ID ?? 0),
    skill_name_th: raw.skill_name_th ?? raw.SkillNameTH ?? "",
    skill_name_en: raw.skill_name_en ?? raw.SkillNameEN ?? "",
    category: Number(raw.category ?? raw.Category ?? 0),
    description: raw.description ?? raw.Description ?? "",
  };
}

function normalizeCourse(raw: any): CourseDTO {
  return {
    id: Number(raw.id ?? raw.ID ?? 0),
    course_code: raw.course_code ?? raw.CourseCode ?? "",
    course_name_th: raw.course_name_th ?? raw.CourseNameTH ?? "",
    course_name_en: raw.course_name_en ?? raw.CourseNameEN ?? "",
    credits: Number(raw.credits ?? raw.Credits ?? 0),
    category: Number(raw.category ?? raw.Category ?? 0),
    description: raw.description ?? raw.Description ?? "",
  };
}

function normalizeAdvice(raw: any): AdviceDTO {
  const rawSkills = raw.advice_skills ?? raw.AdviceSkills ?? [];
  const rawCourses = raw.advice_courses ?? raw.AdviceCourses ?? [];

  return {
    id: Number(raw.id ?? raw.ID ?? 0),
    program_code: raw.program_code ?? raw.ProgramCode ?? "",
    program_name_th: raw.program_name_th ?? raw.ProgramNameTH ?? "",
    program_name_en: raw.program_name_en ?? raw.ProgramNameEN ?? "",
    description: raw.description ?? raw.Description ?? "",
    is_active: Boolean(raw.is_active ?? raw.IsActive ?? true),
    skills: rawSkills.map((s: any) => normalizeSkill(s.skill ?? s.Skill ?? s)),
    courses: rawCourses.map((c: any) => normalizeCourse(c.course ?? c.Course ?? c)),
  };
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSkills(): Promise<SkillDTO[]> {
  const res = await fetch(`${API_URL}/teacher/advice/skills`, { headers: authHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error("โหลดรายการทักษะไม่สำเร็จ");
  const json = (await safeJson(res)) || {};
  const raw = json.data ?? json ?? [];
  return Array.isArray(raw) ? raw.map(normalizeSkill) : [];
}

export async function createSkill(payload: CreateSkillPayload): Promise<SkillDTO> {
  const res = await fetch(`${API_URL}/teacher/advice/skills`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("บันทึกทักษะไม่สำเร็จ");
  const json = (await safeJson(res)) || {};
  return normalizeSkill(json.data ?? json);
}

export async function updateSkill(id: number, payload: CreateSkillPayload): Promise<SkillDTO> {
  const res = await fetch(`${API_URL}/teacher/advice/skills/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("อัปเดตทักษะไม่สำเร็จ");
  const json = (await safeJson(res)) || {};
  return normalizeSkill(json.data ?? json);
}

export async function deleteSkill(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/teacher/advice/skills/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("ลบทักษะไม่สำเร็จ");
}

export async function fetchCourses(): Promise<CourseDTO[]> {
  const res = await fetch(`${API_URL}/teacher/advice/courses`, { headers: authHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error("โหลดรายวิชาไม่สำเร็จ");
  const json = (await safeJson(res)) || {};
  const raw = json.data ?? json ?? [];
  return Array.isArray(raw) ? raw.map(normalizeCourse) : [];
}

export async function createCourse(payload: CreateCoursePayload): Promise<CourseDTO> {
  const res = await fetch(`${API_URL}/teacher/advice/courses`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("บันทึกรายวิชาไม่สำเร็จ");
  const json = (await safeJson(res)) || {};
  return normalizeCourse(json.data ?? json);
}

export async function updateCourse(id: number, payload: CreateCoursePayload): Promise<CourseDTO> {
  const res = await fetch(`${API_URL}/teacher/advice/courses/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("อัปเดตรายวิชาไม่สำเร็จ");
  const json = (await safeJson(res)) || {};
  return normalizeCourse(json.data ?? json);
}

export async function deleteCourse(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/teacher/advice/courses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("ลบรายวิชาไม่สำเร็จ");
}

export async function fetchAdvices(): Promise<AdviceDTO[]> {
  const res = await fetch(`${API_URL}/teacher/advice`, { headers: authHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error("โหลดคำแนะนำไม่สำเร็จ");
  const json = (await safeJson(res)) || {};
  const raw = json.data ?? json ?? [];
  return Array.isArray(raw) ? raw.map(normalizeAdvice) : [];
}

export async function createAdvice(payload: CreateAdvicePayload): Promise<AdviceDTO> {
  const res = await fetch(`${API_URL}/teacher/advice`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("บันทึกคำแนะนำไม่สำเร็จ");
  const json = (await safeJson(res)) || {};
  return normalizeAdvice(json.data ?? json);
}

export async function updateAdvice(id: number, payload: CreateAdvicePayload): Promise<AdviceDTO> {
  const res = await fetch(`${API_URL}/teacher/advice/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("อัปเดตคำแนะนำไม่สำเร็จ");
  const json = (await safeJson(res)) || {};
  return normalizeAdvice(json.data ?? json);
}

export async function deleteAdvice(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/teacher/advice/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("ลบคำแนะนำไม่สำเร็จ");
}
