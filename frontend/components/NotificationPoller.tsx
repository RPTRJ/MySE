"use client";

import { useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import { markNotificationReadAPI } from "@/services/curriculum";

export default function NotificationSocket() {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // ใช้ Timeout เพื่อรอให้ React Mount เสร็จชัวร์ๆ ก่อนค่อยต่อ (แก้ปัญหา Strict Mode)
    const timeoutId = setTimeout(() => {
        const connect = () => {
          const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
          console.log("Connecting to WebSocket:", wsUrl);
          
          const socket = new WebSocket(wsUrl);
          socketRef.current = socket;

          socket.onopen = () => {
            console.log("✅ WebSocket Connected");
          };

          socket.onmessage = (event) => {
            // ... (โค้ดเดิมส่วนจัดการข้อความ) ...
             try {
                const data = JSON.parse(event.data);
                const message = data.notification_message || data.message || data.Notification_Message || event.data;
                const title = data.notification_title || data.title || data.Notification_Title || "แจ้งเตือนใหม่";
                const id = data.ID || data.id;

                toast((t) => (
                    <div className="flex flex-col relative pr-4 min-w-[250px]">
                      <button 
                         onClick={() => toast.dismiss(t.id)}
                         className="absolute -top-1 -right-2 text-gray-400 hover:text-red-500 font-bold p-1 rounded-full"
                      >✕</button>
                      <span className="font-bold text-sm text-gray-800 mb-1">{title}</span>
                      <span className="text-sm text-gray-600 leading-snug">{message}</span>
                    </div>
                  ), {
                    id: `noti-${id || Date.now()}`,
                    duration: 5000, 
                    position: 'top-right',
                    style: { borderLeft: '4px solid #FFA500', background: '#fff', color: '#333', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '12px 16px' },
                });
                window.dispatchEvent(new Event("refresh_data"));
                if (id) markNotificationReadAPI(id); 
            } catch (e) {
                toast(event.data, { icon: '🔔' });
            }
          };

          socket.onclose = () => {
            console.log("❌ WebSocket Disconnected. Retrying in 3s...");
            // เช็คก่อนว่า Component ยังอยู่ไหมค่อย reconnect
            if (socketRef.current) {
                setTimeout(() => connect(), 3000);
            }
          };

          socket.onerror = (err) => {
            // console.error("WebSocket Error:", err); // คอมเมนต์ออกได้ถ้าไม่อยากเห็น error แดง
            socket.close();
          };
        };
        
        connect();
    }, 100); // รอ 100ms

    // Cleanup
    return () => {
      clearTimeout(timeoutId); // ยกเลิกการเชื่อมต่อถ้ารีบปิดหน้าเว็บ
      if (socketRef.current) {
        // เซ็ตเป็น null เพื่อบอก onclose ว่าไม่ต้อง auto reconnect แล้วนะ เราตั้งใจปิดเอง
        const socket = socketRef.current;
        socketRef.current = null; 
        socket.close();
      }
    };
  }, []);

  return null;
}