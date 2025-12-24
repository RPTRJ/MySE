"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserTypeName,
  getIDTypeName,
  formatDate,
  UserDTO,
  CreateUserPayload,
  UpdateUserPayload,
  HttpError,
} from "@/services/user";
import "./admin-users.css";

export default function AdminUsersPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [nameLanguage, setNameLanguage] = useState<"thai" | "english">("thai");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

  const [formData, setFormData] = useState({
    first_name_th: "",
    last_name_th: "",
    first_name_en: "",
    last_name_en: "",
    email: "",
    password: "",
    id_number: "",
    phone: "",
    birthday: "",
    pdpa_consent: true,
    type_id: 1,
    id_type: 1,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.type_id !== 3) {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push("/");
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadUsers();
  }, [isAuthorized]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.first_name_th?.toLowerCase().includes(query) ||
        user.last_name_th?.toLowerCase().includes(query) ||
        user.first_name_en?.toLowerCase().includes(query) ||
        user.last_name_en?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        localStorage.clear();
        router.push("/login");
        return;
      }
      const message = err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const normalizedEmail = formData.email.trim().toLowerCase();
    const currentUserId = selectedUser?.id || selectedUser?.ID;

    // ต้องกรอกเฉพาะภาษาที่เลือก
    if (nameLanguage === "thai") {
      if (!formData.first_name_th.trim()) errors.first_name_th = "กรุณากรอกชื่อ (ไทย)";
      if (!formData.last_name_th.trim()) errors.last_name_th = "กรุณากรอกนามสกุล (ไทย)";
    } else {
      if (!formData.first_name_en.trim()) errors.first_name_en = "กรุณากรอกชื่อ (อังกฤษ)";
      if (!formData.last_name_en.trim()) errors.last_name_en = "กรุณากรอกนามสกุล (อังกฤษ)";
    }

    if (!formData.email.trim()) {
      errors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    } else {
      const emailDup = users.some((u) => {
        const uid = u.id || u.ID;
        return u.email?.toLowerCase() === normalizedEmail && uid !== currentUserId;
      });
      if (emailDup) errors.email = "อีเมลนี้ถูกใช้แล้ว";
    }

    if (modalMode === "create" && !formData.password) {
      errors.password = "กรุณากรอกรหัสผ่าน";
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    }

    if (!formData.id_number.trim()) errors.id_number = "กรุณากรอกเลขที่เอกสาร";
    else {
      const idNum = formData.id_number.trim();
      if (formData.id_type === 1 && !/^\d{13}$/.test(idNum)) {
        errors.id_number = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
      }
      if (formData.id_type === 2 && !/^[Gg]\d{7}$/.test(idNum)) {
        errors.id_number = "G-Code ต้องขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก";
      }
      if (formData.id_type === 3 && !/^[A-Za-z0-9]{6,15}$/.test(idNum)) {
        errors.id_number = "เลขพาสปอร์ตต้องเป็นตัวอักษร/ตัวเลข 6-15 ตัว";
      }

      const idDup = users.some((u) => {
        const uid = u.id || u.ID;
        return (
          u.id_number?.trim() === idNum &&
          u.id_type === formData.id_type &&
          uid !== currentUserId
        );
      });
      if (idDup) {
        const idTypeMsg =
          formData.id_type === 1
            ? "หมายเลขบัตรประชาชนนี้ถูกลงทะเบียนแล้ว"
            : formData.id_type === 2
            ? "หมายเลข G-Code นี้ถูกลงทะเบียนแล้ว"
            : "หมายเลขหนังสือเดินทางนี้ถูกลงทะเบียนแล้ว";
        errors.id_number = idTypeMsg;
      }
    }
    if (!formData.phone.trim()) {
      errors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
    }
    if (!formData.birthday) errors.birthday = "กรุณาเลือกวันเกิด";

    // ตรวจสอบ type_id และ id_type
    if (!formData.type_id) errors.type_id = "กรุณาเลือกประเภทผู้ใช้";
    if (!formData.id_type) errors.id_type = "กรุณาเลือกประเภทเอกสาร";

    console.log("Validation errors:", errors);
    console.log("Current formData:", formData);

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = (mode: "create" | "edit" | "view", user?: UserDTO) => {
    setModalMode(mode);
    setSelectedUser(user || null);
    setFormErrors({});
    setNameLanguage("thai");

    if (mode === "create") {
      setFormData({
        first_name_th: "",
        last_name_th: "",
        first_name_en: "",
        last_name_en: "",
        email: "",
        password: "",
        id_number: "",
        phone: "",
        birthday: "",
        pdpa_consent: true,
        type_id: 1,
        id_type: 1,
      });
    } else if (mode === "edit" && user) {
      const formatDateForInput = (dateString: string): string => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        } catch {
          return "";
        }
      };

      setFormData({
        first_name_th: user.first_name_th || "",
        last_name_th: user.last_name_th || "",
        first_name_en: user.first_name_en || "",
        last_name_en: user.last_name_en || "",
        email: user.email || "",
        password: "",
        id_number: user.id_number || "",
        phone: user.phone || "",
        birthday: formatDateForInput(user.birthday),
        pdpa_consent: user.pdpa_consent ?? true,
        type_id: user.type_id || 1,
        id_type: user.id_type || 1,
      });
      const hasThaiName = !!(user.first_name_th || user.last_name_th);
      setNameLanguage(hasThaiName ? "thai" : "english");
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormErrors({});
    setNameLanguage("thai");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== FORM SUBMIT DEBUG ===");
    console.log("Current formData:", formData);
    console.log("type_id:", formData.type_id, "type:", typeof formData.type_id);
    console.log("id_type:", formData.id_type, "type:", typeof formData.id_type);
    
    if (!validateForm()) {
      console.log("Validation failed!");
      return;
    }

    setSubmitLoading(true);
    try {
      if (modalMode === "create") {
        // สร้าง payload และตรวจสอบให้แน่ใจว่ามีค่าครบ
        const payload = {
          ...formData,
          type_id: Number(formData.type_id), // แปลงเป็น number
          id_type: Number(formData.id_type),  // แปลงเป็น number
        };
        
        console.log("Creating user with payload:", payload);
        console.log("Payload JSON:", JSON.stringify(payload, null, 2));
        
        await createUser(payload as CreateUserPayload);
        toast.success("เพิ่มผู้ใช้สำเร็จ");
      } else if (modalMode === "edit" && selectedUser) {
        const userId = selectedUser.id || selectedUser.ID;
        if (!userId) throw new Error("ไม่พบ ID ของผู้ใช้");
        
        const updatePayload: UpdateUserPayload = { 
          ...formData,
          type_id: Number(formData.type_id),
          id_type: Number(formData.id_type),
        };
        
        if (!formData.password) {
          delete updatePayload.password;
        }
        
        console.log("Updating user with payload:", updatePayload);
        
        await updateUser(userId, updatePayload);
        toast.success("บันทึกการแก้ไขสำเร็จ");
      }
      closeModal();
      loadUsers();
    } catch (err) {
      console.error("=== SUBMIT ERROR ===");
      console.error("Error:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
      }
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = (user: UserDTO) => {
    setDeleteTarget(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const userId = deleteTarget.id || deleteTarget.ID;
    if (!userId) {
      toast.error("ไม่พบ ID ของผู้ใช้");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      await deleteUser(userId);
      toast.success("ลบผู้ใช้สำเร็จ");
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถลบผู้ใช้ได้");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  if (!isAuthorized) return null;

  return (
    <div className="admin-users-container">
      <h1 className="admin-users-title">จัดการผู้ใช้</h1>
      <p className="admin-users-subtitle">จัดการข้อมูลผู้ใช้ทั้งหมดในระบบ</p>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          aria-label="ค้นหาผู้ใช้"
        />
        <button onClick={() => openModal("create")} className="btn-add-user">
          + เพิ่มผู้ใช้
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-text">กำลังโหลดข้อมูล...</div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ชื่อ-นามสกุล</th>
                  <th>อีเมล</th>
                  <th>เบอร์โทร</th>
                  <th>ประเภท</th>
                  <th>สร้างเมื่อ</th>
                  <th className="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-message">
                      {searchQuery ? "ไม่พบผู้ใช้ที่ตรงกับการค้นหา" : "ยังไม่มีผู้ใช้ในระบบ"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const userId = user.id || user.ID;
                    const badgeClass = 
                      user.type_id === 3 ? "user-type-admin" :
                      user.type_id === 2 ? "user-type-teacher" : "user-type-student";

                    return (
                      <tr key={userId}>
                        <td>
                          <div className="user-name-primary">
                            {user.first_name_th} {user.last_name_th}
                          </div>
                          <div className="user-name-secondary">
                            {user.first_name_en} {user.last_name_en}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>
                          <span className={`user-type-badge ${badgeClass}`}>
                            {getUserTypeName(user.type_id)}
                          </span>
                        </td>
                        <td>{user.CreatedAt ? formatDate(user.CreatedAt) : "-"}</td>
                        <td className="action-buttons">
                          <button
                            onClick={() => openModal("view", user)}
                            className="btn-view"
                            title="ดูรายละเอียด"
                          >
                            ดู
                          </button>
                          <button
                            onClick={() => openModal("edit", user)}
                            className="btn-edit"
                            title="แก้ไข"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="btn-delete"
                            title="ลบ"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="result-count">
            แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === "create" && "เพิ่มผู้ใช้ใหม่"}
                {modalMode === "edit" && "แก้ไขข้อมูลผู้ใช้"}
                {modalMode === "view" && "รายละเอียดผู้ใช้"}
              </h2>
              <button onClick={closeModal} className="btn-close-modal" title="ปิด">
                ×
              </button>
            </div>

            <div className="modal-body">
              {modalMode === "view" && selectedUser ? (
                <div className="view-grid">
                  <div>
                    <div className="view-field-label">ชื่อ (ไทย)</div>
                    <div className="view-field-value">{selectedUser.first_name_th}</div>
                  </div>
                  <div>
                    <div className="view-field-label">นามสกุล (ไทย)</div>
                    <div className="view-field-value">{selectedUser.last_name_th}</div>
                  </div>
                  <div>
                    <div className="view-field-label">ชื่อ (อังกฤษ)</div>
                    <div className="view-field-value">{selectedUser.first_name_en}</div>
                  </div>
                  <div>
                    <div className="view-field-label">นามสกุล (อังกฤษ)</div>
                    <div className="view-field-value">{selectedUser.last_name_en}</div>
                  </div>
                  <div>
                    <div className="view-field-label">อีเมล</div>
                    <div className="view-field-value">{selectedUser.email}</div>
                  </div>
                  <div>
                    <div className="view-field-label">เบอร์โทรศัพท์</div>
                    <div className="view-field-value">{selectedUser.phone}</div>
                  </div>
                  <div>
                    <div className="view-field-label">เลขที่เอกสาร</div>
                    <div className="view-field-value">{selectedUser.id_number}</div>
                  </div>
                  <div>
                    <div className="view-field-label">ประเภทเอกสาร</div>
                    <div className="view-field-value">{getIDTypeName(selectedUser.id_type)}</div>
                  </div>
                  <div>
                    <div className="view-field-label">วันเกิด</div>
                    <div className="view-field-value">{formatDate(selectedUser.birthday)}</div>
                  </div>
                  <div>
                    <div className="view-field-label">ประเภทผู้ใช้</div>
                    <div className="view-field-value">{getUserTypeName(selectedUser.type_id)}</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">เลือกภาษาในการกรอกชื่อ *</label>
                    <div className="language-selector">
                      <button
                        type="button"
                        className={`btn-language ${nameLanguage === "thai" ? "active" : ""}`}
                        onClick={() => {
                          setNameLanguage("thai");
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.first_name_en;
                            delete next.last_name_en;
                            return next;
                          });
                          setFormData((prev) => ({
                            ...prev,
                            first_name_en: "",
                            last_name_en: "",
                          }));
                        }}
                      >
                        ภาษาไทย
                      </button>
                      <button
                        type="button"
                        className={`btn-language ${nameLanguage === "english" ? "active" : ""}`}
                        onClick={() => {
                          setNameLanguage("english");
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.first_name_th;
                            delete next.last_name_th;
                            return next;
                          });
                          setFormData((prev) => ({
                            ...prev,
                            first_name_th: "",
                            last_name_th: "",
                          }));
                        }}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {nameLanguage === "thai" ? (
                    <div className="form-group">
                      <label className="form-label">ชื่อ-นามสกุล (ไทย) *</label>
                      <div className="form-grid-2">
                        <div>
                          <input
                            id="first_name_th"
                            type="text"
                            placeholder="ชื่อ"
                            value={formData.first_name_th}
                            onChange={(e) => setFormData({ ...formData, first_name_th: e.target.value })}
                            className={`form-input ${formErrors.first_name_th ? "error" : ""}`}
                          />
                          {formErrors.first_name_th && (
                            <div className="error-text">{formErrors.first_name_th}</div>
                          )}
                        </div>
                        <div>
                          <input
                            id="last_name_th"
                            type="text"
                            placeholder="นามสกุล"
                            value={formData.last_name_th}
                            onChange={(e) => setFormData({ ...formData, last_name_th: e.target.value })}
                            className={`form-input ${formErrors.last_name_th ? "error" : ""}`}
                          />
                          {formErrors.last_name_th && (
                            <div className="error-text">{formErrors.last_name_th}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">ชื่อ-นามสกุล (อังกฤษ) *</label>
                      <div className="form-grid-2">
                        <div>
                          <input
                            id="first_name_en"
                            type="text"
                            placeholder="First Name"
                            value={formData.first_name_en}
                            onChange={(e) => setFormData({ ...formData, first_name_en: e.target.value })}
                            className={`form-input ${formErrors.first_name_en ? "error" : ""}`}
                          />
                          {formErrors.first_name_en && (
                            <div className="error-text">{formErrors.first_name_en}</div>
                          )}
                        </div>
                        <div>
                          <input
                            id="last_name_en"
                            type="text"
                            placeholder="Last Name"
                            value={formData.last_name_en}
                            onChange={(e) => setFormData({ ...formData, last_name_en: e.target.value })}
                            className={`form-input ${formErrors.last_name_en ? "error" : ""}`}
                          />
                          {formErrors.last_name_en && (
                            <div className="error-text">{formErrors.last_name_en}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* อีเมล */}
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">อีเมล *</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`form-input ${formErrors.email ? "error" : ""}`}
                    />
                    {formErrors.email && <div className="error-text">{formErrors.email}</div>}
                  </div>

                  {/* รหัสผ่าน */}
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      รหัสผ่าน {modalMode === "create" && "*"}
                      {modalMode === "edit" && (
                        <span className="form-label-secondary"> (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>
                      )}
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="ระบุรหัสผ่าน"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`form-input ${formErrors.password ? "error" : ""}`}
                    />
                    {formErrors.password && <div className="error-text">{formErrors.password}</div>}
                  </div>

                  {/* เบอร์โทรศัพท์ */}
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">เบอร์โทรศัพท์ *</label>
                    <input
                      id="phone"
                      type="text"
                      placeholder="0812345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      maxLength={10}
                      className={`form-input ${formErrors.phone ? "error" : ""}`}
                    />
                    {formErrors.phone && <div className="error-text">{formErrors.phone}</div>}
                  </div>

                  {/* วันเกิด */}
                  <div className="form-group">
                    <label htmlFor="birthday" className="form-label">วันเกิด *</label>
                    <input
                      id="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      className={`form-input ${formErrors.birthday ? "error" : ""}`}
                    />
                    {formErrors.birthday && <div className="error-text">{formErrors.birthday}</div>}
                  </div>

                  {/* ประเภทเอกสารยืนยันตัวตน */}
                  <div className="form-group">
                    <label className="form-label">ประเภทเอกสารยืนยันตัวตน *</label>
                    <div className="form-grid-2">
                      <div>
                        <label htmlFor="id_type" className="form-label">ประเภทเอกสาร</label>
                        <select
                          id="id_type"
                          value={formData.id_type}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            console.log("id_type changed to:", value);
                            setFormData({ ...formData, id_type: value });
                          }}
                          className={`form-select ${formErrors.id_type ? "error" : ""}`}
                          aria-label="เลือกประเภทเอกสารยืนยันตัวตน"
                        >
                          <option value={1}>บัตรประชาชน</option>
                          <option value={2}>G-Code</option>
                          <option value={3}>Passport</option>
                        </select>
                        {formErrors.id_type && <div className="error-text">{formErrors.id_type}</div>}
                      </div>
                      <div>
                        <label htmlFor="id_number" className="form-label">เลขเอกสาร</label>
                        <input
                          id="id_number"
                          type="text"
                          placeholder={
                            formData.id_type === 1
                              ? "เลขบัตรประชาชน 13 หลัก"
                              : formData.id_type === 2
                              ? "G-Code"
                              : "Passport Number"
                          }
                          value={formData.id_number}
                          onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                          className={`form-input ${formErrors.id_number ? "error" : ""}`}
                        />
                        {formErrors.id_number && <div className="error-text">{formErrors.id_number}</div>}
                      </div>
                    </div>
                  </div>

                  {/* ประเภทผู้ใช้ */}
                  <div className="form-group">
                    <label htmlFor="type_id" className="form-label">ประเภทผู้ใช้ *</label>
                    <select
                      id="type_id"
                      value={formData.type_id}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        console.log("type_id changed to:", value);
                        setFormData({ ...formData, type_id: value });
                      }}
                      className={`form-select ${formErrors.type_id ? "error" : ""}`}
                      aria-label="เลือกประเภทผู้ใช้"
                    >
                      <option value={1}>นักเรียน</option>
                      <option value={2}>ครู</option>
                      <option value={3}>แอดมิน</option>
                    </select>
                    {formErrors.type_id && <div className="error-text">{formErrors.type_id}</div>}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={submitLoading}
                      className="btn-cancel"
                    >
                      ยกเลิก
                    </button>
                    <button type="submit" disabled={submitLoading} className="btn-submit">
                      {submitLoading
                        ? "กำลังบันทึก..."
                        : modalMode === "create"
                        ? "เพิ่มผู้ใช้"
                        : "บันทึกการเปลี่ยนแปลง"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && deleteTarget && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">ยืนยันการลบผู้ใช้</h2>
              <button onClick={cancelDelete} className="btn-close-modal" title="ปิด">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-text">
                ต้องการลบผู้ใช้ "{deleteTarget.first_name_th} {deleteTarget.last_name_th}" จริงหรือไม่?
              </p>
              <div className="form-actions">
                <button type="button" onClick={cancelDelete} className="btn-cancel">
                  ยกเลิก
                </button>
                <button type="button" onClick={confirmDelete} className="btn-delete-confirm">
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
