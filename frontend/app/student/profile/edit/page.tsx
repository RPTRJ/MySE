"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Save, Plus, Upload } from "lucide-react";
import toast from "react-hot-toast";
import {
  getStudentProfile,
  updateStudentProfile,
  StudentProfile,
  ScoreType,
  profileUploads,
  LanguageScore,
  BTDTestScore,
} from "../../../../services/profile";
import { fetchPublicCurricula, CurriculumDTO } from "../../../../services/curriculum";
import {
  SCHOOL_LOCATION_OPTIONS,
  SCHOOL_TYPE_FROM_LOCATION,
  SchoolLocationKey,
  inferLocationFromTypeName,
} from "@/services/schoolOptions";

type LanguageForm = {
  test_type: string;
  score: string;
  test_level: string;
  sat_math: string;
  test_date: string;
  cert_file_path: string;
};

type BTDForm = {
  test_type: string;
  subject: string;
  raw_score: string;
  exam_year: string;
  cert_file_path: string;
};

const emptyLang: LanguageForm = {
  test_type: "",
  score: "",
  test_level: "",
  sat_math: "",
  test_date: "",
  cert_file_path: "",
};

const emptyBTD: BTDForm = {
  test_type: "",
  subject: "",
  raw_score: "",
  exam_year: "",
  cert_file_path: "",
};

const heroGradient = "bg-[linear-gradient(120deg,#ffe2c3_0%,#fff6ec_35%,#ffd7b1_100%)]";
const cardClass = "rounded-3xl border border-orange-100 bg-white shadow-sm p-5 space-y-4";
const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none text-gray-900 placeholder:text-gray-400";
const selectClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none text-gray-900";
const labelClass = "text-sm font-medium text-gray-700";
const splitFullName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  const first = parts.shift() || "";
  return { first, last: parts.join(" ") };
};
const joinFullName = (first?: string, last?: string) =>
  [first, last].filter(Boolean).join(" ").trim();
