"use client";

import { useEffect, useState, useRef } from "react";
// ✅ import markNotificationReadAPI เข้ามาด้วย
import { fetchNotificationsAPI, markNotificationReadAPI } from "@/services/curriculum";
import toast from 'react-hot-toast';

export default function NotificationPoller() {
  const [userId, setUserId] = useState<number>(0);
  const notifiedIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    // ... (โค้ดดึง User ID เหมือนเดิม)
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserId(u.ID || u.id || 0);
      } catch (e) { console.error(e); }
    }

    const interval = setInterval(async () => {
      if (!userId) return;

      try {
        const notis = await fetchNotificationsAPI(userId);
        
        if (notis && notis.length > 0) {
          notis.forEach((n: any) => {
             // เช็ค ID (ปรับให้รองรับทั้งตัวเล็กตัวใหญ่เผื่อ GORM ส่งมาต่างกัน)
             const currentId = n.ID || n.id;

             if (!notifiedIds.current.has(currentId)) {
                
                // 1. แสดง Toast
                toast((t) => (
                   <div className="flex flex-col relative pr-4 min-w-[250px]">
                     <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="absolute -top-1 -right-2 text-gray-400 hover:text-red-500 font-bold p-1 rounded-full"
                     >✕</button>
                     <span className="font-bold text-sm text-gray-800 mb-1">
                        {n.notification_title || n.Notification_Title || "แจ้งเตือน"}
                     </span>
                     <span className="text-sm text-gray-600 leading-snug">
                        {n.notification_message || n.Notification_Message}
                     </span>
                   </div>
                 ), {
                   id: `noti-${currentId}`,
                   duration: Infinity, // ค้างไว้จนกว่าจะกดปิด
                   position: 'top-right',
                   style: { 
                     borderLeft: '4px solid #FFA500',
                     background: '#fff',
                     color: '#333',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                     padding: '12px 16px',
                   },
                 });

                // ✅✅✅ 2. แจ้ง Backend ทันทีว่า "แสดงแล้วนะ" (Mark as Read)
                markNotificationReadAPI(currentId);

                // 3. จำไว้ใน Local State (กันเด้งซ้ำใน Loop เดิม)
                notifiedIds.current.add(currentId);
             }
          });
        }
      } catch (e) { console.error(e); }
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  return null;
}