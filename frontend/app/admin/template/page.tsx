"use client";
import Link from "next/link";

export default function TemplatePage() {
    return (
        <div style={{ padding: '50px' }}>
            <h1>ยินดีต้อนรับสู่แดชบอร์ด</h1>
            <p>นี่คือหน้าเทมเพลตของผู้ดูแลระบบ</p>
        </div>
    );
}

// "use client";

// import { useEffect, useState } from "react";

// export default function TemplatePage() {
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch("http://localhost:8080/template-blocks");
//         const text = await res.text();

//         console.log("RAW API:", text); // ดูว่ามีอะไรเกินมาหรือเปล่า

//         const json = JSON.parse(text); // parse ด้วยมือ ป้องกัน error
//         setData(json);
//       } catch (err) {
//         console.error("Error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   if (loading) return <div>กำลังโหลด...</div>;
//   if (!data || data.length === 0) return <div>ไม่มีข้อมูลจากหลังบ้าน</div>;

//   // API เป็น array → ใช้อันแรก
//   const block = data[1];

//   const style = {
//     blockID : block.ID,
//     width: block.default_style?.width,
//     border: block.default_style?.border,
//     height: block.default_style?.height,
//     padding: block.default_style?.padding,
//     boxShadow: block.default_style?.box_shadow,
//     borderRadius: block.default_style?.border_radius,
//     backgroundColor: block.default_style?.background_color,
//   };

//   return (
//     <div style={style} 
//          className="m-4 my-14" >
//       <h1>{block.block_name}</h1>
//       <p>Type: {block.block_type}</p>
//       <p>ID: {block.ID}</p>
//     </div>
//   );
// }