export default function StudentProfileEditPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [data, setData] = useState<StudentProfile | null>(null);
  const sectionTabs = [
    { key: "user", label: "ข้อมูลส่วนตัว" },
    { key: "education", label: "การศึกษา" },
    { key: "scores", label: "คะแนน GED/Academic" },
    { key: "language", label: "คะแนนภาษา" },
    { key: "btd", label: "คะแนน BT-D" },
  ] as const;
  const [activeSection, setActiveSection] = useState<string>("user");

  const [userForm, setUserForm] = useState({
    first_name_th: "",
    last_name_th: "",
    first_name_en: "",
    last_name_en: "",
    phone: "",
    birthday: "",
    profile_image_url: "",
  });
  const [fullNameInput, setFullNameInput] = useState("");

  const [educationForm, setEducationForm] = useState({
    education_level_id: "",
    education_level_name: "",
    school_id: "",
    school_name: "",
    school_type_name: "",
    curriculum_type_id: "",
    curriculum_type_name: "",
    curriculum_id: "",
    is_project_based: false,
  });

  const [scoreType, setScoreType] = useState<ScoreType>("none");
  const [gedForm, setGedForm] = useState({
    total_score: "",
    rla_score: "",
    math_score: "",
    science_score: "",
    social_score: "",
    cert_file_path: "",
  });
  const [academicForm, setAcademicForm] = useState({
    gpax: "",
    gpax_semesters: "",
    gpa_math: "",
    gpa_science: "",
    gpa_thai: "",
    gpa_english: "",
    gpa_social: "",
    gpa_total_score: "",
    transcript_file_path: "",
  });
  const [languageForms, setLanguageForms] = useState<LanguageForm[]>([]);
  const [btdForms, setBtdForms] = useState<BTDForm[]>([]);

  const [options, setOptions] = useState({
    education_levels: [] as { id: number; name: string }[],
    curriculum_types: [] as { id: number; name: string }[],
    schools: [] as {
      id: number;
      name: string;
      school_type?: { id: number; name: string };
      is_project_based?: boolean;
    }[],
    school_types: [] as { id: number; name: string }[],
  });
  const [schoolLocation, setSchoolLocation] = useState<SchoolLocationKey | "">(
    "",
  );
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef<HTMLDivElement | null>(null);
  const [curricula, setCurricula] = useState<CurriculumDTO[]>([]);
  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    loadCurricula("");
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      const exists = sectionTabs.find((s) => s.key === hash);
      if (exists) setActiveSection(hash);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!schoolDropdownRef.current || schoolDropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setSchoolDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStudentProfile();
      applyProfileToForm(data);
    } catch (err: any) {
      setError(err?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const loadCurricula = async (searchValue: string) => {
    setCurriculumLoading(true);
    try {
      const list = await fetchPublicCurricula(searchValue);
      setCurricula(list);
    } catch {
      // ignore optional load errors
    } finally {
      setCurriculumLoading(false);
    }
  };

  const domesticTypeName = SCHOOL_TYPE_FROM_LOCATION.domestic;

  const filteredSchools = useMemo(() => {
    const keyword = schoolSearch.trim().toLowerCase();
    return options.schools.filter((s) => {
      const matchesType = s.school_type?.name === domesticTypeName;
      const matchesKeyword = keyword
        ? (s.name || "").toLowerCase().includes(keyword)
        : true;
      return matchesType && matchesKeyword;
    });
  }, [options.schools, schoolSearch, domesticTypeName]);

  const handleFileUpload = async (file: File, key: string, onDone: (url: string) => void) => {
    try {
      setUploadingKey(key);
      const url = await profileUploads.uploadFile(file);
      onDone(url);
    } catch (err: any) {
      setError(err?.message || "อัปโหลดไฟล์ไม่สำเร็จ");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleLocationChange = (value: SchoolLocationKey | "") => {
    const typeName = value ? SCHOOL_TYPE_FROM_LOCATION[value] : "";
    setSchoolLocation(value);
    setEducationForm((prev) => ({
      ...prev,
      school_type_name: typeName,
      school_id: value === "domestic" ? prev.school_id : "",
      school_name: value === "domestic" ? prev.school_name : "",
    }));
    if (value === "domestic") {
      setSchoolSearch("");
    } else {
      setSchoolSearch("");
      setSchoolDropdownOpen(false);
    }
  };

  const handleSchoolSearchChange = (value: string) => {
    setSchoolSearch(value);
    setSchoolDropdownOpen(true);
  };

  const handleSchoolSelect = (schoolName: string, schoolId: string) => {
    setEducationForm((prev) => ({
      ...prev,
      school_name: schoolName,
      school_id: schoolId,
      school_type_name: domesticTypeName,
    }));
    setSchoolSearch("");
    setSchoolDropdownOpen(false);
  };

  const applyProfileToForm = (data: StudentProfile) => {
    setData(data);
    const user = data.user || {};
    setUserForm({
      first_name_th: user.first_name_th || "",
      last_name_th: user.last_name_th || "",
      first_name_en: user.first_name_en || "",
      last_name_en: user.last_name_en || "",
      phone: user.phone || "",
      birthday: user.birthday || "",
      profile_image_url: user.profile_image_url || "",
    });
    setFullNameInput(
      joinFullName(user.first_name_th, user.last_name_th) ||
        joinFullName(user.first_name_en, user.last_name_en),
    );

    const edu = data.education;
    const matchedSchool = data.options?.schools?.find(
      (s) => s.id === edu?.school_id,
    );
    const schoolTypeName =
      edu?.school?.school_type?.name ||
      edu?.school_type?.name ||
      matchedSchool?.school_type?.name ||
      edu?.school_type_name ||
      "";
    const schoolName =
      edu?.school?.name || edu?.school_name || matchedSchool?.name || "";
    const location = inferLocationFromTypeName(schoolTypeName);
    setSchoolLocation(location);
    setSchoolSearch("");
    setEducationForm({
      education_level_id: edu?.education_level_id ? String(edu.education_level_id) : "",
      education_level_name: edu?.education_level?.name || "",
      school_id: edu?.school_id ? String(edu.school_id) : "",
      school_name: schoolName,
      school_type_name: schoolTypeName,
      curriculum_type_id: edu?.curriculum_type_id ? String(edu.curriculum_type_id) : "",
      curriculum_type_name: edu?.curriculum_type?.name || "",
      curriculum_id: edu?.curriculum_id ? String(edu.curriculum_id) : "",
      is_project_based: edu?.is_project_based ?? false,
    });

    if (data.ged_score) {
      setScoreType("ged");
      setGedForm({
        total_score: data.ged_score.total_score?.toString() || "",
        rla_score: data.ged_score.rla_score?.toString() || "",
        math_score: data.ged_score.math_score?.toString() || "",
        science_score: data.ged_score.science_score?.toString() || "",
        social_score: data.ged_score.social_score?.toString() || "",
        cert_file_path: data.ged_score.cert_file_path || "",
      });
    } else if (data.academic_score) {
      setScoreType("academic");
      setAcademicForm({
        gpax: data.academic_score.gpax?.toString() || "",
        gpax_semesters: data.academic_score.gpax_semesters?.toString() || "",
        gpa_math: data.academic_score.gpa_math?.toString() || "",
        gpa_science: data.academic_score.gpa_science?.toString() || "",
        gpa_thai: data.academic_score.gpa_thai?.toString() || "",
        gpa_english: data.academic_score.gpa_english?.toString() || "",
        gpa_social: data.academic_score.gpa_social?.toString() || "",
        gpa_total_score: data.academic_score.gpa_total_score?.toString() || "",
        transcript_file_path: data.academic_score.transcript_file_path || "",
      });
    } else {
      setScoreType("none");
    }

    setLanguageForms(
      data.language_scores && data.language_scores.length > 0
        ? data.language_scores.map((l: LanguageScore) => ({
            test_type: l.test_type || "",
            score: l.score || "",
            test_level: l.test_level || "",
            sat_math: l.sat_math !== undefined && l.sat_math !== null ? String(l.sat_math) : "",
            test_date: l.test_date || "",
            cert_file_path: l.cert_file_path || "",
          }))
        : []
    );

    setBtdForms(
      data.btd_test_scores && data.btd_test_scores.length > 0
        ? data.btd_test_scores.map((b: BTDTestScore) => ({
            test_type: b.test_type || "",
            subject: b.subject || "",
            raw_score: b.raw_score !== undefined && b.raw_score !== null ? String(b.raw_score) : "",
            exam_year: b.exam_year !== undefined && b.exam_year !== null ? String(b.exam_year) : "",
            cert_file_path: b.cert_file_path || "",
          }))
        : []
    );

    setOptions({
      education_levels: data.options?.education_levels || [],
      curriculum_types: data.options?.curriculum_types || [],
      schools: data.options?.schools || [],
      school_types: data.options?.school_types || [],
    });
  };
  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const nameValue = fullNameInput.trim();
      const hasThai = /[\u0E00-\u0E7F]/.test(nameValue);
      const hasLatin = /[A-Za-z]/.test(nameValue);
      if (nameValue && hasThai && hasLatin) {
        const message =
          "กรุณากรอกชื่อเป็นภาษาไทยหรือภาษาอังกฤษอย่างใดอย่างหนึ่ง";
        setError(message);
        toast.error(message);
        setSaving(false);
        return;
      }
      const locationTypeName =
        schoolLocation && SCHOOL_TYPE_FROM_LOCATION[schoolLocation as SchoolLocationKey]
          ? SCHOOL_TYPE_FROM_LOCATION[schoolLocation as SchoolLocationKey]
          : educationForm.school_type_name;
      const schoolIdValue =
        schoolLocation === "ged"
          ? undefined
          : educationForm.school_id
            ? Number(educationForm.school_id)
            : undefined;
      const schoolNameValue =
        schoolLocation === "ged"
          ? undefined
          : schoolIdValue
            ? undefined
            : educationForm.school_name || schoolSearch || undefined;

      const payload = {
        user: { ...userForm },
        education: {
          education_level_id: educationForm.education_level_id ? Number(educationForm.education_level_id) : undefined,
          education_level_name: educationForm.education_level_name || undefined,
          school_id: schoolIdValue,
          school_name: schoolNameValue,
          school_type_name: locationTypeName || undefined,
          curriculum_type_id: educationForm.curriculum_type_id ? Number(educationForm.curriculum_type_id) : undefined,
          curriculum_type_name: educationForm.curriculum_type_name || undefined,
          curriculum_id: educationForm.curriculum_id ? Number(educationForm.curriculum_id) : undefined,
          is_project_based: educationForm.is_project_based,
        },
        score_type: scoreType || "none",
        ged_score:
          scoreType === "ged"
            ? {
                total_score: Number(gedForm.total_score || 0),
                rla_score: Number(gedForm.rla_score || 0),
                math_score: Number(gedForm.math_score || 0),
                science_score: Number(gedForm.science_score || 0),
                social_score: Number(gedForm.social_score || 0),
                cert_file_path: gedForm.cert_file_path,
              }
            : undefined,
        academic_score:
          scoreType === "academic"
            ? {
                gpax: Number(academicForm.gpax || 0),
                gpax_semesters: Number(academicForm.gpax_semesters || 0),
                gpa_math: Number(academicForm.gpa_math || 0),
                gpa_science: Number(academicForm.gpa_science || 0),
                gpa_thai: Number(academicForm.gpa_thai || 0),
                gpa_english: Number(academicForm.gpa_english || 0),
                gpa_social: Number(academicForm.gpa_social || 0),
                gpa_total_score: Number(academicForm.gpa_total_score || 0),
                transcript_file_path: academicForm.transcript_file_path,
              }
            : undefined,
        language_scores: languageForms
          .filter((l) => l.test_type.trim() !== "")
          .map((l) => ({
            test_type: l.test_type,
            score: l.score,
            test_level: l.test_level,
            sat_math: l.sat_math ? Number(l.sat_math) : null,
            test_date: l.test_date || undefined,
            cert_file_path: l.cert_file_path,
          })),
        btd_test_scores: btdForms
          .filter((b) => b.test_type.trim() !== "" || b.subject.trim() !== "")
          .map((b) => ({
            test_type: b.test_type,
            subject: b.subject,
            raw_score: b.raw_score ? Number(b.raw_score) : undefined,
            exam_year: b.exam_year ? Number(b.exam_year) : undefined,
            cert_file_path: b.cert_file_path,
          })),
      };

      const updated = await updateStudentProfile(payload);
      applyProfileToForm(updated);
      setSuccess("บันทึกข้อมูลโปรไฟล์เรียบร้อย");
      toast.success("บันทึกข้อมูลโปรไฟล์เรียบร้อย");
    } catch (err: any) {
      const message = err?.message || "บันทึกไม่สำเร็จ";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className={`min-h-screen ${heroGradient} p-6 flex items-center justify-center`}>
        <div className="flex items-center gap-3 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${heroGradient} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">แก้ไขข้อมูลโปรไฟล์</p>
              <h1 className="text-3xl font-bold text-gray-900">บอกเราเกี่ยวกับตัวคุณ</h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/student/profile"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50"
              >
                ยกเลิก
              </Link>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {sectionTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                  activeSection === tab.key
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-700 border-gray-200 hover:border-orange-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}
        {/* User Info */}
        {activeSection === "user" && (
        <section id="user" className={cardClass}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
            <p className="text-sm text-gray-500">ข้อมูลเบื้องต้นสำหรับสร้างโปรไฟล์</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass} htmlFor="full-name">
                ชื่อ-นามสกุล
              </label>
              <input
                id="full-name"
                className={inputClass}
                value={fullNameInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setFullNameInput(value);
                  const hasThai = /[\u0E00-\u0E7F]/.test(value);
                  const hasLatin = /[A-Za-z]/.test(value);
                  if (value.trim() && hasThai && hasLatin) {
                    setError("กรุณากรอกชื่อเป็นภาษาไทยหรือภาษาอังกฤษอย่างใดอย่างหนึ่ง");
                    return;
                  }
                  const { first, last } = splitFullName(value);
                  if (hasLatin && !hasThai) {
                    setUserForm((prev) => ({
                      ...prev,
                      first_name_en: first,
                      last_name_en: last,
                      first_name_th: "",
                      last_name_th: "",
                    }));
                    setError("");
                    return;
                  }
                  setUserForm((prev) => ({
                    ...prev,
                    first_name_th: first,
                    last_name_th: last,
                    first_name_en: "",
                    last_name_en: "",
                  }));
                  setError("");
                }}
                placeholder="สมชาย รักเรียน"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="phone-number">
                เบอร์โทรศัพท์
              </label>
              <input
                id="phone-number"
                className={inputClass}
                value={userForm.phone}
                onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="08xxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="birthday">
                วันเกิด
              </label>
              <input
                id="birthday"
                type="date"
                className={inputClass}
                value={userForm.birthday}
                onChange={(e) => setUserForm((prev) => ({ ...prev, birthday: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="email">
                อีเมล
              </label>
              <input id="email" className={inputClass} value={data?.user?.email || ""} placeholder="email@example.com" disabled />
            </div>
          </div>
        </section>
        )}
        {/* Education */}
        {activeSection === "education" && (
        <section id="education" className={cardClass}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ประวัติการศึกษา</h2>
            <p className="text-sm text-gray-500">ข้อมูลการศึกษาและหลักสูตร</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="education-level-id">
                ระดับการศึกษา (เลือกหรือระบุใหม่)
              </label>
              <div className="flex gap-2">
                <select
                  id="education-level-id"
                  value={educationForm.education_level_id}
                  onChange={(e) => setEducationForm((prev) => ({ ...prev, education_level_id: e.target.value }))}
                  className={`${selectClass} w-1/2`}
                >
                  <option value="" disabled hidden>เลือกระดับ</option>
                  {options.education_levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
                <input
                  id="education-level-name"
                  value={educationForm.education_level_name}
                  onChange={(e) => setEducationForm((prev) => ({ ...prev, education_level_name: e.target.value }))}
                  className={`${inputClass} w-1/2`}
                  placeholder="หรือพิมพ์ชื่อใหม่"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="school-location">
                ที่ตั้งโรงเรียน
              </label>
              <select
                id="school-location"
                value={schoolLocation}
                onChange={(e) =>
                  handleLocationChange(e.target.value as SchoolLocationKey | "")
                }
                className={selectClass}
              >
                <option value="" disabled hidden>เลือกที่ตั้งโรงเรียน</option>
                {SCHOOL_LOCATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {schoolLocation === "domestic" && (
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass} htmlFor="school-name">
                  โรงเรียน
                </label>
                <div className="relative" ref={schoolDropdownRef}>
                  <input
                    id="school-name"
                    value={educationForm.school_name}
                    readOnly
                    onClick={() =>
                      setSchoolDropdownOpen((prev) => {
                        const next = !prev;
                        if (next) setSchoolSearch("");
                        return next;
                      })
                    }
                    placeholder="เลือกโรงเรียนในประเทศ"
                    className={inputClass}
                  />
                  {schoolDropdownOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                      <div className="border-b border-gray-100 p-2">
                        <input
                          value={schoolSearch}
                          onChange={(e) => handleSchoolSearchChange(e.target.value)}
                          placeholder="ค้นหาโรงเรียน"
                          className={`${inputClass} h-10 px-3 py-2`}
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {schoolSearch.trim() && (
                          <button
                            type="button"
                            onClick={() => handleSchoolSelect(schoolSearch.trim(), "")}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50"
                          >
                            ใช้ชื่อ "{schoolSearch.trim()}"
                          </button>
                        )}
                        {filteredSchools.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            ไม่พบโรงเรียน
                          </div>
                        )}
                        {filteredSchools.map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => handleSchoolSelect(s.name || "", String(s.id))}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 ${
                              educationForm.school_id === String(s.id)
                                ? "bg-orange-50 font-semibold text-orange-800"
                                : "text-gray-800"
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {schoolLocation && schoolLocation !== "domestic" && (
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass} htmlFor="school-name-manual">
                  โรงเรียน
                </label>
                <input
                  id="school-name-manual"
                  value={educationForm.school_name || schoolSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSchoolSearch(value);
                    setEducationForm((prev) => ({
                      ...prev,
                      school_name: value,
                      school_id: "",
                    }));
                  }}
                  placeholder="กรอกชื่อโรงเรียน"
                  className={inputClass}
                  onFocus={() => setSchoolDropdownOpen(false)}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className={labelClass} htmlFor="curriculum-type-id">
                ประเภทหลักสูตร
              </label>
              <div className="flex gap-2">
                <select
                  id="curriculum-type-id"
                  value={educationForm.curriculum_type_id}
                  onChange={(e) => setEducationForm((prev) => ({ ...prev, curriculum_type_id: e.target.value }))}
                  className={`${selectClass} w-1/2`}
                >
                  <option value="" disabled hidden>เลือกประเภท</option>
                  {options.curriculum_types.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </select>
                <input
                  id="curriculum-type-name"
                  value={educationForm.curriculum_type_name}
                  onChange={(e) => setEducationForm((prev) => ({ ...prev, curriculum_type_name: e.target.value }))}
                  className={`${inputClass} w-1/2`}
                  placeholder="หรือพิมพ์ชื่อใหม่"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass} htmlFor="curriculum-search">
                หลักสูตร (Curriculum)
              </label>
              <div className="flex gap-2">
                <input
                  id="curriculum-search"
                  value={curriculumSearch}
                  onChange={(e) => setCurriculumSearch(e.target.value)}
                  placeholder="ค้นหาชื่อหลักสูตร"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => loadCurricula(curriculumSearch)}
                  className="rounded-xl bg-gray-900 text-white px-4 py-3 text-sm font-semibold hover:bg-gray-800"
                >
                  ค้นหา
                </button>
              </div>
              <select
                id="curriculum-select"
                aria-label="เลือกหลักสูตร"
                value={educationForm.curriculum_id}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, curriculum_id: e.target.value }))}
                className={selectClass}
              >
                <option value="" disabled hidden>เลือกจากรายการ</option>
                {curricula.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.code ? `(${c.code})` : ""}
                  </option>
                ))}
              </select>
              {curriculumLoading && <p className="text-xs text-gray-500">กำลังค้นหา...</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="project-based">
                Project-based
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                <input
                  id="project-based"
                  type="checkbox"
                  checked={educationForm.is_project_based}
                  onChange={(e) => setEducationForm((prev) => ({ ...prev, is_project_based: e.target.checked }))}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-400"
                />
                <label htmlFor="project-based" className="text-sm text-gray-700">
                  เป็นหลักสูตร Project-based
                </label>
              </div>
            </div>
          </div>
        </section>
        )}
        {/* Scores */}
        {activeSection === "scores" && (
        <section id="scores" className={cardClass}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">คะแนนการศึกษา</h2>
            <p className="text-sm text-gray-500">เลือกกรอก GED หรือ Academic</p>
          </div>
          <div className="flex gap-3">
            {["ged", "academic", "none"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setScoreType(type as ScoreType)}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  scoreType === type
                    ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-orange-200"
                }`}
              >
                {type === "ged" ? "GED Score" : type === "academic" ? "Academic Score" : "ไม่ระบุ"}
              </button>
            ))}
          </div>

          {scoreType === "ged" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "total_score", label: "คะแนนรวม" },
                { key: "rla_score", label: "Reasoning Through Language Arts" },
                { key: "math_score", label: "Mathematical Reasoning" },
                { key: "science_score", label: "Science" },
                { key: "social_score", label: "Social Studies" },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className={labelClass} htmlFor={`ged-${field.key}`}>
                    {field.label}
                  </label>
                  <input
                    id={`ged-${field.key}`}
                    type="number"
                    value={(gedForm as any)[field.key]}
                    onChange={(e) => setGedForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass} htmlFor="ged-cert">
                  ไฟล์ใบรับรอง (ลิงก์)
                </label>
                <input
                  id="ged-cert"
                  value={gedForm.cert_file_path}
                  onChange={(e) => setGedForm((prev) => ({ ...prev, cert_file_path: e.target.value }))}
                  className={inputClass}
                  placeholder="https://..."
                />
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="ged-cert-file"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    {uploadingKey === "ged-cert" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    อัปโหลดไฟล์
                  </label>
                  <input
                    id="ged-cert-file"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      handleFileUpload(file, "ged-cert", (url) =>
                        setGedForm((prev) => ({ ...prev, cert_file_path: url }))
                      );
                      e.target.value = "";
                    }}
                  />
                  {uploadingKey === "ged-cert" && <span className="text-xs text-gray-500">กำลังอัปโหลด...</span>}
                </div>
              </div>
            </div>
          )}

          {scoreType === "academic" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "gpax", label: "GPAX" },
                { key: "gpax_semesters", label: "จำนวนเทอมที่ใช้คำนวณ GPAX" },
                { key: "gpa_math", label: "GPA วิชาคณิต" },
                { key: "gpa_science", label: "GPA วิชาวิทย์" },
                { key: "gpa_thai", label: "GPA วิชาภาษาไทย" },
                { key: "gpa_english", label: "GPA วิชาภาษาอังกฤษ" },
                { key: "gpa_social", label: "GPA วิชาสังคม" },
                { key: "gpa_total_score", label: "GPA รวม" },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className={labelClass} htmlFor={`academic-${field.key}`}>
                    {field.label}
                  </label>
                  <input
                    id={`academic-${field.key}`}
                    type="number"
                    value={(academicForm as any)[field.key]}
                    onChange={(e) => setAcademicForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass} htmlFor="academic-transcript">
                  ไฟล์ Transcript (ลิงก์)
                </label>
                <input
                  id="academic-transcript"
                  value={academicForm.transcript_file_path}
                  onChange={(e) => setAcademicForm((prev) => ({ ...prev, transcript_file_path: e.target.value }))}
                  className={inputClass}
                  placeholder="https://..."
                />
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="academic-transcript-file"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    {uploadingKey === "academic-transcript" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    อัปโหลดไฟล์
                  </label>
                  <input
                    id="academic-transcript-file"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      handleFileUpload(file, "academic-transcript", (url) =>
                        setAcademicForm((prev) => ({ ...prev, transcript_file_path: url }))
                      );
                      e.target.value = "";
                    }}
                  />
                  {uploadingKey === "academic-transcript" && (
                    <span className="text-xs text-gray-500">กำลังอัปโหลด...</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {scoreType === "none" && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-gray-500">
              ยังไม่ต้องการกรอกคะแนนในตอนนี้
            </div>
          )}
        </section>
        )}
        {/* Languages */}
        {activeSection === "language" && (
        <section id="language" className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">คะแนนภาษา</h2>
              <p className="text-sm text-gray-500">TOEFL / IELTS / SAT ฯลฯ</p>
            </div>
            <button
              type="button"
              onClick={() => setLanguageForms((prev) => [...prev, { ...emptyLang }])}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <Plus size={16} />
              เพิ่มรายการ
            </button>
          </div>

          <div className="space-y-4">
            {languageForms.length === 0 && (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-4 text-sm text-gray-500">
                ยังไม่มีรายการ กด “เพิ่มรายการ” เพื่อกรอกคะแนนภาษา
              </div>
            )}
            {languageForms.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-200 bg-orange-50/50 p-4 shadow-sm space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    aria-label={`ประเภทการสอบภาษา รายการที่ ${idx + 1}`}
                    value={item.test_type}
                    onChange={(e) => updateLanguageForm(idx, "test_type", e.target.value)}
                    className={inputClass}
                    placeholder="เช่น TOEFL / IELTS / SAT"
                  />
                  <input
                    aria-label={`คะแนนรวมภาษา รายการที่ ${idx + 1}`}
                    value={item.score}
                    onChange={(e) => updateLanguageForm(idx, "score", e.target.value)}
                    className={inputClass}
                    placeholder="คะแนนรวม"
                  />
                  <input
                    aria-label={`ระดับการสอบภาษา รายการที่ ${idx + 1}`}
                    value={item.test_level}
                    onChange={(e) => updateLanguageForm(idx, "test_level", e.target.value)}
                    className={inputClass}
                    placeholder="ระดับ/แบนด์"
                  />
                  <input
                    aria-label={`คะแนน SAT Math รายการที่ ${idx + 1}`}
                    value={item.sat_math}
                    onChange={(e) => updateLanguageForm(idx, "sat_math", e.target.value)}
                    className={inputClass}
                    placeholder="SAT Math (ถ้ามี)"
                  />
                  <input
                    aria-label={`วันที่สอบภาษา รายการที่ ${idx + 1}`}
                    type="date"
                    value={item.test_date}
                    onChange={(e) => updateLanguageForm(idx, "test_date", e.target.value)}
                    className={inputClass}
                  />
                  <div className="flex items-center gap-3">
                    <input
                      aria-label={`ลิงก์ใบรับรองภาษา รายการที่ ${idx + 1}`}
                      value={item.cert_file_path}
                      onChange={(e) => updateLanguageForm(idx, "cert_file_path", e.target.value)}
                      className={inputClass}
                      placeholder="ลิงก์ไฟล์แนบ"
                    />
                    <label
                      htmlFor={`lang-cert-${idx}`}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
                    >
                      {uploadingKey === `lang-${idx}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      อัปโหลดไฟล์
                    </label>
                    <input
                      id={`lang-cert-${idx}`}
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleFileUpload(file, `lang-${idx}`, (url) =>
                          updateLanguageForm(idx, "cert_file_path", url)
                        );
                        e.target.value = "";
                      }}
                    />
                    {uploadingKey === `lang-${idx}` && (
                      <span className="text-xs text-gray-500">กำลังอัปโหลด...</span>
                    )}
                  </div>
                </div>
                {languageForms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLanguageForms((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 text-sm hover:text-red-600"
                  >
                    ลบรายการนี้
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        )}

        {/* BTD */}
        {activeSection === "btd" && (
        <section id="btd" className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">คะแนน BT-D (PAT / A-Level ฯลฯ)</h2>
              <p className="text-sm text-gray-500">กรอกคะแนนที่เกี่ยวข้อง</p>
            </div>
            <button
              type="button"
              onClick={() => setBtdForms((prev) => [...prev, { ...emptyBTD }])}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <Plus size={16} />
              เพิ่มรายการ
            </button>
          </div>

          <div className="space-y-4">
            {btdForms.length === 0 && (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-4 text-sm text-gray-500">
                ยังไม่มีรายการ กด “เพิ่มรายการ” เพื่อกรอกคะแนน BT-D
              </div>
            )}
            {btdForms.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-200 bg-orange-50/50 p-4 shadow-sm space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    aria-label={`ประเภทการสอบ BT-D รายการที่ ${idx + 1}`}
                    value={item.test_type}
                    onChange={(e) => updateBTDForm(idx, "test_type", e.target.value)}
                    className={inputClass}
                    placeholder="ประเภทการสอบ (เช่น PAT, A-Level)"
                  />
                  <input
                    aria-label={`รายวิชา BT-D รายการที่ ${idx + 1}`}
                    value={item.subject}
                    onChange={(e) => updateBTDForm(idx, "subject", e.target.value)}
                    className={inputClass}
                    placeholder="รายวิชา"
                  />
                  <input
                    aria-label={`คะแนนดิบ BT-D รายการที่ ${idx + 1}`}
                    type="number"
                    value={item.raw_score}
                    onChange={(e) => updateBTDForm(idx, "raw_score", e.target.value)}
                    className={inputClass}
                    placeholder="คะแนนดิบ"
                  />
                  <input
                    aria-label={`ปีที่สอบ BT-D รายการที่ ${idx + 1}`}
                    type="number"
                    value={item.exam_year}
                    onChange={(e) => updateBTDForm(idx, "exam_year", e.target.value)}
                    className={inputClass}
                    placeholder="ปีที่สอบ"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      aria-label={`ลิงก์ใบรับรอง BT-D รายการที่ ${idx + 1}`}
                      value={item.cert_file_path}
                      onChange={(e) => updateBTDForm(idx, "cert_file_path", e.target.value)}
                      className={`${inputClass} md:col-span-2`}
                      placeholder="ลิงก์ไฟล์แนบ"
                    />
                    <label
                      htmlFor={`btd-cert-${idx}`}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
                    >
                      {uploadingKey === `btd-${idx}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      อัปโหลดไฟล์
                    </label>
                    <input
                      id={`btd-cert-${idx}`}
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleFileUpload(file, `btd-${idx}`, (url) =>
                          updateBTDForm(idx, "cert_file_path", url)
                        );
                        e.target.value = "";
                      }}
                    />
                    {uploadingKey === `btd-${idx}` && (
                      <span className="text-xs text-gray-500">กำลังอัปโหลด...</span>
                    )}
                  </div>
                </div>
                {btdForms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setBtdForms((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 text-sm hover:text-red-600"
                  >
                    ลบรายการนี้
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        )}
      </div>
    </div>
  );

  function updateLanguageForm(index: number, key: keyof LanguageForm, value: string) {
    setLanguageForms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  function updateBTDForm(index: number, key: keyof BTDForm, value: string) {
    setBtdForms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }
}
