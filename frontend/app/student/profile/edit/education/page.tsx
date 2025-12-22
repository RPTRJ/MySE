"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiEducation,
  HttpError,
  fetchMyProfile,
  upsertEducation,
} from "@/services/profile";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ============================================================
// Helper Functions - รองรับทั้ง ID และ id จาก API (gorm.Model)
// ============================================================

type Option = { id: number; name: string };
type SchoolOption = Option & {
  is_project_based?: boolean | null;
  school_type_id?: number | null;
};

/**
 * ดึง array จาก API response ที่อาจมีหลาย format
 */
const pickArrayFromResponse = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
};

/**
 * ดึง ID จาก item - รองรับทั้ง id และ ID (gorm.Model ส่ง ID uppercase)
 */
const extractId = (item: any): number | null => {
  if (item?.id !== undefined && item?.id !== null) {
    const num = Number(item.id);
    if (Number.isFinite(num) && num > 0) return num;
  }
  if (item?.ID !== undefined && item?.ID !== null) {
    const num = Number(item.ID);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return null;
};

/**
 * ดึง Name จาก item - รองรับทั้ง name และ Name
 */
const extractName = (item: any): string | null => {
  if (item?.name !== undefined && item?.name !== null) {
    return String(item.name).trim();
  }
  if (item?.Name !== undefined && item?.Name !== null) {
    return String(item.Name).trim();
  }
  return null;
};

/**
 * แปลง array จาก API เป็น Option array
 * รองรับทั้ง {id, name} และ {ID, Name} จาก gorm.Model
 */
const normalizeOptions = (items: any[]): Option[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const id = extractId(item);
      const name = extractName(item);
      if (id === null || name === null || name === "") return null;
      return { id, name };
    })
    .filter((item): item is Option => item !== null);
};

/**
 * แปลงค่าเป็น number หรือ null
 */
