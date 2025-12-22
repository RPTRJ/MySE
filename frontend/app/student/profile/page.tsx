"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { ProfileImageUploader } from "@/components/ProfileImageUploader";

type Option = { id: number; name: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH");
};

const formatScore = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return Number(value).toFixed(2);
};

type SectionCardProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noDivider?: boolean;
};

function SectionCard({ title, subtitle, action, children, noDivider }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow border border-orange-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 pt-5">
        <div>
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          {subtitle ? <div className="text-xs text-orange-500">{subtitle}</div> : null}
        </div>
        {action}
      </div>
      <div className={noDivider ? "mt-4 px-6 pb-5" : "mt-4 border-t border-orange-100"}>{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [educationLevels, setEducationLevels] = useState<Option[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<Option[]>([]);
  const [curriculumTypes, setCurriculumTypes] = useState<Option[]>([]);
  const [refsLoaded, setRefsLoaded] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!authToken) {
      setError("กรุณาเข้าสู่ระบบอีกครั้ง");
      router.replace("/login");
      setLoading(false);
      return;
    }

    setToken(authToken);
    fetchMyProfile(authToken)
      .then((data) => {
        setProfile(data);
        setProfileImageUrl(data.user?.profile_image_url);
      })
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

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/reference/education-levels`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];
        setEducationLevels(normalizeOptions(items));
      });

    fetch(`${API_URL}/reference/school-types`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];
        setSchoolTypes(normalizeOptions(items));
      });

    fetch(`${API_URL}/reference/curriculum-types`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];
        setCurriculumTypes(items.length ? normalizeOptions(items) : []);
        setRefsLoaded(true);
      })
      .catch(() => {
        setRefsLoaded(true);
      });
  }, [token]);

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

  const resolveNameById = (items: Option[], id?: number | null) => {
    if (id === undefined || id === null) return undefined;
    const numericId = Number(id);
    return items.find(
      (item) => String(item.id) === String(id) || (Number.isFinite(numericId) && item.id === numericId)
    )?.name;
  };

  const educationLevelName = useMemo(() => {
    if (!education) return "-";
    const fromObj = education.education_level?.name?.trim();
    if (fromObj) return fromObj;
    const byId = resolveNameById(educationLevels, education.education_level_id);
    if (byId) return byId;
    return "-";
  }, [education, educationLevels]);

  const schoolTypeName = useMemo(() => {
    if (!education) return "-";
    const fromObj = education.school_type?.name?.trim();
    if (fromObj) return fromObj;
    const byId = resolveNameById(schoolTypes, education.school_type_id);
    return byId || "-";
  }, [education, schoolTypes]);

  const curriculumName = useMemo(() => {
    if (!education) return "-";
    const fromObj = education.curriculum_type?.name?.trim();
    if (fromObj) return fromObj;
    const byId = resolveNameById(curriculumTypes, education.curriculum_type_id);
    return byId || "-";
  }, [education, curriculumTypes]);

  const displayNames = useMemo(() => {
    const thai = [user?.first_name_th, user?.last_name_th].filter(Boolean).join(" ").trim();
    const eng = [user?.first_name_en, user?.last_name_en].filter(Boolean).join(" ").trim();
    return {
      primary: thai || eng || "Student",
      secondary: thai && eng ? eng : "",
    };
  }, [user?.first_name_en, user?.first_name_th, user?.last_name_en, user?.last_name_th]);

  // ตรวจสอบว่าชื่อที่มีเป็นภาษาไทยหรืออังกฤษ
  const nameLanguage = useMemo(() => {
    if (user?.first_name_th || user?.last_name_th) return "thai";
    if (user?.first_name_en || user?.last_name_en) return "english";
    return "none";
  }, [user]);

  // แก้ไข: ลบ "คะแนนภาษา" ออกจากการตรวจสอบ
  const missingSections = useMemo(() => {
    const missing: string[] = [];
    if (!education) missing.push("ข้อมูลการศึกษา");
    if (!academic && !ged) missing.push("ข้อมูลคะแนนหลักสูตรแกนกลาง / GPAX");
    return missing;
  }, [education, academic, ged]);

  const educationFields = [
    {
      label: "ระดับการศึกษา",
      value: educationLevelName,
    },
    {
      label: "ประเภทโรงเรียน",
      value: schoolTypeName,
    },
    {
      label: "ชื่อสถานศึกษา",
      value: education?.school?.name || education?.school_name || "-",
    },
    {
      label: "หลักสูตร",
      value: curriculumName,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        กำลังดึงข้อมูลโปรไฟล์...
      </div>
    );
  }

  if ((error && !refsLoaded) || !user) {
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
        {missingSections.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">ข้อมูลยังไม่ครบถ้วน</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>กรุณากรอกข้อมูลต่อไปนี้ให้ครบถ้วน:</p>
                  <ul className="list-disc list-inside mt-1">
                    {missingSections.map((section) => (
                      <li key={section}>{section}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Card - ยุบเข้าด้วยกัน */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-10 sm:px-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Profile Image - ซ้าย */}
              <div className="flex-shrink-0">
                <ProfileImageUploader
                  currentImageUrl={profileImageUrl}
                  onImageUpdated={(newUrl) => setProfileImageUrl(newUrl)}
                />
              </div>

              {/* Personal Info - ขวา */}
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-white">{displayNames.primary}</h1>
                  <Link
                    href="/student/profile/edit/personal"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    แก้ไข
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ชื่อ */}
                  {nameLanguage === "thai" && (
                    <>
                      <div>
                        <div className="text-xs text-orange-100 mb-1">ชื่อ (ไทย)</div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 text-white">
                          {user.first_name_th || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-orange-100 mb-1">นามสกุล (ไทย)</div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 text-white">
                          {user.last_name_th || "-"}
                        </div>
                      </div>
                    </>
                  )}

                  {nameLanguage === "english" && (
                    <>
                      <div>
                        <div className="text-xs text-orange-100 mb-1">ชื่อ (อังกฤษ)</div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 text-white">
                          {user.first_name_en || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-orange-100 mb-1">นามสกุล (อังกฤษ)</div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 text-white">
                          {user.last_name_en || "-"}
                        </div>
                      </div>
                    </>
                  )}

                  {/* อีเมล */}
                  <div>
                    <div className="text-xs text-orange-100 mb-1">อีเมล</div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 text-white">
                      {user.email}
                    </div>
                  </div>

                  {/* เบอร์โทรศัพท์ */}
                  <div>
                    <div className="text-xs text-orange-100 mb-1">เบอร์โทรศัพท์</div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 text-white">
                      {user.phone || "-"}
                    </div>
                  </div>

                  {/* วันเกิด */}
                  <div>
                    <div className="text-xs text-orange-100 mb-1">วันเกิด</div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 text-white">
                      {formatDate(user.birthday)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                    <span className="mr-1.5">🎓</span>
                    {user.type_id === 1 ? "นักศึกษา" : "STUDENT"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Education Info */}
        <SectionCard
          title="ข้อมูลการศึกษา"
          action={
            <Link href="/student/profile/edit/education" className="text-sm text-orange-500 hover:underline">
              แก้ไข
            </Link>
          }
        >
          <div className="px-6 py-5">
            {education ? (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {educationFields.map((field) => (
                  <div key={field.label}>
                    <dt className="text-gray-500 mb-1">{field.label}</dt>
                    <dd className="text-gray-900 font-medium">{field.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูลการศึกษา</p>
            )}
          </div>
        </SectionCard>

        {/* Academic Score */}
        <SectionCard
          title="ข้อมูลคะแนนหลักสูตรแกนกลาง / GPAX"
          action={
            <Link href="/student/profile/edit/academic-score" className="text-sm text-orange-500 hover:underline">
              แก้ไข
            </Link>
          }
        >
          <div className="px-6 py-5">
            {academic ? (
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">GPAX</dt>
                  <dd className="text-gray-900 font-semibold">{formatScore(academic.gpax)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">เทอม</dt>
                  <dd className="text-gray-900 font-semibold">{academic.gpax_semesters ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">คณิตศาสตร์</dt>
                  <dd className="text-gray-900 font-semibold">{formatScore(academic.gpa_math)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">วิทยาศาสตร์</dt>
                  <dd className="text-gray-900 font-semibold">{formatScore(academic.gpa_science)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">ภาษาไทย</dt>
                  <dd className="text-gray-900 font-semibold">{formatScore(academic.gpa_thai)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">ภาษาอังกฤษ</dt>
                  <dd className="text-gray-900 font-semibold">{formatScore(academic.gpa_english)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">สังคมศึกษา</dt>
                  <dd className="text-gray-900 font-semibold">{formatScore(academic.gpa_social)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">คะแนนรวม</dt>
                  <dd className="text-gray-900 font-semibold">{formatScore(academic.gpa_total_score)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">ไฟล์ Transcript</dt>
                  <dd className="text-gray-900 font-semibold break-words">
                    {academic.transcript_file_path || "-"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูลคะแนนหลักสูตรแกนกลาง</p>
            )}
          </div>
        </SectionCard>

        {/* GED Score */}
        <SectionCard
          title="ข้อมูลคะแนน GED"
          action={
            <Link href="/student/profile/edit/ged-score" className="text-sm text-orange-500 hover:underline">
              แก้ไข
            </Link>
          }
        >
          <div className="px-6 py-5">
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
                <div>
                  <dt className="text-gray-500">ไฟล์ใบรับรอง</dt>
                  <dd className="text-gray-900 font-semibold break-words">{ged.cert_file_path || "-"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูล GED</p>
            )}
          </div>
        </SectionCard>

        {/* Language Scores */}
        <SectionCard
          title="ข้อมูลคะแนนภาษา"
          action={
            <Link href="/student/profile/edit/language-scores" className="text-sm text-orange-500 hover:underline">
              แก้ไข
            </Link>
          }
        >
          <div className="px-6 py-5">
            {languageScores.length ? (
              <div className="space-y-3">
                {languageScores.map((score, idx) => (
                  <div
                    key={score.id || `${score.test_type}-${idx}`}
                    className="flex flex-col md:flex-row md:items-center md:justify-between border border-orange-100 bg-orange-50/40 rounded-xl px-4 py-3 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">{score.test_type}</div>
                      <div className="text-xs text-gray-600">
                        ระดับ {score.test_level || "-"} | คะแนน {score.score || "-"}
                        {score.sat_math !== undefined && score.sat_math !== null
                          ? ` | SAT Math ${score.sat_math}`
                          : ""}
                      </div>
                      {score.cert_file_path ? (
                        <a
                          href={score.cert_file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-orange-500 hover:underline inline-flex items-center"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          ดูไฟล์
                        </a>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 md:mt-0">
                      {score.test_date ? formatDate(score.test_date) : "ไม่ระบุวันที่"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูลคะแนนภาษา</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}