const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ฟังก์ชันช่วย normalize field จาก backend
function normalizeCurriculum(raw: any): CurriculumDTO {
  return {
    ...raw,
    id: raw.id ?? raw.ID,
    faculty: raw.faculty ?? raw.Faculty,
    program: raw.program ?? raw.Program,
    required_documents: raw.required_documents ?? raw.RequiredDocuments ?? [],
    link: raw.link ?? raw.Link ?? "", // ✅ เพิ่ม Link
  };
}

function normalizeFaculty(raw: any): FacultyDTO {
  return {
    id: raw.id ?? raw.ID,
    name: raw.name ?? raw.Name,
    short_name: raw.short_name ?? raw.ShortName,
  };
}

function normalizeProgram(raw: any): ProgramDTO {
  return {
    id: raw.id ?? raw.ID,
    name: raw.name ?? raw.Name,
    short_name: raw.short_name ?? raw.ShortName,
  };
}

export type FacultyDTO = {
  id: number;
  name: string;
  short_name?: string;
};

export type ProgramDTO = {
  id: number;
  name: string;
  short_name?: string;
};

export type DocumentTypeDTO = {
  id: number;
  name: string;
};

export type CurriculumRequiredDocumentDTO = {
  id: number;
  is_optional: boolean;
  note?: string;
  document_type?: DocumentTypeDTO;
};

export type CurriculumDTO = {
  id: number;
  code: string;
  name: string;
  description: string;
  link?: string; // ✅ เพิ่ม Link (Optional)
  gpax_min: number;
  portfolio_max_pages: number;
  status: string;
  faculty?: FacultyDTO;
  program?: ProgramDTO;
  application_period?: string;
  quota?: number;
  required_documents?: CurriculumRequiredDocumentDTO[];
};

export type CurriculumSummaryDTO = {
  total_curricula: number;
  open_curricula: number;
  total_students: number;
  by_program: { program_name: string; student_count: number }[];
};

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// --------------------- Student: public search ---------------------

export async function fetchPublicCurricula(search: string) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());

  const res = await fetch(`${API_URL}/curricula?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("ไม่สามารถโหลดข้อมูลหลักสูตรได้");
  }

  const json = await res.json();
  const raw = json.data || [];
  return raw.map(normalizeCurriculum) as CurriculumDTO[];
}

// --------------------- Admin: dropdown faculties/programs ---------------------

export async function fetchFaculties() {
  const res = await fetch(`${API_URL}/admin/faculties`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("โหลดสำนักวิชาไม่สำเร็จ");
  const json = await res.json();
  const raw = json.data || [];
  return raw.map(normalizeFaculty) as FacultyDTO[];
}

export async function fetchPrograms(facultyId?: number) {
  const params = new URLSearchParams();
  if (facultyId) params.set("faculty_id", String(facultyId));

  const res = await fetch(
    `${API_URL}/admin/programs?${params.toString()}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("โหลดสาขาวิชาไม่สำเร็จ");
  const json = await res.json();
  const raw = json.data || [];
  return raw.map(normalizeProgram) as ProgramDTO[];
}

// --------------------- Admin: CRUD + summary ---------------------

export async function fetchAdminCurricula(search: string) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());

  const res = await fetch(
    `${API_URL}/admin/curricula?${params.toString()}`,
    {
      headers: authHeaders(),
    }
  );
  if (!res.ok) throw new Error("โหลดข้อมูลหลักสูตร (admin) ไม่ได้");

  const json = await res.json();
  const raw = json.data || [];
  return raw.map(normalizeCurriculum) as CurriculumDTO[];
}

// payload กลางที่ใช้ทั้งสร้าง/แก้ไข
export type CurriculumPayload = {
  code: string;
  name: string;
  description: string;
  link: string; // ✅ เพิ่ม Link ใน Payload
  gpax_min: number;
  portfolio_max_pages: number;
  status: string;
  faculty_id: number;
  program_id: number;
  user_id: number;
  application_period: string;
  quota: number;
};

export async function createCurriculum(payload: CurriculumPayload) {
  const res = await fetch(`${API_URL}/admin/curricula`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("สร้างหลักสูตรไม่สำเร็จ");
  }

  const json = await res.json();
  return json.data as CurriculumDTO;
}

export async function updateCurriculum(
  id: number,
  payload: CurriculumPayload
) {
  const res = await fetch(`${API_URL}/admin/curricula/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("อัปเดตหลักสูตรไม่สำเร็จ");
  }

  const json = await res.json();
  return json.data as CurriculumDTO;
}

export async function deleteCurriculum(id: number) {
  const res = await fetch(`${API_URL}/admin/curricula/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("ลบหลักสูตรไม่สำเร็จ");
  }
  return true;
}

export async function fetchCurriculumSummary() {
  const res = await fetch(`${API_URL}/admin/curricula/summary`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("โหลดสรุปข้อมูลหลักสูตรไม่สำเร็จ");
  }

  const json = await res.json();
  return json.data as CurriculumSummaryDTO;
}