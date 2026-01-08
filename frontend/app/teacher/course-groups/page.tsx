"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  fetchCourseGroups,
  fetchAllSkills,
  createCourseGroup,
  updateCourseGroup,
  deleteCourseGroup,
  addSkillToCourseGroup,
  removeSkillFromCourseGroup,
  updateCourseGroupSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  type CourseGroupDTO,
  type SkillDTO,
  type CourseGroupSkillDTO,
} from "@/services/courseGroup";

type Tab = "course-groups" | "skills";

// ==================== Icon Components ====================

const IconCalculator = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const IconFlask = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const IconCode = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const IconBook = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconFolder = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "calculator": return <IconCalculator />;
    case "flask": return <IconFlask />;
    case "code": return <IconCode />;
    case "book": return <IconBook />;
    case "users": return <IconUsers />;
    default: return <IconFolder />;
  }
};

const ICON_OPTIONS = [
  { value: "calculator", label: "เครื่องคิดเลข" },
  { value: "flask", label: "ขวดทดลอง" },
  { value: "code", label: "โค้ด" },
  { value: "book", label: "หนังสือ" },
  { value: "users", label: "กลุ่มคน" },
  { value: "folder", label: "โฟลเดอร์" },
];

const SKILL_CATEGORIES = [
  { value: 1, label: "ทักษะด้านความคิด" },
  { value: 2, label: "ทักษะด้านการทำงาน" },
  { value: 3, label: "ทักษะด้านการเรียนรู้" },
];

// ==================== Main Component ====================

