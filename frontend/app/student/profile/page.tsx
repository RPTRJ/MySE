"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  UserRoundPen,
  GraduationCap,
  Award,
  Languages,
  BookOpen,
  Edit,
  AlertCircle,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getStudentProfile,
  StudentProfile,
  profileUploads,
  updateStudentProfile,
} from "../../../services/profile";
import {
  SCHOOL_LOCATION_OPTIONS,
  SCHOOL_TYPE_FROM_LOCATION,
  SchoolLocationKey,
  inferLocationFromTypeName,
} from "@/services/schoolOptions";

type FieldProps = {
  label: string;
  value?: string | null;
  isLink?: boolean;
  compact?: boolean;
};

const heroGradient =
  "bg-[linear-gradient(120deg,#ffe2c3_0%,#fff6ec_35%,#ffd7b1_100%)]";

function Field({ label, value, isLink, compact }: FieldProps) {
  const display = value && value.trim() !== "" ? value : "-";
  return (
    <div className={`flex flex-col ${compact ? "gap-0.5" : "gap-1"}`}>
      <span className="text-xs text-gray-500">{label}</span>
      {isLink && display !== "-" ? (
        <a
          href={display}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-orange-700 hover:text-orange-800 break-all"
        >
          เปิดลิงก์
        </a>
      ) : (
        <span className="text-sm font-semibold text-gray-800 break-words">
          {display}
        </span>
      )}
    </div>
  );
}

function splitFullName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  const first = parts.shift() || "";
  return { first, last: parts.join(" ") };
}

function joinFullName(first?: string, last?: string) {
  return [first, last].filter(Boolean).join(" ").trim();
}

function ProfileSection({
  icon,
  title,
  note,
  editHref,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  note?: string;
  editHref?: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-orange-100 bg-white shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
            {icon}
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {note || "ข้อมูลสำหรับการสมัครเรียน"}
            </p>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        </div>
        {onEdit ? (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            <Edit className="h-4 w-4" /> แก้ไข
          </button>
        ) : (
          editHref && (
            <Link
              href={editHref}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            >
              <Edit className="h-4 w-4" /> แก้ไข
            </Link>
          )
        )}
      </div>
      {children}
    </section>
  );
}

