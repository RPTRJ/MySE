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

type Option = { id: string | number; name: string };

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
  const [educationDisplay, setEducationDisplay] = useState<{
    level: string;
    schoolType: string;
    schoolName: string;
    curriculum: string;
  } | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setError("กรุณาเข้าสู่ระบบอีกครั้ง");
      router.replace("/login");
      setLoading(false);
      return;
    }

    setToken(token);
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
    return items.find((item) => String(item.id) === String(id) || (Number.isFinite(numericId) && item.id === numericId))
      ?.name;
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

  // Derive display strings once profile + refs are available to avoid flicker/mismatch.
  useEffect(() => {
    if (!education) {
      setEducationDisplay(null);
      return;
    }
    const level = education.education_level?.name?.trim() || educationLevelName || "-";
    const schoolType = education.school_type?.name?.trim() || schoolTypeName || "-";
    const schoolName = education.school?.name || education.school_name || "-";
    const curriculum = education.curriculum_type?.name?.trim() || curriculumName || "-";
    setEducationDisplay({ level, schoolType, schoolName, curriculum });
  }, [education, educationLevelName, schoolTypeName, curriculumName]);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    Promise.all([
      fetch(`${apiBase}/reference/education-levels`, { headers }),
      fetch(`${apiBase}/reference/school-types`, { headers }),
      fetch(`${apiBase}/reference/curriculum-types`, { headers }),
    ])
      .then(async ([levelRes, schoolTypeRes, curriculumRes]) => {
        const [levelData, schoolTypeData, curriculumData] = await Promise.all([
          levelRes.json().catch(() => ({})),
          schoolTypeRes.json().catch(() => ({})),
          curriculumRes.json().catch(() => ({})),
        ]);

        const pickArray = (payload: any) => {
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.items)) return payload.items;
          if (Array.isArray(payload?.data)) return payload.data;
          if (Array.isArray(payload?.data?.items)) return payload.data.items;
          return [];
        };

        const levels = pickArray(levelData);
        const schoolTypeList = pickArray(schoolTypeData);
        const curriculumList = pickArray(curriculumData);

        setEducationLevels(levels.length ? normalizeOptions(levels) : []);
        setSchoolTypes(schoolTypeList.length ? normalizeOptions(schoolTypeList) : []);
        setCurriculumTypes(curriculumList.length ? normalizeOptions(curriculumList) : []);
        setRefsLoaded(true);
      })
      .catch(() => {
        /* ignore reference load errors */
        setRefsLoaded(true);
      });
  }, [token]);
  const displayNames = useMemo(() => {
    const thai = [user?.first_name_th, user?.last_name_th].filter(Boolean).join(" ").trim();
    const eng = [user?.first_name_en, user?.last_name_en].filter(Boolean).join(" ").trim();
    return {
      primary: thai || eng || "Student",
      secondary: thai && eng ? eng : eng ? eng : thai,
    };
  }, [user?.first_name_en, user?.first_name_th, user?.last_name_en, user?.last_name_th]);

  const missingSections = useMemo(() => {
    const missing: string[] = [];
    if (!education) missing.push("ข้อมูลการศึกษา");
    if (!academic) missing.push("ข้อมูลคะแนนหลักสูตรแกนกลาง / GPAX");
    if (!ged) missing.push("ข้อมูลคะแนน GED");
    if (!languageScores.length) missing.push("คะแนนภาษา TGAT/TPAT/A-Level");
    return missing;
  }, [education, academic, ged, languageScores.length]);

  const educationFields = [
    {
      label: "ระดับการศึกษา",
      value: educationDisplay?.level || "-",
    },
    {
      label: "ประเภทโรงเรียน",
      value: educationDisplay?.schoolType || "-",
    },
    {
      label: "ชื่อสถานศึกษา",
      value: educationDisplay?.schoolName || "-",
    },
    {
      label: "หลักสูตร",
      value: educationDisplay?.curriculum || "-",
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
        {missingSections.length ? (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="text-sm font-semibold text-red-600 mb-3">มีบางรายการยังไม่สมบูรณ์</div>
            <ul className="space-y-2">
              {missingSections.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow border border-red-100 text-sm text-gray-700"
                >
                  <span className="text-red-400">⨀</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="bg-white rounded-2xl shadow-md border border-orange-100 px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border border-gray-300 bg-white overflow-hidden flex items-center justify-center">
                <Image
                  src={user.profile_image_url || AVATAR_PLACEHOLDER}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="mt-2 text-orange-500 text-sm">แก้ไขรูปภาพ</div>
            </div>

            <div className="flex-1 w-full space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">ข้อมูลส่วนตัว</div>
                <Link href="/student/profile/edit/personal" className="text-sm text-orange-500 hover:underline">
                  แก้ไข
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-sm">
                {[
                  { label: "ชื่อ", value: user.first_name_th || user.first_name_en || "" },
                  { label: "นามสกุล", value: user.last_name_th || user.last_name_en || "" },
                  { label: "email", value: user.email || "" },
                  { label: "หมายเลขโทรศัพท์", value: user.phone || "" },
                  { label: "หมายเลขประจำตัว", value: user.id_number || "" },
                  { label: "วันเกิด", value: formatDate(user.birthday) !== "-" ? formatDate(user.birthday) : "" },
                ].map((row) => (
                  <div key={row.label} className="flex flex-col gap-1">
                    <span className="text-gray-700">{row.label}</span>
                    <div className="h-10 px-3 flex items-center rounded-full border border-gray-300 bg-white text-gray-900">
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SectionCard
          title="การศึกษา"
          action={
            <div className="flex items-center gap-3">
              <Link href="/student/profile/edit/education" className="text-sm text-orange-500 hover:underline">
                แก้ไข
              </Link>
            </div>
          }
          noDivider
        >
          <div className="py-5">
            {education ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-sm">
                {educationFields.map((row) => (
                  <div key={row.label} className="flex flex-col gap-1">
                    <span className="text-gray-700">{row.label}</span>
                    <div className="h-10 px-3 flex items-center rounded-full border border-gray-300 bg-white text-gray-900">
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : refsLoaded ? (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูลการศึกษา</p>
            ) : (
              <p className="text-sm text-gray-500">กำลังโหลดข้อมูลการศึกษา...</p>
            )}
          </div>
        </SectionCard>

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
                  <dt className="text-gray-500">จำนวนเทอม</dt>
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
              <p className="text-sm text-gray-500">กรุณาเพิ่มข้อมูลคะแนน</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="คะแนน GED"
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
                  <dd className="text-gray-900 font-semibold break-words">
                    {ged.cert_file_path || "-"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูล GED</p>
            )}
          </div>
        </SectionCard>

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
                {languageScores.map((score) => (
                  <div
                    key={score.id || `${score.test_type}-${score.test_date}`}
                    className="flex flex-col md:flex-row md:items-center md:justify-between border border-orange-100 bg-orange-50/40 rounded-xl px-4 py-3 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">{score.test_type}</div>
                      <div className="text-xs text-gray-600">
                        ระดับ {score.test_level || "-"} | คะแนน {score.score || "-"}
                        {score.sat_math !== undefined && score.sat_math !== null ? ` | SAT Math ${score.sat_math}` : ""}
                      </div>
                      {score.cert_file_path ? (
                        <div className="text-[11px] text-gray-500 break-words">
                          ไฟล์แนบ: {score.cert_file_path}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 md:mt-0 text-right">
                      {formatDate(score.test_date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">โปรดเพิ่มข้อมูลคะแนนภาษา</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