export default function AdminCourseGroupsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("course-groups");

  // Course Groups state
  const [courseGroups, setCourseGroups] = useState<CourseGroupDTO[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CourseGroupDTO | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    name_en: "",
    description: "",
    icon: "folder",
    is_active: true,
  });

  // Skills state
  const [skills, setSkills] = useState<SkillDTO[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillDTO | null>(null);
  const [skillForm, setSkillForm] = useState({
    skill_name_th: "",
    skill_name_en: "",
    category: 1,
    description: "",
  });

  // Modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showSkillsManageModal, setShowSkillsManageModal] = useState(false);
  const [managingGroup, setManagingGroup] = useState<CourseGroupDTO | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "group" | "skill" | "group-skill";
    id: number;
    skillId?: number;
    label: string;
  } | null>(null);

  // ==================== Auth Guard ====================

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.type_id !== 2 && user.type_id !== 3) {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push("/");
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // ==================== Load Data ====================

  const loadCourseGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const data = await fetchCourseGroups();
      setCourseGroups(data);
    } catch (err) {
      toast.error("โหลดข้อมูลกลุ่มวิชาไม่สำเร็จ");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const loadSkills = useCallback(async () => {
    setLoadingSkills(true);
    try {
      const data = await fetchAllSkills();
      setSkills(data);
    } catch (err) {
      toast.error("โหลดข้อมูลทักษะไม่สำเร็จ");
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadCourseGroups();
      loadSkills();
    }
  }, [isAuthorized, loadCourseGroups, loadSkills]);

  // ==================== Course Group Handlers ====================

  const resetGroupForm = () => {
    setGroupForm({
      name: "",
      name_en: "",
      description: "",
      icon: "folder",
      is_active: true,
    });
    setEditingGroup(null);
  };

  const handleEditGroup = (group: CourseGroupDTO) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      name_en: group.name_en || "",
      description: group.description || "",
      icon: group.icon || "folder",
      is_active: group.is_active,
    });
    setShowGroupModal(true);
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error("กรุณากรอกชื่อกลุ่มวิชา");
      return;
    }

    setSaving(true);
    try {
      if (editingGroup) {
        const updated = await updateCourseGroup(editingGroup.id, groupForm);
        setCourseGroups((prev) =>
          prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g))
        );
        toast.success("อัปเดตกลุ่มวิชาสำเร็จ");
      } else {
        const created = await createCourseGroup(groupForm);
        setCourseGroups((prev) => [...prev, created]);
        toast.success("สร้างกลุ่มวิชาสำเร็จ");
      }
      setShowGroupModal(false);
      resetGroupForm();
    } catch (err) {
      toast.error(editingGroup ? "อัปเดตไม่สำเร็จ" : "สร้างไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirmDelete || confirmDelete.type !== "group") return;

    setSaving(true);
    try {
      await deleteCourseGroup(confirmDelete.id);
      setCourseGroups((prev) => prev.filter((g) => g.id !== confirmDelete.id));
      toast.success("ลบกลุ่มวิชาสำเร็จ");
    } catch (err) {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  // ==================== Skill Handlers ====================

  const resetSkillForm = () => {
    setSkillForm({
      skill_name_th: "",
      skill_name_en: "",
      category: 1,
      description: "",
    });
    setEditingSkill(null);
  };

  const handleEditSkill = (skill: SkillDTO) => {
    setEditingSkill(skill);
    setSkillForm({
      skill_name_th: skill.skill_name_th,
      skill_name_en: skill.skill_name_en || "",
      category: skill.category || 1,
      description: skill.description || "",
    });
    setShowSkillModal(true);
  };

  const handleSaveSkill = async () => {
    if (!skillForm.skill_name_th.trim()) {
      toast.error("กรุณากรอกชื่อทักษะ (ไทย)");
      return;
    }

    setSaving(true);
    try {
      if (editingSkill) {
        const updated = await updateSkill(editingSkill.id, skillForm);
        setSkills((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        toast.success("อัปเดตทักษะสำเร็จ");
      } else {
        const created = await createSkill(skillForm);
        setSkills((prev) => [...prev, created]);
        toast.success("สร้างทักษะสำเร็จ");
      }
      setShowSkillModal(false);
      resetSkillForm();
    } catch (err) {
      toast.error(editingSkill ? "อัปเดตไม่สำเร็จ" : "สร้างไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!confirmDelete || confirmDelete.type !== "skill") return;

    setSaving(true);
    try {
      await deleteSkill(confirmDelete.id);
      setSkills((prev) => prev.filter((s) => s.id !== confirmDelete.id));
      toast.success("ลบทักษะสำเร็จ");
    } catch (err) {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  // ==================== Manage Skills in Group ====================

  const handleManageSkills = (group: CourseGroupDTO) => {
    setManagingGroup(group);
    setShowSkillsManageModal(true);
  };

  const handleAddSkillToGroup = async (skillId: number) => {
    if (!managingGroup) return;

    try {
      await addSkillToCourseGroup(managingGroup.id, {
        skill_id: skillId,
        importance: 3,
      });
      
      // Reload course groups to get updated data
      await loadCourseGroups();
      
      // Update managing group
      const updated = courseGroups.find((g) => g.id === managingGroup.id);
      if (updated) {
        setManagingGroup(updated);
      }
      
      toast.success("เพิ่มทักษะสำเร็จ");
    } catch (err: any) {
      toast.error(err.message || "เพิ่มทักษะไม่สำเร็จ");
    }
  };

  const handleRemoveSkillFromGroup = async () => {
    if (!confirmDelete || confirmDelete.type !== "group-skill" || !managingGroup) return;

    setSaving(true);
    try {
      await removeSkillFromCourseGroup(confirmDelete.id, confirmDelete.skillId!);
      
      // Reload course groups
      await loadCourseGroups();
      
      toast.success("ลบทักษะออกจากกลุ่มสำเร็จ");
    } catch (err) {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  const handleUpdateImportance = async (
    groupId: number,
    skillId: number,
    importance: number
  ) => {
    try {
      await updateCourseGroupSkill(groupId, skillId, {
        skill_id: skillId,
        importance,
      });
      await loadCourseGroups();
      toast.success("อัปเดตความสำคัญสำเร็จ");
    } catch (err) {
      toast.error("อัปเดตไม่สำเร็จ");
    }
  };

  // Update managingGroup when courseGroups change
  useEffect(() => {
    if (managingGroup) {
      const updated = courseGroups.find((g) => g.id === managingGroup.id);
      if (updated) {
        setManagingGroup(updated);
      }
    }
  }, [courseGroups, managingGroup?.id]);

  // ==================== Render ====================

  if (!isAuthorized) {
    return null;
  }

  const linkedSkillIds = new Set(
    managingGroup?.course_group_skills?.map((cgs) => cgs.skill_id) || []
  );
  const availableSkills = skills.filter((s) => !linkedSkillIds.has(s.id));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            จัดการกลุ่มวิชาและทักษะ
          </h1>
          <p className="text-gray-600 mt-1">
            จัดการข้อมูลกลุ่มวิชาและทักษะที่ต้องมีก่อนเรียน
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("course-groups")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "course-groups"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            กลุ่มวิชา ({courseGroups.length})
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "skills"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ทักษะ ({skills.length})
          </button>
        </div>

        {/* Course Groups Tab */}
        {activeTab === "course-groups" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">รายการกลุ่มวิชา</h2>
              <button
                onClick={() => {
                  resetGroupForm();
                  setShowGroupModal(true);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                + เพิ่มกลุ่มวิชา
              </button>
            </div>

            {loadingGroups ? (
              <div className="text-center py-10 text-gray-500">กำลังโหลด...</div>
            ) : courseGroups.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                ยังไม่มีกลุ่มวิชา
              </div>
            ) : (
              <div className="grid gap-4">
                {courseGroups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white rounded-lg shadow p-4 border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                          {getIconComponent(group.icon || "folder")}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {group.name}
                            {group.name_en && (
                              <span className="text-gray-400 font-normal ml-2">
                                ({group.name_en})
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {group.description || "ไม่มีรายละเอียด"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                group.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {group.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                            </span>
                            <span className="text-xs text-gray-400">
                              ทักษะ: {group.course_group_skills?.length || 0} รายการ
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleManageSkills(group)}
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          จัดการทักษะ
                        </button>
                        <button
                          onClick={() => handleEditGroup(group)}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              type: "group",
                              id: group.id,
                              label: group.name,
                            })
                          }
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>

                    {/* Skills Preview */}
                    {group.course_group_skills && group.course_group_skills.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {group.course_group_skills.map((cgs) => (
                            <span
                              key={cgs.id}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1"
                            >
                              {cgs.skill?.skill_name_th || "ไม่ทราบ"}
                              <span className="text-orange-500">
                                {"★".repeat(cgs.importance)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">รายการทักษะ</h2>
              <button
                onClick={() => {
                  resetSkillForm();
                  setShowSkillModal(true);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                + เพิ่มทักษะ
              </button>
            </div>

            {loadingSkills ? (
              <div className="text-center py-10 text-gray-500">กำลังโหลด...</div>
            ) : skills.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                ยังไม่มีทักษะ
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        ชื่อทักษะ (ไทย)
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        ชื่อทักษะ (อังกฤษ)
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        หมวดหมู่
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {skills.map((skill) => (
                      <tr key={skill.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {skill.skill_name_th}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {skill.skill_name_en || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {SKILL_CATEGORIES.find((c) => c.value === skill.category)?.label || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEditSkill(skill)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                type: "skill",
                                id: skill.id,
                                label: skill.skill_name_th,
                              })
                            }
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingGroup ? "แก้ไขกลุ่มวิชา" : "เพิ่มกลุ่มวิชา"}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อกลุ่มวิชา (ไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="เช่น วิชาคำนวณและตรรกะ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อกลุ่มวิชา (อังกฤษ)
                </label>
                <input
                  type="text"
                  value={groupForm.name_en}
                  onChange={(e) => setGroupForm({ ...groupForm, name_en: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g. Calculation & Logic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="อธิบายว่ากลุ่มวิชานี้เรียนอะไร"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ไอคอน
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGroupForm({ ...groupForm, icon: opt.value })}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        groupForm.icon === opt.value
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                      title={opt.label}
                    >
                      {getIconComponent(opt.value)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={groupForm.is_active}
                  onChange={(e) => setGroupForm({ ...groupForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  เปิดใช้งาน
                </label>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  resetGroupForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={saving}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingSkill ? "แก้ไขทักษะ" : "เพิ่มทักษะ"}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อทักษะ (ไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={skillForm.skill_name_th}
                  onChange={(e) => setSkillForm({ ...skillForm, skill_name_th: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="เช่น การคิดเชิงตรรกะ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อทักษะ (อังกฤษ)
                </label>
                <input
                  type="text"
                  value={skillForm.skill_name_en}
                  onChange={(e) => setSkillForm({ ...skillForm, skill_name_en: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g. Logical Thinking"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่
                </label>
                <select
                  value={skillForm.category}
                  onChange={(e) => setSkillForm({ ...skillForm, category: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="เลือกหมวดหมู่ทักษะ"
                  title="หมวดหมู่ทักษะ"
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={skillForm.description}
                  onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="อธิบายเกี่ยวกับทักษะนี้"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSkillModal(false);
                  resetSkillForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveSkill}
                disabled={saving}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Skills Modal */}
      {showSkillsManageModal && managingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                จัดการทักษะ: {managingGroup.name}
              </h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {/* Current Skills */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">
                  ทักษะที่เพิ่มแล้ว ({managingGroup.course_group_skills?.length || 0})
                </h4>
                {managingGroup.course_group_skills && managingGroup.course_group_skills.length > 0 ? (
                  <div className="space-y-2">
                    {managingGroup.course_group_skills.map((cgs) => (
                      <div
                        key={cgs.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">
                            {cgs.skill?.skill_name_th || "ไม่ทราบ"}
                          </span>
                          {cgs.skill?.skill_name_en && (
                            <span className="text-gray-400 ml-2">
                              ({cgs.skill.skill_name_en})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">ความสำคัญ:</span>
                            <select
                              value={cgs.importance}
                              onChange={(e) =>
                                handleUpdateImportance(
                                  managingGroup.id,
                                  cgs.skill_id,
                                  parseInt(e.target.value)
                                )
                              }
                              className="px-2 py-1 border rounded text-sm"
                              aria-label={`ความสำคัญของทักษะ ${cgs.skill?.skill_name_th || ''}`}
                              title="เลือกระดับความสำคัญ"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n} {"★".repeat(n)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                type: "group-skill",
                                id: managingGroup.id,
                                skillId: cgs.skill_id,
                                label: cgs.skill?.skill_name_th || "ทักษะ",
                              })
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">ยังไม่มีทักษะ</p>
                )}
              </div>

              {/* Available Skills */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  ทักษะที่สามารถเพิ่มได้ ({availableSkills.length})
                </h4>
                {availableSkills.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSkills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => handleAddSkillToGroup(skill.id)}
                        className="flex items-center justify-between p-2 border rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors text-left"
                      >
                        <span className="text-sm">{skill.skill_name_th}</span>
                        <span className="text-orange-500 text-lg">+</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    เพิ่มทักษะทั้งหมดแล้ว หรือยังไม่มีทักษะในระบบ
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowSkillsManageModal(false);
                  setManagingGroup(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                ยืนยันการลบ
              </h3>
              <p className="text-gray-600">
                คุณต้องการลบ "{confirmDelete.label}" ใช่หรือไม่?
              </p>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === "group") handleDeleteGroup();
                  else if (confirmDelete.type === "skill") handleDeleteSkill();
                  else if (confirmDelete.type === "group-skill") handleRemoveSkillFromGroup();
                }}
                disabled={saving}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {saving ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}