export default function StudentProfileViewPage() {
  const [data, setData] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [userDraft, setUserDraft] = useState({
    first_name_th: "",
    last_name_th: "",
    first_name_en: "",
    last_name_en: "",
    phone: "",
    birthday: "",
  });
  const [eduDraft, setEduDraft] = useState({
    education_level_id: 0,
    education_level_name: "",
    school_id: 0,
    school_name: "",
    school_type_name: "",
    curriculum_type_id: 0,
    curriculum_type_name: "",
    curriculum_id: 0,
  });
  const [schoolLocation, setSchoolLocation] = useState<SchoolLocationKey | "">(
    "",
  );
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef<HTMLDivElement | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [savingEdu, setSavingEdu] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const resp = await getStudentProfile();
        setData(resp);
      } catch (err: any) {
        setError(err?.message || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
      } finally {
        setLoading(false);
      }
    };
    load();
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

  const scoreType = useMemo(
    () =>
      data?.ged_score ? "ged" : data?.academic_score ? "academic" : "none",
    [data],
  );

  const schoolDisplay = useMemo(() => {
    if (!data?.education) return { name: "", typeName: "" };
    const foundSchool = data.options?.schools?.find(
      (s) => s.id === data.education?.school_id,
    );
    const name =
      data.education.school?.name ||
      data.education.school_name ||
      foundSchool?.name ||
      "";
    const typeName =
      data.education.school?.school_type?.name ||
      data.education.school_type?.name ||
      data.education.school_type_name ||
      foundSchool?.school_type?.name ||
      "";
    return { name, typeName };
  }, [data]);

  const filteredSchools = useMemo(() => {
    if (!data?.options?.schools) return [];
    const targetType = SCHOOL_TYPE_FROM_LOCATION.domestic;
    const keyword = schoolSearch.trim().toLowerCase();

    return data.options.schools.filter((school) => {
      const matchesType = school.school_type?.name === targetType;
      const matchesKeyword = keyword
        ? (school.name || "").toLowerCase().includes(keyword)
        : true;
      return matchesType && matchesKeyword;
    });
  }, [data?.options?.schools, schoolSearch]);

  const handleAvatarUpload = async (file: File) => {
    if (!data) return;
    setUploadError("");
    try {
      setUploading(true);
      const url = await profileUploads.uploadFile(file);
      const updated = await updateStudentProfile({
        user: { ...data.user, profile_image_url: url },
        education: data.education
          ? {
              education_level_id: data.education.education_level_id,
              education_level_name: data.education.education_level?.name,
              curriculum_type_id: data.education.curriculum_type_id,
              curriculum_type_name: data.education.curriculum_type?.name,
              curriculum_id: data.education.curriculum_id,
              is_project_based: data.education.is_project_based,
            }
          : {},
        score_type: scoreType,
        ged_score: data.ged_score
          ? {
              total_score: data.ged_score.total_score,
              rla_score: data.ged_score.rla_score,
              math_score: data.ged_score.math_score,
              science_score: data.ged_score.science_score,
              social_score: data.ged_score.social_score,
              cert_file_path: data.ged_score.cert_file_path,
            }
          : undefined,
        academic_score: data.academic_score
          ? {
              gpax: data.academic_score.gpax,
              gpax_semesters: data.academic_score.gpax_semesters,
              gpa_math: data.academic_score.gpa_math,
              gpa_science: data.academic_score.gpa_science,
              gpa_thai: data.academic_score.gpa_thai,
              gpa_english: data.academic_score.gpa_english,
              gpa_social: data.academic_score.gpa_social,
              gpa_total_score: data.academic_score.gpa_total_score,
              transcript_file_path: data.academic_score.transcript_file_path,
            }
          : undefined,
        language_scores:
          data.language_scores?.map((l) => ({
            test_type: l.test_type,
            score: l.score,
            test_level: l.test_level,
            sat_math: l.sat_math,
            test_date: l.test_date,
            cert_file_path: l.cert_file_path,
          })) || [],
        btd_test_scores:
          data.btd_test_scores?.map((b) => ({
            test_type: b.test_type,
            subject: b.subject,
            raw_score: b.raw_score,
            exam_year: b.exam_year,
            cert_file_path: b.cert_file_path,
          })) || [],
      });
      setData(updated);
      toast.success("อัปโหลดรูปโปรไฟล์สำเร็จ");
    } catch (err: any) {
      setUploadError(err?.message || "อัปโหลดรูปไม่สำเร็จ");
      toast.error(err?.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen ${heroGradient} p-6 flex items-center justify-center`}
      >
        <div className="flex items-center gap-3 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={`min-h-screen ${heroGradient} p-6 flex items-center justify-center`}
      >
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          {error || "ไม่พบข้อมูล"}
        </div>
      </div>
    );
  }

  const thaiFullName = joinFullName(
    data.user.first_name_th,
    data.user.last_name_th,
  );
  const enFullName = joinFullName(
    data.user.first_name_en,
    data.user.last_name_en,
  );
  const fullName = thaiFullName || enFullName || data.user.email || "Student";

  const openUserModal = () => {
    setFullNameInput(thaiFullName || enFullName);
    setUserDraft({
      first_name_th: data.user.first_name_th || "",
      last_name_th: data.user.last_name_th || "",
      first_name_en: data.user.first_name_en || "",
      last_name_en: data.user.last_name_en || "",
      phone: data.user.phone || "",
      birthday: data.user.birthday || "",
    });
    setModalError("");
    setShowUserModal(true);
  };

  const openEduModal = () => {
    const matchedSchool = data.options?.schools?.find(
      (s) => s.id === data.education?.school_id,
    );
    setEduDraft({
      education_level_id: data.education?.education_level_id || 0,
      education_level_name: data.education?.education_level?.name || "",
      school_id: data.education?.school_id || 0,
      school_name:
        data.education?.school?.name ||
        data.education?.school_name ||
        matchedSchool?.name ||
        "",
      school_type_name:
        data.education?.school?.school_type?.name ||
        data.education?.school_type?.name ||
        matchedSchool?.school_type?.name ||
        data.education?.school_type_name ||
        "",
      curriculum_type_id: data.education?.curriculum_type_id || 0,
      curriculum_type_name: data.education?.curriculum_type?.name || "",
      curriculum_id: data.education?.curriculum_id || 0,
    });
    const schoolTypeName =
      data.education?.school?.school_type?.name ||
      data.education?.school_type?.name ||
      matchedSchool?.school_type?.name ||
      data.education?.school_type_name ||
      "";
    const location = inferLocationFromTypeName(schoolTypeName);
    setSchoolLocation(location);
    setSchoolSearch("");
    setSchoolDropdownOpen(false);
    setModalError("");
    setShowEduModal(true);
  };

  const handleSchoolSearchChange = (value: string) => {
    setSchoolSearch(value);
    setSchoolDropdownOpen(true);
  };

  const handleSchoolSelect = (value: string, schoolId: number) => {
    setEduDraft((prev) => ({
      ...prev,
      school_name: value,
      school_id: schoolId || 0,
      school_type_name:
        SCHOOL_TYPE_FROM_LOCATION.domestic ||
        prev.school_type_name,
    }));
    setSchoolLocation("domestic");
    setSchoolSearch("");
    setSchoolDropdownOpen(false);
  };

  const handleSaveUser = async () => {
    setSavingUser(true);
    setModalError("");
    try {
      const nameValue = fullNameInput.trim();
      const hasThai = /[\u0E00-\u0E7F]/.test(nameValue);
      const hasLatin = /[A-Za-z]/.test(nameValue);
      if (nameValue && hasThai && hasLatin) {
        const message =
          "กรุณากรอกชื่อเป็นภาษาไทยหรือภาษาอังกฤษอย่างใดอย่างหนึ่ง";
        setModalError(message);
        toast.error(message);
        setSavingUser(false);
        return;
      }
      const { first, last } = splitFullName(nameValue);
      const namePayload = hasLatin && !hasThai
        ? {
            first_name_en: first,
            last_name_en: last,
            first_name_th: "",
            last_name_th: "",
          }
        : {
            first_name_th: first,
            last_name_th: last,
            first_name_en: "",
            last_name_en: "",
          };
      const updated = await updateStudentProfile({
        user: {
          ...namePayload,
          phone: userDraft.phone,
          birthday: userDraft.birthday,
          profile_image_url: data.user.profile_image_url,
        },
        education: data.education
          ? {
              education_level_id: data.education.education_level_id,
              education_level_name: data.education.education_level?.name,
              curriculum_type_id: data.education.curriculum_type_id,
              curriculum_type_name: data.education.curriculum_type?.name,
              curriculum_id: data.education.curriculum_id,
              is_project_based: data.education.is_project_based,
            }
          : {},
        score_type: scoreType,
        ged_score: data.ged_score,
        academic_score: data.academic_score,
        language_scores: data.language_scores || [],
        btd_test_scores: data.btd_test_scores || [],
      });
      setData(updated);
      setShowUserModal(false);
      setFullNameInput("");
      toast.success("บันทึกข้อมูลส่วนตัวสำเร็จ");
    } catch (err: any) {
      setModalError(err?.message || "บันทึกข้อมูลไม่สำเร็จ");
      toast.error(err?.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveEdu = async () => {
    setSavingEdu(true);
    setModalError("");
    try {
      const isGed = schoolLocation === "ged";
      const locationSchoolType = schoolLocation
        ? SCHOOL_TYPE_FROM_LOCATION[schoolLocation]
        : "";
      const updated = await updateStudentProfile({
        user: {
          first_name_th: data.user.first_name_th,
          last_name_th: data.user.last_name_th,
          first_name_en: data.user.first_name_en,
          last_name_en: data.user.last_name_en,
          phone: data.user.phone,
          birthday: data.user.birthday,
          profile_image_url: data.user.profile_image_url,
        },
        education: {
          education_level_id: eduDraft.education_level_id || undefined,
          education_level_name: eduDraft.education_level_name || undefined,
          school_id: isGed ? undefined : eduDraft.school_id || undefined,
          school_name: isGed
            ? undefined
            : eduDraft.school_id
              ? undefined
              : eduDraft.school_name || undefined,
          school_type_name:
            locationSchoolType || eduDraft.school_type_name || undefined,
          curriculum_type_id: eduDraft.curriculum_type_id || undefined,
          curriculum_type_name: eduDraft.curriculum_type_name || undefined,
          curriculum_id: eduDraft.curriculum_id || undefined,
        },
        score_type: scoreType,
        ged_score: data.ged_score,
        academic_score: data.academic_score,
        language_scores: data.language_scores || [],
        btd_test_scores: data.btd_test_scores || [],
      });
      setData(updated);
      const refreshed = await getStudentProfile();
      setData(refreshed);
      setShowEduModal(false);
      toast.success("บันทึกข้อมูลการศึกษาสำเร็จ");
    } catch (err: any) {
      setModalError(err?.message || "บันทึกข้อมูลไม่สำเร็จ");
      toast.error(err?.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSavingEdu(false);
    }
  };

  return (
    <div className={`min-h-screen ${heroGradient} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <section className="rounded-3xl bg-white shadow-lg border border-orange-100 p-6 flex flex-col items-center text-center gap-4">
          {data.user.profile_image_url ? (
            <img
              src={data.user.profile_image_url}
              alt="profile"
              className="h-28 w-28 rounded-full object-cover shadow-md border border-orange-100"
            />
          ) : (
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center text-3xl font-bold shadow-md">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-900">{fullName}</p>
            <p className="text-sm text-gray-500">{data.user.email}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <label
              htmlFor="change-avatar"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูปโปรไฟล์"}
            </label>
            <input
              id="change-avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
                e.target.value = "";
              }}
            />
            {uploadError && (
              <p className="text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        </section>

        {/* User Info */}
        <ProfileSection
          icon={<UserRoundPen className="h-5 w-5" />}
          title="ข้อมูลส่วนตัว"
          note="จำเป็นต้องใช้สำหรับการสมัครเรียน"
          onEdit={openUserModal}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ชื่อ-นามสกุล" value={thaiFullName || enFullName} />
            <Field label="เบอร์โทร" value={data.user.phone} />
            <Field label="อีเมล" value={data.user.email} />
            <Field label="วันเกิด" value={data.user.birthday} />
          </div>
        </ProfileSection>

        {/* Education */}
        <ProfileSection
          icon={<GraduationCap className="h-5 w-5" />}
          title="การศึกษา"
          note="จำเป็นต้องใช้สำหรับการสมัครเรียน"
          onEdit={openEduModal}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="ระดับการศึกษา"
              value={data.education?.education_level?.name}
            />
            <Field label="โรงเรียน" value={schoolDisplay.name} />
            <Field label="ที่ตั้งโรงเรียน" value={schoolDisplay.typeName} />
            <Field
              label="แผนการเรียน"
              value={data.education?.curriculum_type?.name}
            />
          </div>
        </ProfileSection>

        {/* Scores */}
        <ProfileSection
          icon={<Award className="h-5 w-5" />}
          title="คะแนนการศึกษา (GED / Academic)"
          note="กรอกอย่างใดอย่างหนึ่ง"
          editHref="/student/profile/edit#scores"
        >
          {scoreType === "ged" && data.ged_score && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="คะแนนรวม"
                value={data.ged_score.total_score?.toString()}
              />
              <Field label="RLA" value={data.ged_score.rla_score?.toString()} />
              <Field
                label="Math"
                value={data.ged_score.math_score?.toString()}
              />
              <Field
                label="Science"
                value={data.ged_score.science_score?.toString()}
              />
              <Field
                label="Social"
                value={data.ged_score.social_score?.toString()}
              />
              <Field
                label="ใบรับรอง"
                value={data.ged_score.cert_file_path}
                isLink
              />
            </div>
          )}
          {scoreType === "academic" && data.academic_score && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="GPAX"
                value={data.academic_score.gpax?.toString()}
              />
              <Field
                label="เทอมที่ใช้คำนวณ"
                value={data.academic_score.gpax_semesters?.toString()}
              />
              <Field
                label="GPA คณิต"
                value={data.academic_score.gpa_math?.toString()}
              />
              <Field
                label="GPA วิทย์"
                value={data.academic_score.gpa_science?.toString()}
              />
              <Field
                label="GPA ไทย"
                value={data.academic_score.gpa_thai?.toString()}
              />
              <Field
                label="GPA อังกฤษ"
                value={data.academic_score.gpa_english?.toString()}
              />
              <Field
                label="GPA สังคม"
                value={data.academic_score.gpa_social?.toString()}
              />
              <Field
                label="GPA รวม"
                value={data.academic_score.gpa_total_score?.toString()}
              />
              <Field
                label="Transcript"
                value={data.academic_score.transcript_file_path}
                isLink
              />
            </div>
          )}
          {scoreType === "none" && (
            <p className="text-sm text-gray-500">ยังไม่กรอกคะแนน</p>
          )}
        </ProfileSection>

        {/* Languages */}
        <ProfileSection
          icon={<Languages className="h-5 w-5" />}
          title="คะแนนภาษา"
          note="TOEFL / IELTS / SAT ฯลฯ"
          editHref="/student/profile/edit#language"
        >
          {data.language_scores.length === 0 && (
            <p className="text-sm text-gray-500">ยังไม่กรอกคะแนนภาษา</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {data.language_scores.map((item) => (
              <div
                key={`${item.id}-${item.test_type}`}
                className="rounded-2xl border border-gray-100 p-4 bg-orange-50/40"
              >
                <p className="text-sm font-semibold text-gray-800">
                  {item.test_type}
                </p>
                <div className="mt-2 grid gap-1 text-sm text-gray-600">
                  <Field label="คะแนน" value={item.score} compact />
                  <Field label="ระดับ" value={item.test_level} compact />
                  <Field
                    label="SAT Math"
                    value={item.sat_math?.toString()}
                    compact
                  />
                  <Field label="วันที่สอบ" value={item.test_date} compact />
                  <Field
                    label="ใบรับรอง"
                    value={item.cert_file_path}
                    isLink
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        </ProfileSection>

        {/* BTD */}
        <ProfileSection
          icon={<BookOpen className="h-5 w-5" />}
          title="คะแนน BT-D (PAT / A-Level ฯลฯ)"
          note="กรอกคะแนนที่เกี่ยวข้อง"
          editHref="/student/profile/edit#btd"
        >
          {data.btd_test_scores.length === 0 && (
            <p className="text-sm text-gray-500">ยังไม่กรอกคะแนน BT-D</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {data.btd_test_scores.map((item) => (
              <div
                key={`${item.id}-${item.test_type}-${item.subject}`}
                className="rounded-2xl border border-gray-100 p-4 bg-orange-50/40"
              >
                <p className="text-sm font-semibold text-gray-800">
                  {item.test_type || "ประเภทไม่ระบุ"}
                </p>
                <div className="mt-2 grid gap-1 text-sm text-gray-600">
                  <Field label="รายวิชา" value={item.subject} compact />
                  <Field
                    label="คะแนนดิบ"
                    value={item.raw_score?.toString()}
                    compact
                  />
                  <Field
                    label="ปีที่สอบ"
                    value={item.exam_year?.toString()}
                    compact
                  />
                  <Field
                    label="ใบรับรอง"
                    value={item.cert_file_path}
                    isLink
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        </ProfileSection>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-orange-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100">
              <div>
                <p className="text-xs text-gray-500">แก้ไขข้อมูลส่วนตัว</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  ข้อมูลส่วนตัว
                </h3>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-800">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="สมชาย รักเรียน"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-800">
                    เบอร์โทร
                  </label>
                  <input
                    type="tel"
                    value={userDraft.phone}
                    onChange={(e) =>
                      setUserDraft((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="0812345678"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-800">
                    วันเดือนปีเกิด
                  </label>
                  <input
                    type="date"
                    value={userDraft.birthday}
                    onChange={(e) =>
                      setUserDraft((prev) => ({
                        ...prev,
                        birthday: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>
              {modalError && (
                <p className="text-sm text-red-600">{modalError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-orange-100 bg-orange-50/40 rounded-b-3xl">
              <button
                onClick={() => setShowUserModal(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveUser}
                disabled={savingUser}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {savingUser ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {savingUser ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-orange-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100">
              <div>
                <p className="text-xs text-gray-500">แก้ไขข้อมูลการศึกษา</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  การศึกษา
                </h3>
              </div>
              <button
                onClick={() => setShowEduModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-800">
                  ระดับการศึกษา
                </label>
                <select
                  value={eduDraft.education_level_id}
                  onChange={(e) =>
                    setEduDraft((prev) => ({
                      ...prev,
                      education_level_id: Number(e.target.value),
                      education_level_name:
                        data.options.education_levels.find(
                          (l) => l.id === Number(e.target.value),
                        )?.name || "",
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value={0} disabled hidden>เลือกระดับการศึกษา</option>
                  {(data.options.education_levels || []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-800">
                  ที่ตั้งโรงเรียน
                </label>
                <select
                  value={schoolLocation}
                  onChange={(e) => {
                    const newLocation = e.target.value as
                      | SchoolLocationKey
                      | "";
                    const typeName =
                      newLocation &&
                      SCHOOL_TYPE_FROM_LOCATION[
                        newLocation as SchoolLocationKey
                      ]
                        ? SCHOOL_TYPE_FROM_LOCATION[
                            newLocation as SchoolLocationKey
                          ]
                        : "";
                    setSchoolLocation(newLocation);
                    setEduDraft((prev) => ({
                      ...prev,
                      school_type_name: typeName || prev.school_type_name,
                      school_id:
                        newLocation === "domestic" ? prev.school_id : 0,
                      school_name:
                        newLocation === "domestic" ? prev.school_name : "",
                    }));
                    setSchoolSearch("");
                    setSchoolDropdownOpen(false);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-800">
                    โรงเรียน
                  </label>
                  <div className="relative" ref={schoolDropdownRef}>
                    <input
                      type="text"
                      value={eduDraft.school_name}
                      readOnly
                      onClick={() =>
                        setSchoolDropdownOpen((prev) => {
                          const next = !prev;
                          if (next) setSchoolSearch("");
                          return next;
                        })
                      }
                      placeholder="เลือกโรงเรียนในประเทศ"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                    {schoolDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                        <div className="border-b border-gray-100 p-2">
                          <input
                            type="text"
                            value={schoolSearch}
                            onChange={(e) =>
                              handleSchoolSearchChange(e.target.value)
                            }
                            placeholder="ค้นหาโรงเรียน"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {schoolSearch.trim() && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSchoolSelect(
                                  schoolSearch.trim(),
                                  0,
                                )
                              }
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
                              onClick={() =>
                                handleSchoolSelect(s.name || "", s.id)
                              }
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 ${eduDraft.school_id === s.id ? "bg-orange-50 font-semibold text-orange-800" : "text-gray-800"}`}
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
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-800">
                    โรงเรียน
                  </label>
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSchoolSearch(value);
                      setEduDraft((prev) => ({
                        ...prev,
                        school_name: value,
                        school_id: 0,
                      }));
                    }}
                    placeholder="กรอกชื่อโรงเรียน"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    onFocus={() => setSchoolDropdownOpen(false)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-800">
                  แผนการเรียน
                </label>
                <select
                  value={eduDraft.curriculum_type_id}
                  onChange={(e) =>
                    setEduDraft((prev) => ({
                      ...prev,
                      curriculum_type_id: Number(e.target.value),
                      curriculum_type_name:
                        data.options.curriculum_types.find(
                          (t) => t.id === Number(e.target.value),
                        )?.name || "",
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value={0} disabled hidden>เลือกแผนการเรียน</option>
                  {(data.options.curriculum_types || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              {modalError && (
                <p className="text-sm text-red-600">{modalError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-orange-100 bg-orange-50/40 rounded-b-3xl">
              <button
                onClick={() => setShowEduModal(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdu}
                disabled={savingEdu}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {savingEdu ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {savingEdu ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
