"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiAcademicScore,
  ApiEducation,
  ApiGEDScore,
  ApiLanguageScore,
  ApiUser,
  ProfileResponse,
  HttpError,
  fetchUserProfileByAdmin,
  fetchUsers,
} from "@/services/profile";

const roleMap: Record<number, string> = {
  1: "Student",
  2: "Teacher",
  3: "Admin",
};

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

const getDisplayName = (user?: ApiUser | null) => {
  if (!user) return "ไม่ระบุชื่อ";
  const thai = [user.first_name_th, user.last_name_th].filter(Boolean).join(" ").trim();
  const eng = [user.first_name_en, user.last_name_en].filter(Boolean).join(" ").trim();
  return thai || eng || "ไม่ระบุชื่อ";
};

const getRoleLabel = (user?: ApiUser | null) => {
  if (!user) return "-";
  return (
    user.user_type?.name ||
    user.user_type?.type_name ||
    roleMap[user.type_id ?? 0] ||
    "Unknown"
  );
};

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-orange-50">
        <div>
          <div className="text-base font-semibold text-gray-900">{title}</div>
          {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-900 break-words">{value || "-"}</div>
    </div>
  );
}

export default function AdminUserProfilesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const tk = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!tk || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.type_id !== 3) {
        alert("No permission");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }
      setToken(tk);
      setIsAuthorized(true);
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthorized || !token) return;

    const loadUsers = async () => {
      setListLoading(true);
      setListError(null);
      try {
        const data = await fetchUsers(token);
        setUsers(data);
        if (data.length) {
          setSelectedUser((prev) => prev ?? data[0]);
        }
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        setListError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
      } finally {
        setListLoading(false);
      }
    };

    loadUsers();
  }, [isAuthorized, token, router]);

  useEffect(() => {
    if (!selectedUser || !token) return;

    let canceled = false;
    const numericId = Number(selectedUser.id ?? (selectedUser as any)?.ID ?? 0);
    const targetId = Number.isFinite(numericId) && numericId > 0 ? numericId : selectedUser.id;
    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const data = await fetchUserProfileByAdmin(token, targetId);
        if (!canceled) {
          setProfile(data);
        }
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        if (!canceled) {
          setProfile(null);
          setProfileError(err instanceof Error ? err.message : "ไม่สามารถโหลดโปรไฟล์ได้");
        }
      } finally {
        if (!canceled) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => {
      canceled = true;
    };
  }, [selectedUser, token, router]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      const name = getDisplayName(u).toLowerCase();
      return (
        name.includes(term) ||
        (u.email || "").toLowerCase().includes(term) ||
        (u.id_number || "").toLowerCase().includes(term)
      );
    });
  }, [search, users]);

  if (!isAuthorized) return null;

  const profileUser = profile?.user || selectedUser;
  const education: ApiEducation | undefined = profile?.education;
  const academic: ApiAcademicScore | undefined = profile?.academic_score;
  const ged: ApiGEDScore | undefined = profile?.ged_score;
  const languageScores: ApiLanguageScore[] = profile?.language_scores || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 p-6">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ข้อมูลโปรไฟล์ผู้ใช้</h1>
            <p className="text-sm text-gray-600">
              สำหรับผู้ดูแลระบบ: ดูสถานะโปรไฟล์ การศึกษา และคะแนนของผู้ใช้ทุกคน
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-orange-100 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            {users.length} ผู้ใช้ทั้งหมด
          </div>
        </div>
        {listError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users list */}
        <div className="rounded-2xl border border-orange-100 bg-white shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">รายชื่อผู้ใช้</h2>
              <p className="text-xs text-gray-500">คลิกเพื่อดูรายละเอียดโปรไฟล์</p>
            </div>
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
              {filteredUsers.length} รายการ
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาด้วยชื่อ อีเมล หรือเลขบัตรประชาชน"
              className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <svg
              className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            {listLoading ? (
              <div className="text-sm text-gray-500 px-2 py-4 text-center">กำลังโหลด...</div>
            ) : null}
            {!listLoading && filteredUsers.length === 0 ? (
              <div className="text-sm text-gray-500 px-2 py-4 text-center">ไม่พบผู้ใช้</div>
            ) : null}

            {filteredUsers.map((user, idx) => {
              const normalizedId = Number(user.id ?? (user as any)?.ID ?? 0);
              const isActive =
                selectedUser?.id === user.id ||
                selectedUser?.id === normalizedId ||
                normalizedId === Number((selectedUser as any)?.ID ?? 0);
              const key = String(user.id ?? (user as any)?.ID ?? user.email ?? idx);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition-all ${
                    isActive
                      ? "border-orange-300 bg-orange-50 shadow-inner"
                      : "border-gray-100 bg-gray-50 hover:border-orange-200 hover:bg-orange-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900">{getDisplayName(user)}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">เลขบัตร: {user.id_number || "-"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                        {getRoleLabel(user)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          user.profile_completed
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.profile_completed ? "โปรไฟล์ครบ" : "ยังไม่ครบ"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile detail */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-orange-100 bg-white shadow-sm p-5">
            {profileLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-600">
                <svg className="animate-spin h-5 w-5 mr-2 text-orange-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                กำลังโหลดข้อมูลโปรไฟล์...
              </div>
            ) : null}

            {!profileLoading && profileError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileError}
              </div>
            ) : null}

            {!profileLoading && !profileError && !profileUser ? (
              <div className="text-center text-sm text-gray-500 py-10">เลือกผู้ใช้เพื่อดูรายละเอียด</div>
            ) : null}

            {!profileLoading && !profileError && profileUser ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase text-gray-500">ผู้ใช้</div>
                    <div className="text-2xl font-bold text-gray-900">{getDisplayName(profileUser)}</div>
                    <div className="text-sm text-gray-600">{profileUser.email}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                      {getRoleLabel(profileUser)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        profileUser.profile_completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {profileUser.profile_completed ? "โปรไฟล์ครบถ้วน" : "ยังไม่กรอกครบ"}
                    </span>
                    {profileUser.pdpa_consent ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        PDPA ยินยอมแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        ยังไม่ให้ PDPA
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoRow label="เบอร์โทร" value={profileUser.phone || "-"} />
                  <InfoRow label="วันเกิด" value={formatDate(profileUser.birthday)} />
                  <InfoRow label="ประเภทเอกสาร" value={profileUser.user_id_type?.id_name || "-"} />
                  <InfoRow label="เลขบัตร" value={profileUser.id_number || "-"} />
                  <InfoRow label="ประเภทผู้ใช้" value={getRoleLabel(profileUser)} />
                  <InfoRow
                    label="PDPA"
                    value={
                      profileUser.pdpa_consent
                        ? `ยินยอมแล้ว (${formatDate(profileUser.pdpa_consent_at || undefined)})`
                        : "ยังไม่ได้ยินยอม"
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>

          <SectionCard title="ข้อมูลการศึกษา" subtitle="ระดับการศึกษาและสถานศึกษา">
            {education ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <InfoRow label="ระดับการศึกษา" value={education.education_level?.name || "-"} />
                <InfoRow label="ประเภทโรงเรียน" value={education.school_type?.name || "-"} />
                <InfoRow label="ชื่อสถานศึกษา" value={education.school?.name || education.school_name || "-"} />
                <InfoRow label="หลักสูตร" value={education.curriculum_type?.name || "-"} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูลการศึกษา</p>
            )}
          </SectionCard>

          <SectionCard title="ข้อมูลคะแนนหลักสูตรแกนกลาง / GPAX" subtitle="คะแนนรวมและรายวิชา">
            {academic ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoRow label="GPAX" value={formatScore(academic.gpax)} />
                <InfoRow label="เทอม" value={academic.gpax_semesters ?? "-"} />
                <InfoRow label="คณิตศาสตร์" value={formatScore(academic.gpa_math)} />
                <InfoRow label="วิทยาศาสตร์" value={formatScore(academic.gpa_science)} />
                <InfoRow label="ภาษาไทย" value={formatScore(academic.gpa_thai)} />
                <InfoRow label="ภาษาอังกฤษ" value={formatScore(academic.gpa_english)} />
                <InfoRow label="สังคมศึกษา" value={formatScore(academic.gpa_social)} />
                <InfoRow label="คะแนนรวม" value={formatScore(academic.gpa_total_score)} />
                <InfoRow label="ไฟล์ Transcript" value={academic.transcript_file_path || "-"} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูลคะแนนหลักสูตรแกนกลาง</p>
            )}
          </SectionCard>

          <SectionCard title="ข้อมูลคะแนน GED">
            {ged ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <InfoRow label="รวม" value={ged.total_score ?? "-"} />
                <InfoRow label="Reasoning (RLA)" value={ged.rla_score ?? "-"} />
                <InfoRow label="Math" value={ged.math_score ?? "-"} />
                <InfoRow label="Science" value={ged.science_score ?? "-"} />
                <InfoRow label="Social Studies" value={ged.social_score ?? "-"} />
                <InfoRow label="ไฟล์ใบรับรอง" value={ged.cert_file_path || "-"} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูล GED</p>
            )}
          </SectionCard>

          <SectionCard title="ข้อมูลคะแนนภาษา">
            {languageScores.length ? (
              <div className="space-y-3">
                {languageScores.map((score, idx) => (
                  <div
                    key={score.id || `${score.test_type}-${idx}`}
                    className="rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900">{score.test_type}</div>
                      <div className="text-xs text-gray-500">{score.test_date ? formatDate(score.test_date) : "-"}</div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      ระดับ {score.test_level || "-"} | คะแนน {score.score || "-"}
                      {score.sat_math !== undefined && score.sat_math !== null ? ` | SAT Math ${score.sat_math}` : ""}
                    </div>
                    {score.cert_file_path ? (
                      <a
                        href={score.cert_file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-orange-600 hover:underline mt-1"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูลคะแนนภาษา</p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
