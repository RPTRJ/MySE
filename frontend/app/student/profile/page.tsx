"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiAcademicScore,
  ApiEducation,
  ApiGEDScore,
  ApiLanguageScore,
  ApiUser,
  HttpError,
  ProfileResponse,
  fetchMyProfile,
} from "@/services/profile";

const AVATAR_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" fill="none"><rect width="320" height="320" rx="160" fill="#FFE7D1"/><circle cx="160" cy="128" r="68" fill="#FFB566"/><path d="M72 270c0-48.6 39.4-88 88-88s88 39.4 88 88" fill="#FF9A3C"/></svg>`
  );

const EDUCATION_LEVELS: Record<number, string> = {
  1: "มัธยมศึกษาตอนต้น",
  2: "มัธยมศึกษาตอนปลาย",
  3: "ปวช.",
  4: "ปวส.",
};

const getEducationLevelName = (education?: ApiEducation) => {
  if (!education) return "ไม่ระบุ";
  if (education.education_level?.name) return education.education_level.name;
  const id = education.education_level_id || 0;
  return EDUCATION_LEVELS[id] || "ไม่ระบุ";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH");
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setError("กรุณาเข้าสู่ระบบอีกครั้ง");
      router.replace("/login");
      setLoading(false);
      return;
    }

    fetchMyProfile(token)
      .then((data) => setProfile(data))
      .catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const user: ApiUser | undefined = profile?.user;
  const education: ApiEducation | undefined = profile?.education;
  const academic: ApiAcademicScore | undefined = profile?.academic_score;
  const ged: ApiGEDScore | undefined = profile?.ged_score;
  const languageScores: ApiLanguageScore[] = profile?.language_scores || [];
  const educationStatus = education?.status;
  const educationStatusLabel = !education
    ? "ยังไม่กรอก"
    : educationStatus === "current"
      ? "กำลังศึกษา"
      : "สำเร็จการศึกษา";
  const educationStatusClass = !education
    ? "bg-gray-100 text-gray-800"
    : educationStatus === "current"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";

  // คำนวณอายุจากวันเกิด (Optional Helper)
  const calculateAge = (birthdayString?: string) => {
    if (!birthdayString) return "-";
    const today = new Date();
    const birthDate = new Date(birthdayString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const displayNames = useMemo(() => {
    const thai = [user?.first_name_th, user?.last_name_th].filter(Boolean).join(" ").trim();
    const eng = [user?.first_name_en, user?.last_name_en].filter(Boolean).join(" ").trim();
    return {
      primary: thai || eng || "Student",
      secondary: thai && eng ? eng : eng ? eng : thai,
    };
  }, [user?.first_name_en, user?.first_name_th, user?.last_name_en, user?.last_name_th]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        กำลังดึงข้อมูลโปรไฟล์...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-700 px-4">
        <p className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</p>
        <p className="text-sm text-gray-600 mb-4">{error || "ไม่พบข้อมูลผู้ใช้"}</p>
        <button
          onClick={() => router.refresh()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-md border border-orange-100 px-6 py-8 text-center">
          <div className="flex justify-center">
            <div className="relative h-36 w-36 sm:h-40 sm:w-40 rounded-full border-4 border-white shadow-lg overflow-hidden">
              <Image
                src={user.profile_image_url || AVATAR_PLACEHOLDER}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="mt-3 text-orange-500 text-sm">แก้ไขรูปภาพ</div>
          <div className="mt-4 flex justify-center gap-3">
            {["bg-orange-400", "bg-amber-400", "bg-green-400", "bg-blue-400", "bg-purple-400", "bg-pink-400"].map((c) => (
              <span key={c} className={`h-5 w-5 rounded-full ${c}`} />
            ))}
          </div>
          <div className="mt-3 flex justify-center">
            <span className="h-1.5 w-28 rounded-full bg-orange-400" />
          </div>
        </div>

        {/* Missing items banner */}
        {(() => {
          const missing: string[] = [];
          if (!academic) missing.push("ข้อมูลคะแนนหลักสูตรแกนกลางหรือ GED");
          if (!ged) missing.push("ใบเสร็จและเอกสารที่เกี่ยวข้อง");
          if (!languageScores.length) missing.push("คะแนน TGAT/TPAT หรือ A-Level");
          return missing.length ? (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 shadow-sm">
              <div className="text-sm font-semibold text-red-600 mb-3">มีบางรายการยังไม่สมบูรณ์</div>
              <ul className="space-y-2">
                {missing.map((item) => (
                  <li key={item} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow border border-red-100 text-sm text-gray-700">
                    <span className="text-red-400">⨀</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}

        {/* Personal Info */}
        <div className="bg-white rounded-2xl shadow border border-orange-100">
          <div className="flex justify-between items-center px-6 pt-5">
            <div>
              <div className="text-lg font-semibold text-gray-900">ข้อมูลส่วนตัว</div>
              <div className="text-xs text-orange-500">จำเป็นต้องมีสำหรับการสมัครเรียน (Admission)</div>
            </div>
            <Link href="/student/onboarding" className="text-sm text-orange-500 hover:underline">
              แก้ไข
            </Link>
          </div>
          <div className="mt-4 border-t border-orange-100">
            <dl className="divide-y divide-orange-50">
              {[
                { label: "ชื่อ", value: displayNames.primary },
                { label: "ชื่อ (EN)", value: displayNames.secondary || "-" },
                { label: "อีเมล", value: user.email },
                { label: "หมายเลขโทรศัพท์", value: user.phone || "-" },
                { label: "วันเกิด", value: formatDate(user.birthday) },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-2 gap-3 px-6 py-3 text-sm">
                  <dt className="text-gray-500">{row.label}</dt>
                  <dd className="text-gray-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl shadow border border-orange-100">
          <div className="flex justify-between items-center px-6 pt-5">
            <div>
              <div className="text-lg font-semibold text-gray-900">การศึกษา</div>
              <div className="text-xs text-orange-500">จำเป็นต้องมีสำหรับการสมัครเรียน (Admission)</div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${educationStatusClass}`}>
              {educationStatusLabel}
            </span>
          </div>
          <div className="mt-4 border-t border-orange-100">
            <dl className="divide-y divide-orange-50 text-sm">
              <div className="grid grid-cols-2 gap-3 px-6 py-3">
                <dt className="text-gray-500">ชื่อโรงเรียน</dt>
                <dd className="text-gray-900">{education?.school_name || "-"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3 px-6 py-3">
                <dt className="text-gray-500">ระดับชั้น</dt>
                <dd className="text-gray-900">{getEducationLevelName(education)}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3 px-6 py-3">
                <dt className="text-gray-500">ปีที่คาดว่าจะจบ</dt>
                <dd className="text-gray-900">
                  {education?.graduation_year ? `พ.ศ. ${education.graduation_year + 543}` : "-"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Academic Score */}
        <div className="bg-white rounded-2xl shadow border border-orange-100">
          <div className="flex justify-between items-center px-6 pt-5">
            <div>
              <div className="text-lg font-semibold text-gray-900">ข้อมูลคะแนนหลักสูตรแกนกลาง / GPAX</div>
              <div className="text-xs text-orange-500">จำเป็นต้องมีสำหรับการสมัครเรียน (Admission)</div>
            </div>
            <Link href="/student/onboarding" className="text-sm text-orange-500 hover:underline">
              แก้ไข
            </Link>
          </div>
          <div className="mt-4 border-t border-orange-100 px-6 py-5">
            {academic ? (
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">GPAX</dt>
                  <dd className="text-gray-900 font-semibold">{academic.gpax?.toFixed(2) ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">จำนวนเทอม</dt>
                  <dd className="text-gray-900 font-semibold">{academic.gpax_semesters ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">คณิตศาสตร์</dt>
                  <dd className="text-gray-900 font-semibold">{academic.gpa_math?.toFixed(2) ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">วิทยาศาสตร์</dt>
                  <dd className="text-gray-900 font-semibold">{academic.gpa_science?.toFixed(2) ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">ภาษาไทย</dt>
                  <dd className="text-gray-900 font-semibold">{academic.gpa_thai?.toFixed(2) ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">ภาษาอังกฤษ</dt>
                  <dd className="text-gray-900 font-semibold">{academic.gpa_english?.toFixed(2) ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">สังคมศึกษา</dt>
                  <dd className="text-gray-900 font-semibold">{academic.gpa_social?.toFixed(2) ?? "-"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">กรุณาเพิ่มข้อมูลคะแนน</p>
            )}
          </div>
        </div>

        {/* GED Score */}
        <div className="bg-white rounded-2xl shadow border border-orange-100">
          <div className="flex justify-between items-center px-6 pt-5">
            <div>
              <div className="text-lg font-semibold text-gray-900">คะแนน GED</div>
              <div className="text-xs text-orange-500">ข้อมูลคะแนนหลักสูตรเทียบเท่า</div>
            </div>
            <Link href="/student/onboarding" className="text-sm text-orange-500 hover:underline">
              แก้ไข
            </Link>
          </div>
          <div className="mt-4 border-t border-orange-100 px-6 py-5">
            {ged ? (
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">รวม</dt>
                  <dd className="text-gray-900 font-semibold">{ged.total_score ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Reasoning (RLA)</dt>
                  <dd className="text-gray-900 font-semibold">{ged.rla_score ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Math</dt>
                  <dd className="text-gray-900 font-semibold">{ged.math_score ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Science</dt>
                  <dd className="text-gray-900 font-semibold">{ged.science_score ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Social Studies</dt>
                  <dd className="text-gray-900 font-semibold">{ged.social_score ?? "-"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูล GED</p>
            )}
          </div>
        </div>

        {/* Language Scores */}
        <div className="bg-white rounded-2xl shadow border border-orange-100">
          <div className="flex justify-between items-center px-6 pt-5">
            <div>
              <div className="text-lg font-semibold text-gray-900">ข้อมูลคะแนนภาษา</div>
              <div className="text-xs text-orange-500">TGAT / TPAT / A-Level</div>
            </div>
            <Link href="/student/onboarding" className="text-sm text-orange-500 hover:underline">
              แก้ไข
            </Link>
          </div>
          <div className="mt-4 border-t border-orange-100 px-6 py-5">
            {languageScores.length ? (
              <div className="space-y-3">
                {languageScores.map((score) => (
                  <div
                    key={score.id || `${score.test_type}-${score.test_date}`}
                    className="flex flex-col md:flex-row md:items-center md:justify-between border border-orange-100 bg-orange-50/40 rounded-xl px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{score.test_type}</div>
                      <div className="text-xs text-gray-600">
                        ระดับ {score.test_level || "-"} | คะแนน {score.score || "-"}
                        {score.sat_math !== undefined && score.sat_math !== null ? ` | SAT Math ${score.sat_math}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 md:mt-0">
                      {formatDate(score.test_date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">โปรดเพิ่มข้อมูลคะแนนภาษา</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
