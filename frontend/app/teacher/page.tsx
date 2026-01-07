'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubmissionService, { PortfolioSubmission } from '@/services/submission';
import style from './page.module.css';


export default function TeacherPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [submissions, setSubmissions] = useState<PortfolioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  
  

  // Fetch submissions from backend
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await SubmissionService.fetchAllSubmissions();
      setSubmissions(data);
      setError('');
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลได้');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch by status
  const fetchByStatus = async (status: string) => {
    if (status === 'all') {
      fetchSubmissions();
      return;
    }

    try {
      setLoading(true);
      const data = await SubmissionService.fetchSubmissionsByStatus(status);
      setSubmissions(data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    awaiting: submissions.filter(s => s.status === 'awaiting').length,
    revisions: submissions.filter(s => s.status === 'revision').length,
    graded: submissions.filter(s => s.status === 'graded').length
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'awaiting': return 'รอการตรวจทาน';
      case 'revision': return 'ต้องแก้ไข';
      case 'graded': return 'ตรวจเสร็จแล้ว';
      default: return status;
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesDate = !filterDate ||
      new Date(sub.submission_at).toDateString() === new Date(filterDate).toDateString();
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesDate && matchesStatus;
  }).sort((a, b) => {
    return new Date(b.submission_at).getTime() - new Date(a.submission_at).getTime();
  });
  
  
  const handleStartReview = (id: number): void => {
    router.push(`/teacher/scorecard/${id}`);
  };

  const handleViewSubmission = (id: number): void => {
    router.push(`/teacher/submission/${id}`);
  };

  const handleMarkAsReviewed = async (id: number): Promise<void> => {
    try {
      await SubmissionService.markAsReviewed(id);
      alert('บันทึกการตรวจทานเรียบร้อย');
      fetchSubmissions();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
      console.error('Error:', err);
    }
  };

  const handleMarkAsApproved = async (id: number): Promise<void> => {
    try {
      await SubmissionService.markAsApproved(id);
      alert('อนุมัติเรียบร้อย');
      fetchSubmissions();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอนุมัติ');
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token:", token);

    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);

      if (user.type_id !== 2) {
        alert("No permission");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      setUserName(
        user.first_name_th && user.last_name_th
          ? `${user.first_name_th} ${user.last_name_th}`
          : `${user.first_name_en} ${user.last_name_en}`
      );

      setIsAuthorized(true);
      fetchSubmissions();
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  // Handle status filter change
  useEffect(() => {
    if (isAuthorized) {
      fetchByStatus(filterStatus);
    }
  }, [filterStatus]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div >
      <div className={style.dashboard_container}>
        {/* Main Content */}
          <div className={style.content_wrapper}>
            {/* Header */}
            <div className={style.page_header}>
              <div>
                <h1 className={style.header_title}>ยินดีต้อนรับ อาจารย์ {userName}</h1>
              </div>
            </div>

            {/* Stats Cards */}
            <div className={style.stats_grid}>
              <div className={style.stat_card}>
                <div className={style.stat_label}>จำนวนรอการตรวจทาน</div>
                <div className={style.stat_value}>{stats.awaiting}</div>
              </div>
              <div className={style.stat_card}>
                <div className={style.stat_label}>ตรวจทานแล้วแต่ต้องมีการแก้ไข</div>
                <div className={style.stat_value}>{stats.revisions}</div>
              </div>
              <div className={style.stat_card}>
                <div className={style.stat_label}>ตรวจทานและสมบูรณ์แล้ว</div>
                <div className={style.stat_value}>{stats.graded}</div>
              </div>
            </div>

            {/* Queue Section */}
            <div className={style.queue_section}>
              <div className={style.queue_header}>
                <h2 className={style.queue_title}>สถานะการตรวจสอบ</h2>
                
                {/* Search and Filters */}
                <div className={style.filters_container}>
                  <div className={style.filter_buttons}>
                    <label htmlFor="filter-date" className={style.visually_hidden}>
                      กรองตามวันที่
                    </label>
                    <input
                      id="filter-date"
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className={style.custom_date_input}
                      aria-label="กรองตามวันที่ส่ง"
                      title="เลือกวันที่เพื่อกรองข้อมูล"
                    />

                    <label htmlFor="filter-status" className={style.visually_hidden}>
                      กรองตามสถานะ
                    </label>
                    <select
                      id="filter-status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className={style.filter_select}
                      aria-label="กรองตามสถานะการตรวจ"
                      title="เลือกสถานะเพื่อกรองข้อมูล"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="awaiting">รอตรวจทาน</option>
                      <option value="revision">ต้องมีการแก้ไข</option>
                      <option value="graded">ตรวจทานแล้ว</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className={style.table_container}>
                {loading ? (
                  <div className={style.loading_state}>กำลังโหลด...</div>
                ) : error ? (
                  <div className={style.error_state}>{error}</div>
                ) : (
                  <table className={style.submissions_table}>
                    <thead className={style.table_header}>
                      <tr>
                        <th>Student Name</th>
                        <th>Portfolio Title</th>
                        <th>Submission Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={style.table_body}>
                      {filteredSubmissions.map((submission) => (
                        <tr key={submission.ID} className={style.table_row}>
                          <td className={`${style.table_cell} ${style.no_wrap}`}>
                            <div className={style.student_info}>
                              <div className={style.student_avatar}>
                                {submission.user?.first_name_th?.charAt(0) ?? ""}
                                {submission.user?.last_name_th?.charAt(0) ?? ""}
                              </div>
                              <span className={style.student_name}>
                                {submission.user?.first_name_th} {submission.user?.last_name_th}
                              </span>
                            </div>
                          </td>
                          <td className={style.table_cell}>
                            <div className={style.portfolio_title}>{submission.portfolio?.portfolio_name}</div>
                          </td>
                          <td className={`${style.table_cell} ${style.no_wrap}`}>
                            <span className={style.submission_date}>
                              {new Date(submission.submission_at).toLocaleDateString('th-TH')}
                            </span>
                          </td>
                          <td className={`${style.table_cell} ${style.no_wrap}`}>
                            <span className={`${style.status_badge} ${submission.status}`}>
                              {getStatusText(submission.status)}
                            </span>
                          </td>
                          <td className={`${style.table_cell} ${style.no_wrap} ${style.align_right}`}>
                            {submission.status === 'awaiting' || submission.status === 'revision' ? (
                              <button
                                onClick={() => handleStartReview(submission.ID)}
                                className={style.action_button}
                              >
                                Start Review 
                                
                              </button>
                            ) : (
                              <button
                                onClick={() => handleViewSubmission(submission.ID)}
                                className={style.action_button}
                              >
                                View Submission
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}