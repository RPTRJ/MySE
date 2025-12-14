"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, UserRoundPen, GraduationCap, Award, Languages, BookOpen, Edit, AlertCircle, Upload } from "lucide-react";
import { getStudentProfile, StudentProfile, profileUploads, updateStudentProfile } from "../../../services/profile";

type FieldProps = {
  label: string;
  value?: string | null;
  isLink?: boolean;
  compact?: boolean;
};

const heroGradient = "bg-[linear-gradient(120deg,#ffe2c3_0%,#fff6ec_35%,#ffd7b1_100%)]";
const cardClass = "rounded-3xl border border-orange-100 bg-white shadow-sm p-5";

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
        <span className="text-sm font-semibold text-gray-800 break-words">{display}</span>
      )}
    </div>
  );
}

function ProfileSection({
  icon,
  title,
  note,
  editHref,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  note?: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-orange-100 bg-white shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">{icon}</div>
          <div>
            <p className="text-xs text-gray-500">{note || "ข้อมูลสำหรับการสมัครเรียน"}</p>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        </div>
        <Link
          href={editHref}
          className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
        >
          <Edit className="h-4 w-4" /> แก้ไข
        </Link>
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

  const scoreType = useMemo(
    () => (data?.ged_score ? "ged" : data?.academic_score ? "academic" : "none"),
    [data]
  );

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
    } catch (err: any) {
      setUploadError(err?.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
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

  if (!data) {
    return (
      <div className={`min-h-screen ${heroGradient} p-6 flex items-center justify-center`}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          {error || "ไม่พบข้อมูล"}
        </div>
      </div>
    );
  }

  const fullName =
    data.user.first_name_th ||
    data.user.first_name_en ||
    data.user.email ||
    "Student";

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
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
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
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          </div>
        </section>

        {/* User Info */}
        <ProfileSection
          icon={<UserRoundPen className="h-5 w-5" />}
          title="ข้อมูลส่วนตัว"
          note="จำเป็นต้องใช้สำหรับการสมัครเรียน"
          editHref="/student/profile/edit#user"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ชื่อ (ไทย)" value={data.user.first_name_th} />
            <Field label="นามสกุล (ไทย)" value={data.user.last_name_th} />
            <Field label="ชื่อ (อังกฤษ)" value={data.user.first_name_en} />
            <Field label="นามสกุล (อังกฤษ)" value={data.user.last_name_en} />
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
          editHref="/student/profile/edit#education"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ระดับการศึกษา" value={data.education?.education_level?.name} />
            <Field label="ประเภทหลักสูตร" value={data.education?.curriculum_type?.name} />
            <Field label="หลักสูตร" value={data.education?.curriculum_id?.toString()} />
            <Field label="Project-based" value={data.education?.is_project_based ? "ใช่" : "ไม่ใช่"} />
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
              <Field label="คะแนนรวม" value={data.ged_score.total_score?.toString()} />
              <Field label="RLA" value={data.ged_score.rla_score?.toString()} />
              <Field label="Math" value={data.ged_score.math_score?.toString()} />
              <Field label="Science" value={data.ged_score.science_score?.toString()} />
              <Field label="Social" value={data.ged_score.social_score?.toString()} />
              <Field label="ใบรับรอง" value={data.ged_score.cert_file_path} isLink />
            </div>
          )}
          {scoreType === "academic" && data.academic_score && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="GPAX" value={data.academic_score.gpax?.toString()} />
              <Field label="เทอมที่ใช้คำนวณ" value={data.academic_score.gpax_semesters?.toString()} />
              <Field label="GPA คณิต" value={data.academic_score.gpa_math?.toString()} />
              <Field label="GPA วิทย์" value={data.academic_score.gpa_science?.toString()} />
              <Field label="GPA ไทย" value={data.academic_score.gpa_thai?.toString()} />
              <Field label="GPA อังกฤษ" value={data.academic_score.gpa_english?.toString()} />
              <Field label="GPA สังคม" value={data.academic_score.gpa_social?.toString()} />
              <Field label="GPA รวม" value={data.academic_score.gpa_total_score?.toString()} />
              <Field label="Transcript" value={data.academic_score.transcript_file_path} isLink />
            </div>
          )}
          {scoreType === "none" && <p className="text-sm text-gray-500">ยังไม่กรอกคะแนน</p>}
        </ProfileSection>

        {/* Languages */}
        <ProfileSection
          icon={<Languages className="h-5 w-5" />}
          title="คะแนนภาษา"
          note="TOEFL / IELTS / SAT ฯลฯ"
          editHref="/student/profile/edit#language"
        >
          {data.language_scores.length === 0 && <p className="text-sm text-gray-500">ยังไม่กรอกคะแนนภาษา</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {data.language_scores.map((item) => (
              <div key={`${item.id}-${item.test_type}`} className="rounded-2xl border border-gray-100 p-4 bg-orange-50/40">
                <p className="text-sm font-semibold text-gray-800">{item.test_type}</p>
                <div className="mt-2 grid gap-1 text-sm text-gray-600">
                  <Field label="คะแนน" value={item.score} compact />
                  <Field label="ระดับ" value={item.test_level} compact />
                  <Field label="SAT Math" value={item.sat_math?.toString()} compact />
                  <Field label="วันที่สอบ" value={item.test_date} compact />
                  <Field label="ใบรับรอง" value={item.cert_file_path} isLink compact />
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
          {data.btd_test_scores.length === 0 && <p className="text-sm text-gray-500">ยังไม่กรอกคะแนน BT-D</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {data.btd_test_scores.map((item) => (
              <div key={`${item.id}-${item.test_type}-${item.subject}`} className="rounded-2xl border border-gray-100 p-4 bg-orange-50/40">
                <p className="text-sm font-semibold text-gray-800">{item.test_type || "ประเภทไม่ระบุ"}</p>
                <div className="mt-2 grid gap-1 text-sm text-gray-600">
                  <Field label="รายวิชา" value={item.subject} compact />
                  <Field label="คะแนนดิบ" value={item.raw_score?.toString()} compact />
                  <Field label="ปีที่สอบ" value={item.exam_year?.toString()} compact />
                  <Field label="ใบรับรอง" value={item.cert_file_path} isLink compact />
                </div>
              </div>
            ))}
          </div>
        </ProfileSection>
      </div>
    </div>
  );
}
