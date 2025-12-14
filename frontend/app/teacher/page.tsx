"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Settings } from 'lucide-react';
import style from './page.module.css';

interface Submission {
  id: number;
  version: number;
  status: 'awaiting' | 'revision' | 'graded' ;
  submission_at: string;
  reviewed_at?: string;
  approved_at?: string;
  is_current_version: boolean;
  portfolioTitle: string;
  studentName: string;
  avatar: string;
}


export default function TeacherPage() {

  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const [submissions, setSubmissions] = useState<Submission[]>([
    //-- Sample Data --
  ]);

  const stats = {
    awaiting: submissions.filter(s => s.status === 'awaiting').length,
    revisions: submissions.filter(s => s.status === 'revision').length,
    graded: submissions.filter(s => s.status === 'graded').length
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'awaiting': return 'Awaiting Review';
      case 'revision': return 'Revision';
      case 'graded': return 'Graded';
      default: return status;
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesDate = !filterDate ||
      new Date(sub.submission_at).toDateString() === new Date(filterDate).toDateString();
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesDate && matchesStatus;
  }).sort((a, b) => {
    if (sortOrder === 'date') {
      return new Date(b.submission_at).getTime() - new Date(a.submission_at).getTime();
    }
    if (sortOrder === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const handleStartReview = (id: number): void => {
    alert(`Starting review for submission ID: ${id}`);
  };

  const handleViewSubmission = (id: number): void => {
    alert(`Viewing submission ID: ${id}`);
  };


  useEffect(() => {
    const token = localStorage.getItem("token");
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

      setIsAuthorized(true);
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  if (!isAuthorized) {
    return null;
  }



  return (
    //default home page for teacher
    <div style={{ padding: '50px' }}>
      <div className={style.dashboard_container}>
      {/* Sidebar */}
      

      {/* Main Content */}
      <div className={style.main_content }>
        <div className={style.content_wrapper}>
          {/* Header */}
          <div className={style.page_header}>
            <div>
              {/*<h1 className="header_title">Portfolio Review Queue</h1>*/}
              <h1 className={style.header_title}>ยินดีต้อนรับ อาจารย์,(user)!</h1>
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
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={style.custom_date_input}
                  />

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={style.filter_select}
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="completed">ตรวจทานแล้ว</option>
                    <option value="in-progress">ต้องมีการแก้ไข</option>
                    <option value="pending">รอตรวจทาน</option>
                  </select>

                  
                </div>
              </div>
            </div>

            {/* Table */}
            <div className={style.table_container}>
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
                    <tr key={submission.id} className={style.table_row}>
                      <td className={`${style.table_cell} ${style.no_wrap}`}>
                        <div className={style.student_info}>
                          <div className={style.student_avatar}>{submission.avatar}</div>
                          <span className={style.student_name}>{submission.studentName}</span>
                        </div>
                      </td>
                      <td className={style.table_cell}>
                        <div className={style.portfolio_title}>{submission.portfolioTitle}</div>
                      </td>
                      <td className={`${style.table_cell} ${style.no_wrap}`}>
                        <span className={style.submission_date}>{submission.submission_at}</span>
                      </td>
                      <td className={`${style.table_cell}  ${style.no_wrap}`}>
                        <span className={`${style.status_badge} ${submission.status}`}>
                          {getStatusText(submission.status)}
                        </span>
                      </td>
                      <td className={`${style.table_cell} ${style.no_wrap} ${style.align_right}`}>
                        {submission.status === 'awaiting' || submission.status === 'graded' ? (
                          <button
                            onClick={() => handleStartReview(submission.id)}
                            className={style.action_button}
                          >
                            Start Review
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewSubmission(submission.id)}
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
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