const coerceId = (value: any): number | null => {
  if (value === null || value === undefined || value === "" || value === 0) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

// ============================================================

export default function EditEducationPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<{
    education_level_id: number | null;
    school_id: number | null;
    school_name: string;
    school_type_id: number | null;
    curriculum_type_id: number | null;
    is_project_based: boolean | null;
    graduation_year: number | null;
    status: string;
  }>({
    education_level_id: null,
    school_id: null,
    school_name: "",
    school_type_id: null,
    curriculum_type_id: null,
    is_project_based: null,
    graduation_year: null,
    status: "current",
  });

  const [educationLevels, setEducationLevels] = useState<Option[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<Option[]>([]);
  const [curriculumTypes, setCurriculumTypes] = useState<Option[]>([]);
  const [allowedSchoolTypes, setAllowedSchoolTypes] = useState<Option[]>([]);

  const [schoolQuery, setSchoolQuery] = useState("");
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [showSchoolList, setShowSchoolList] = useState(false);
  const [curriculumQuery, setCurriculumQuery] = useState("");
  const [showCurriculumList, setShowCurriculumList] = useState(false);

  // ============================================================
  // Load initial data
  // ============================================================
  useEffect(() => {
    const authToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!authToken) {
      router.replace("/login");
      return;
    }
    setToken(authToken);

    Promise.all([fetchMyProfile(authToken), loadReference(authToken)])
      .then(([profile]) => {
        setFromEducation(profile.education);
      })
      .catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        setError(
          err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้"
        );
      })
      .finally(() => setLoading(false));
  }, [router]);

  // ============================================================
  // Fetch schools
  // ============================================================
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "30" });
    if (schoolQuery.trim()) params.set("search", schoolQuery.trim());
    if (form.school_type_id !== null) {
      params.set("school_type_id", String(form.school_type_id));
    }

    fetch(`${API_URL}/reference/schools?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        const items = pickArrayFromResponse(data);

        // ✅ รองรับทั้ง id/ID และ name/Name
        const validSchools: SchoolOption[] = items
          .map((s: any): SchoolOption | null => {
            const id = extractId(s);
            const name = extractName(s);
            if (id === null || name === null) return null;
            const schoolTypeId = coerceId(
              s.school_type_id ?? s.SchoolTypeID ?? s.schoolTypeID
            );
            const rawProjectBased = s.is_project_based ?? s.IsProjectBased;
            return {
              id,
              name,
              is_project_based:
                rawProjectBased === undefined || rawProjectBased === null
                  ? null
                  : Boolean(rawProjectBased),
              school_type_id: schoolTypeId,
            };
          })
          .filter((s): s is SchoolOption => s !== null);

        setSchools(validSchools);
      })
      .catch(() => {
        /* ignore fetch errors on typing */
      });

    return () => controller.abort();
  }, [token, schoolQuery, form.school_type_id]);

  // ============================================================
  // Selected education level (for display)
  // ============================================================
  const selectedEducationLevel = useMemo(
    () => educationLevels.find((lvl) => lvl.id === form.education_level_id),
    [educationLevels, form.education_level_id]
  );

  // ============================================================
  // Filter allowed school types
  // ============================================================
  useEffect(() => {
    if (educationLevels.length === 0 || schoolTypes.length === 0) {
      return;
    }

    const levelName =
      educationLevels.find((l) => l.id === form.education_level_id)?.name || "";

    const matchTypes = (names: string[]) =>
      schoolTypes.filter((t) =>
        names.some((n) => t.name.includes(n) || n.includes(t.name))
      );

    let filtered: Option[] = [...schoolTypes];

    if (levelName.includes("GED")) {
      filtered = matchTypes([
        "โรงเรียนนานาชาติ",
        "ต่างประเทศ",
        "Homeschool",
        "โรงเรียนเอกชน",
        "อื่นๆ",
      ]);
    } else if (
      levelName.includes("อาชีวศึกษา") ||
      levelName.includes("ปวช") ||
      levelName.includes("ปวส")
    ) {
      filtered = matchTypes([
        "อาชีวศึกษา",
        "วิทยาลัย",
        "เทคนิค",
        "โรงเรียนรัฐบาล",
        "โรงเรียนเอกชน",
        "อื่นๆ",
      ]);
    } else if (levelName.includes("มัธยมศึกษาตอนปลาย")) {
      filtered = matchTypes([
        "โรงเรียนรัฐบาล",
        "โรงเรียนเอกชน",
        "โรงเรียนสาธิต",
        "โรงเรียนนานาชาติ",
        "กศน.",
        "อื่นๆ",
      ]);
    }

    const finalFiltered = filtered.length > 0 ? filtered : schoolTypes;
    setAllowedSchoolTypes(finalFiltered);
  }, [
    educationLevels,
    form.education_level_id,
    form.school_type_id,
    schoolTypes,
  ]);

  // ============================================================
  // Sync curriculum query with selected value
  // ============================================================
  useEffect(() => {
    const selected = curriculumTypes.find(
      (c) => c.id === form.curriculum_type_id
    );
    if (selected) {
      setCurriculumQuery(selected.name);
    }
  }, [curriculumTypes, form.curriculum_type_id]);

  // ============================================================
  // Load reference data
  // ============================================================
  const loadReference = async (authToken: string) => {
    const headers = { Authorization: `Bearer ${authToken}` };

    try {
      const [levelsRes, schoolTypesRes, curriculumRes] = await Promise.all([
        fetch(`${API_URL}/reference/education-levels`, { headers }),
        fetch(`${API_URL}/reference/school-types`, { headers }),
        fetch(`${API_URL}/reference/curriculum-types`, { headers }),
      ]);

      const [levelsData, schoolTypeData, curriculumData] = await Promise.all([
        levelsRes.json(),
        schoolTypesRes.json(),
        curriculumRes.json(),
      ]);

      // ✅ Debug log
      console.log("📚 Edit Page - API Response:", {
        levels: levelsData,
        schoolTypes: schoolTypeData,
        curriculums: curriculumData,
      });

      const levels = pickArrayFromResponse(levelsData);
      const schoolTypeList = pickArrayFromResponse(schoolTypeData);
      const curriculumList = pickArrayFromResponse(curriculumData);

      const normalizedLevels = normalizeOptions(levels);
      const normalizedSchoolTypes = normalizeOptions(schoolTypeList);
      const normalizedCurriculums = normalizeOptions(curriculumList);

      console.log("✅ Edit Page - Normalized:", {
        levels: normalizedLevels,
        schoolTypes: normalizedSchoolTypes,
        curriculums: normalizedCurriculums,
      });

      setEducationLevels(normalizedLevels);
      setSchoolTypes(normalizedSchoolTypes);
      setCurriculumTypes(normalizedCurriculums);
    } catch (error) {
      console.error("❌ Failed to load reference data:", error);
    }
  };

  // ============================================================
  // Set form from education data
  // ============================================================
  const setFromEducation = (education?: ApiEducation) => {
    if (!education) {
      setForm({
        education_level_id: null,
        school_id: null,
        school_name: "",
        school_type_id: null,
        curriculum_type_id: null,
        is_project_based: null,
        graduation_year: null,
        status: "current",
      });
      setSchoolQuery("");
      setCurriculumQuery("");
      return;
    }

    const levelId =
      coerceId(education.education_level_id) ??
      coerceId(education.education_level?.id);
    const schoolId = coerceId(education.school_id);
    const schoolTypeId =
      coerceId(education.school_type_id) ??
      coerceId(education.school_type?.id);
    const curriculumTypeId =
      coerceId(education.curriculum_type_id) ??
      coerceId(education.curriculum_type?.id);

    console.log("📝 Setting form from education:", {
      original: education,
      parsed: { levelId, schoolId, schoolTypeId, curriculumTypeId },
    });

    setForm({
      education_level_id: levelId,
      school_id: schoolId,
      school_name: education.school?.name || education.school_name || "",
      school_type_id: schoolTypeId,
      curriculum_type_id: curriculumTypeId,
      is_project_based: education.is_project_based ?? null,
      graduation_year: education.graduation_year ?? null,
      status: education.status || "current",
    });

    setSchoolQuery(education.school?.name || education.school_name || "");

    const selectedCurriculum = education.curriculum_type?.name;
    if (selectedCurriculum) {
      setCurriculumQuery(selectedCurriculum);
    }
  };

  // ============================================================
  // Validation
  // ============================================================
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.education_level_id) {
      newErrors.education_level_id = "กรุณาเลือกระดับการศึกษา";
    }
    if (!form.school_id && !form.school_name.trim()) {
      newErrors.school_name = "กรุณาเลือกหรือกรอกชื่อสถานศึกษา";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      return false;
    }
    setError(null);
    return true;
  };

  // ============================================================
  // Submit handler
  // ============================================================
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || !token) return;

    setSaving(true);
    try {
      const payload = {
        education_level_id: form.education_level_id ?? 0,
        school_id: form.school_id ?? null,
        school_name: form.school_id ? undefined : form.school_name.trim(),
        school_type_id: form.school_type_id ?? null,
        curriculum_type_id: form.curriculum_type_id ?? null,
        is_project_based: form.is_project_based,
        graduation_year: form.graduation_year || undefined,
        status: form.status,
      };

      console.log("📤 Submitting education:", payload);

      await upsertEducation(token, payload);
      router.replace("/student/profile");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลการศึกษาได้"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // Handle school selection
  // ============================================================
  const handleSelectSchool = (school: SchoolOption) => {
    setForm((prev) => ({
      ...prev,
      school_id: school.id,
      school_name: school.name,
      is_project_based: school.is_project_based ?? prev.is_project_based,
      school_type_id: school.school_type_id ?? prev.school_type_id,
    }));
    setSchoolQuery(school.name);
    setShowSchoolList(false);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.school_name;
      return updated;
    });
  };

  // ============================================================
  // Filtered lists
  // ============================================================
  const filteredSchools = useMemo(() => {
    const query = schoolQuery.trim().toLowerCase();
    return schools.filter((s) => {
      const matchesName = query ? s.name.toLowerCase().includes(query) : true;
      const matchesType =
        form.school_type_id !== null
          ? s.school_type_id === form.school_type_id
          : true;
      return matchesName && matchesType;
    });
  }, [form.school_type_id, schoolQuery, schools]);

  const filteredCurriculums = useMemo(() => {
    const query = curriculumQuery.trim().toLowerCase();
    return curriculumTypes.filter((c) => c.name.toLowerCase().includes(query));
  }, [curriculumQuery, curriculumTypes]);

  // ============================================================
  // Handle curriculum change
  // ============================================================
  const handleCurriculumChange = (value: string) => {
    setCurriculumQuery(value);
    const matched = curriculumTypes.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase()
    );
    setForm((prev) => ({
      ...prev,
      curriculum_type_id: matched ? matched.id : null,
    }));
    setShowCurriculumList(true);
  };

  const handleSelectCurriculum = (curriculum: Option) => {
    setForm((prev) => ({ ...prev, curriculum_type_id: curriculum.id }));
    setCurriculumQuery(curriculum.name);
    setShowCurriculumList(false);
  };

  // ============================================================
  // Render
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50 text-gray-700">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-gray-900">
                ข้อมูลการศึกษา
              </div>
              <div className="text-xs text-gray-600">
                ปรับให้ตรงกับฟอร์ม onboarding
              </div>
              {selectedEducationLevel ? (
                <div className="mt-2 text-sm text-gray-600">
                  ระดับปัจจุบัน: {selectedEducationLevel.name}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-orange-500 hover:underline px-3 py-1 rounded-full bg-orange-50"
            >
              ย้อนกลับ
            </button>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="education-level"
                  className="block text-sm font-medium text-gray-900"
                >
                  ระดับการศึกษา *
                </label>
                <select
                  id="education-level"
                  className={`mt-1 block w-full bg-white border ${errors.education_level_id ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                  value={form.education_level_id ?? 0}
                  onChange={(e) => {
                    const value = coerceId(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      education_level_id: value,
                      school_id: null,
                      school_name: "",
                      is_project_based: null,
                    }));
                    setSchoolQuery("");
                    setShowSchoolList(false);
                  }}
                >
                  <option value={0}>-- กรุณาเลือก --</option>
                  {educationLevels.map((level, idx) => (
                    <option key={`level-${level.id}-${idx}`} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
                {errors.education_level_id ? (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.education_level_id}
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="school-type"
                  className="block text-sm font-medium text-gray-900"
                >
                  ประเภทโรงเรียน
                </label>
                <select
                  id="school-type"
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.school_type_id ?? 0}
                  onChange={(e) => {
                    const value = coerceId(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      school_type_id: value,
                      school_id: null,
                      school_name: "",
                      is_project_based: null,
                    }));
                    setSchoolQuery("");
                    setShowSchoolList(false);
                  }}
                >
                  <option value={0}>-</option>
                  {(allowedSchoolTypes.length
                    ? allowedSchoolTypes
                    : schoolTypes
                  ).map((type, idx) => (
                    <option key={`type-${type.id}-${idx}`} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label
                  htmlFor="school-name"
                  className="block text-sm font-medium text-gray-900"
                >
                  ชื่อสถานศึกษา *
                </label>
                <input
                  id="school-name"
                  className={`mt-1 block w-full border ${errors.school_name ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                  value={schoolQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSchoolQuery(value);
                    setForm((prev) => ({
                      ...prev,
                      school_name: value,
                      school_id: null,
                    }));
                  }}
                  onFocus={() => setShowSchoolList(true)}
                  placeholder="ค้นหาชื่อโรงเรียน..."
                  autoComplete="off"
                />
                {showSchoolList && filteredSchools.length > 0 ? (
                  <div className="absolute z-10 mt-1 w-full max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredSchools.map((school, idx) => (
                      <button
                        key={`school-${school.id}-${idx}`}
                        type="button"
                        onMouseDown={() => handleSelectSchool(school)}
                        className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm text-gray-900"
                      >
                        {school.name}
                      </button>
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-gray-500 mt-1">
                  ค้นหาแล้วเลือกจากระบบ หรือพิมพ์ชื่อเองได้
                </p>
                {errors.school_name ? (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.school_name}
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="curriculum-type"
                  className="block text-sm font-medium text-gray-900"
                >
                  หลักสูตร
                </label>
                <div className="relative">
                  <input
                    id="curriculum-type"
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    value={curriculumQuery}
                    onChange={(e) => handleCurriculumChange(e.target.value)}
                    onFocus={() => setShowCurriculumList(true)}
                    placeholder="ค้นหาหลักสูตร..."
                    autoComplete="off"
                  />
                  {showCurriculumList && filteredCurriculums.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {filteredCurriculums.map((curriculum) => (
                        <button
                          type="button"
                          key={curriculum.id}
                          onMouseDown={() => handleSelectCurriculum(curriculum)}
                          className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm text-gray-900"
                        >
                          {curriculum.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/student/profile")}
                className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
