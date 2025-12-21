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

type Option = { id: string | number; name: string };
type SchoolOption = Option & { is_project_based?: boolean | null; school_type_id?: string | number | null };

const normalizeOptions = (items: any[]): Option[] =>
  items
    .map((item) => {
      const rawId = item?.id;
      const idNum = Number(rawId);
      const id = Number.isFinite(idNum) ? idNum : rawId ?? null;
      const name = item?.name;
      if (id === null || id === undefined || !name) return null;
      return { id, name };
    })
    .filter((item): item is Option => Boolean(item));

const coerceId = (value: any): string | number | null => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : String(value);
};

export default function EditEducationPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<{
    education_level_id: string | number | null;
    school_id: string | number | null;
    school_name: string;
    school_type_id: string | number | null;
    curriculum_type_id: string | number | null;
    is_project_based: boolean | null;
    graduation_year: number | null;
    status?: string;
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

  useEffect(() => {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
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
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "30" });
    if (schoolQuery.trim()) params.set("search", schoolQuery.trim());
    if (form.school_type_id !== null && form.school_type_id !== undefined) {
      params.set("school_type_id", String(form.school_type_id));
    }

    fetch(`${API_URL}/reference/schools?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items : data.data;
    if (Array.isArray(items)) {
      setSchools(
        items
          .map((s: any) => {
            const id = Number(s?.id);
            const name = s?.name;
            if (!Number.isFinite(id) || !name) return null;
            return {
              id,
              name,
              is_project_based: s?.is_project_based,
              school_type_id: s?.school_type_id ?? s?.schoolTypeID ?? null,
            };
          })
          .filter((s): s is SchoolOption => Boolean(s)),
      );
    }
      })
      .catch(() => {
        /* ignore fetch errors on typing */
      });

    return () => controller.abort();
  }, [token, schoolQuery, form.school_type_id]);

  const selectedEducationLevel = useMemo(
    () => educationLevels.find((lvl) => lvl.id === form.education_level_id),
    [educationLevels, form.education_level_id],
  );

  useEffect(() => {
    const levelName =
      educationLevels.find((l) => l.id === form.education_level_id)?.name || "";
    const matchTypes = (names: string[]) => schoolTypes.filter((t) => names.includes(t.name));

    let filtered: { id: number; name: string }[] = schoolTypes;
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
        "อาชีวศึกษา (วิทยาลัย/เทคนิค)",
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
    setAllowedSchoolTypes(filtered.length ? filtered : schoolTypes);

    if (form.education_level_id && filtered.length) {
      if (!filtered.some((t) => t.id === form.school_type_id)) {
        setForm((prev) => ({
          ...prev,
          school_type_id: filtered[0]?.id || null,
        }));
      }
    } else if (!form.education_level_id) {
      if (!schoolTypes.some((t) => t.id === form.school_type_id)) {
        setForm((prev) => ({ ...prev, school_type_id: null }));
      }
    }
  }, [educationLevels, form.education_level_id, form.school_type_id, schoolTypes]);

  useEffect(() => {
    const selected = curriculumTypes.find((c) => c.id === form.curriculum_type_id);
    if (selected) {
      setCurriculumQuery(selected.name);
    }
  }, [curriculumTypes, form.curriculum_type_id]);

  const loadReference = async (authToken: string) => {
    const headers = { Authorization: `Bearer ${authToken}` };
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

    const pickArray = (payload: any) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.data?.items)) return payload.data.items;
      return [];
    };

    const levels = pickArray(levelsData);
    const schoolTypeList = pickArray(schoolTypeData);
    const curriculumList = pickArray(curriculumData);

    setEducationLevels(levels.length ? normalizeOptions(levels) : []);
    setSchoolTypes(schoolTypeList.length ? normalizeOptions(schoolTypeList) : []);
    setCurriculumTypes(curriculumList.length ? normalizeOptions(curriculumList) : []);
  };

  const setFromEducation = (education?: ApiEducation) => {
    setForm({
      education_level_id: coerceId(education?.education_level_id ?? education?.education_level?.id),
      school_id: coerceId(education?.school_id),
      school_name: education?.school?.name || education?.school_name || "",
      school_type_id: coerceId(education?.school_type_id ?? education?.school_type?.id),
      curriculum_type_id: coerceId(education?.curriculum_type_id ?? education?.curriculum_type?.id),
      is_project_based: education?.is_project_based ?? null,
      graduation_year: education?.graduation_year ?? null,
      status: education?.status || "current",
    });
    setSchoolQuery(education?.school?.name || education?.school_name || "");
    const selectedCurriculum = education?.curriculum_type?.name;
    if (selectedCurriculum) setCurriculumQuery(selectedCurriculum);
  };

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || !token) return;

    setSaving(true);
    try {
      await upsertEducation(token, {
        education_level_id: Number(form.education_level_id) || 0,
        school_id: Number(form.school_id) || null,
        school_name: form.school_id ? undefined : form.school_name,
        school_type_id: Number(form.school_type_id) || null,
        curriculum_type_id: Number(form.curriculum_type_id) || null,
        is_project_based: form.is_project_based,
        graduation_year: form.graduation_year || undefined,
        status: form.status,
      });
      router.replace("/student/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลการศึกษาได้");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSchool = (school: SchoolOption) => {
    setForm((prev) => ({
      ...prev,
      school_id: school.id,
      school_name: school.name,
      is_project_based: school.is_project_based ?? prev.is_project_based,
      school_type_id: school.school_type_id ?? prev.school_type_id ?? null,
    }));
    setSchoolQuery(school.name);
    setShowSchoolList(false);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.school_name;
      return updated;
    });
  };

  const filteredSchools = useMemo(() => {
    const query = schoolQuery.trim().toLowerCase();
    return schools.filter((s) => {
      const matchesName = query ? s.name.toLowerCase().includes(query) : true;
      const matchesType =
        form.school_type_id !== null && form.school_type_id !== undefined
          ? String(s.school_type_id) === String(form.school_type_id)
          : true;
      return matchesName && matchesType;
    });
  }, [form.school_type_id, schoolQuery, schools]);

  const filteredCurriculums = useMemo(() => {
    const query = curriculumQuery.trim().toLowerCase();
    return curriculumTypes.filter((c) => c.name.toLowerCase().includes(query));
  }, [curriculumQuery, curriculumTypes]);

  const handleCurriculumChange = (value: string) => {
    setCurriculumQuery(value);
    const matched = curriculumTypes.find((c) => c.name.toLowerCase() === value.trim().toLowerCase());
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
              <div className="text-xl font-semibold text-gray-900">ข้อมูลการศึกษา</div>
              <div className="text-xs text-gray-600">ปรับให้ตรงกับฟอร์ม onboarding</div>
              {selectedEducationLevel ? (
                <div className="mt-2 text-sm text-gray-600">ระดับปัจจุบัน: {selectedEducationLevel.name}</div>
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
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">ระดับการศึกษา *</label>
                <select
                  className={`mt-1 block w-full bg-white border ${errors.education_level_id ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                  value={form.education_level_id ?? ""}
                  onChange={(e) => {
                    const value = coerceId(e.target.value) ?? null;
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
                  <p className="text-xs text-red-500 mt-1">{errors.education_level_id}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">ประเภทโรงเรียน</label>
                <select
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  value={form.school_type_id ?? ""}
                  onChange={(e) => {
                    const value = coerceId(e.target.value) ?? null;
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
                  {(allowedSchoolTypes.length ? allowedSchoolTypes : schoolTypes).map((type, idx) => (
                    <option key={`type-${type.id}-${idx}`} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-900">ชื่อสถานศึกษา *</label>
                <input
                  className={`mt-1 block w-full border ${errors.school_name ? "border-red-400" : "border-gray-300"} rounded-lg shadow-sm py-3 px-4 focus:ring-orange-500 focus:border-orange-500 text-gray-900`}
                  value={schoolQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSchoolQuery(value);
                    setForm((prev) => ({ ...prev, school_name: value, school_id: null }));
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
                <p className="text-xs text-gray-500 mt-1">ค้นหาแล้วเลือกจากระบบ หรือพิมพ์ชื่อเองได้</p>
                {errors.school_name ? <p className="text-xs text-red-500 mt-1">{errors.school_name}</p> : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">หลักสูตร</label>
                <div className="relative">
                  <input
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
