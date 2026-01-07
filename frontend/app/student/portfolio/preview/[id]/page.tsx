"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { fetchMyPortfolios, 
         fetchActivities, 
         fetchWorkings,
} from "@/services/portfolio";
import { fetchUserProfile } from "@/services/user";

// --- Helper Functions ---
function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100)));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * (percent / 100)));
    const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * (percent / 100)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function parseBlockContent(content: any): any {
    if (!content) return null;
    if (typeof content === 'string') {
        try {
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }
    return content;
}

function getImageUrl(image: any): string {
    return image?.file_path || image?.FilePath || image?.image_url || image?.ImageUrl || image?.working_image_url || '/placeholder.jpg';
}

function extractImages(data: any, type: 'activity' | 'working'): any[] {
    if (!data) return [];
    let images = [];
    if (type === 'activity') {
        images = data.ActivityDetail?.Images || data.activity_detail?.images || [];
    } else {
        images = data.WorkingDetail?.Images || data.working_detail?.images || [];
    }
    return Array.isArray(images) ? images : [];
}

export default function PortfolioPreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    
    const [portfolio, setPortfolio] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]); 
    const [workings, setWorkings] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // State ใหม่: เก็บ index ของรูปภาพแต่ละ Block (Key คือ ID ของ Block, Value คือ index รูปปัจจุบัน)
    const [imageIndices, setImageIndices] = useState<{[key: string]: number}>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [portfoliosRes, activitiesRes, workingsRes, userRes] = await Promise.all([
                    fetchMyPortfolios(),
                    fetchActivities(),
                    fetchWorkings(),
                    fetchUserProfile()
                ]);

                const found = portfoliosRes.data?.find((p: any) => p.ID.toString() === id);
                
                if (found) {
                    if (found.portfolio_sections) {
                        found.portfolio_sections.sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0));
                    }
                    setPortfolio(found);
                } else {
                    alert("ไม่พบแฟ้มสะสมผลงาน");
                    router.push('/student/portfolio');
                    return;
                }
                
                setActivities(activitiesRes.data || []);
                setWorkings(workingsRes.data || []);
                
                const userData = (userRes as any).data || userRes;
                setCurrentUser({
                    firstname: userData.first_name_en || userData.first_name_th || "-",
                    lastname: userData.last_name_en || userData.last_name_th || "-",
                    major: userData.major || "Software Engineering", // ถ้า API ไม่มี field นี้อาจต้อง hardcode หรือแก้ backend
                    gpa: userData.gpa || "4.00", 
                    school: userData.school || "Suranaree University of Technology",
                    profile_image: userData.profile_image_url || "" 
                });

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (id) loadData();
    }, [id, router]);

    // ฟังก์ชันเลื่อนรูปภาพ (ถัดไป)
    const handleNextImage = (blockId: string, totalImages: number, e: React.MouseEvent) => {
        e.stopPropagation(); // ป้องกันไม่ให้กดแล้วไป trigger event อื่น
        setImageIndices(prev => ({
            ...prev,
            [blockId]: ((prev[blockId] || 0) + 1) % totalImages
        }));
    };

    // ฟังก์ชันเลื่อนรูปภาพ (ก่อนหน้า)
    const handlePrevImage = (blockId: string, totalImages: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setImageIndices(prev => ({
            ...prev,
            [blockId]: ((prev[blockId] || 0) - 1 + totalImages) % totalImages
        }));
    };

    // --- Render Function ---
    const renderSectionContent = (section: any) => {
        const blocks = section.portfolio_blocks || [];
        
        const isProfileLayout = section.section_title?.toLowerCase().includes('profile') || 
                                (section as any).layout_type === 'profile_header_left';

        // 1. ส่วน Profile
        if (isProfileLayout) {
            const isRight = section.section_title?.toLowerCase().includes('right') || 
                             (section as any).layout_type === 'profile_header_right';

             const user = currentUser || { 
                 firstname: "Loading...", lastname: "", 
                 major: "-", gpa: "-", bio: "...", profile_image: null 
             };

             return (
                 // เพิ่ม Logic: ถ้า isRight เป็น true ให้ใช้ flex-row-reverse (สลับด้าน)
                 <div className={`flex flex-col items-center gap-6 p-6 bg-white border border-gray-100 rounded-xl shadow-sm h-full w-full 
                                 ${isRight ? 'md:flex-row-reverse text-right' : 'md:flex-row text-left'}`}>
                     
                     {/* รูปโปรไฟล์ */}
                     <div className="w-32 h-32 flex-shrink-0 rounded-full overflow-hidden border-4 border-blue-100 shadow-md">
                         <img 
                            src={user.profile_image || "/placeholder.jpg"} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                            onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150'}
                          />
                     </div>

                     {/* ข้อมูล Text */}
                     <div className={`flex-1 w-full space-y-3 ${isRight ? 'md:items-end' : 'md:items-start'}`}>
                         <div className={`border-b pb-2 border-gray-100 ${isRight ? 'flex flex-col items-end' : ''}`}>
                             <h3 className="text-2xl font-bold text-gray-800">
                                 {user.firstname} {user.lastname}
                             </h3>
                             <p className="text-blue-500 font-medium">
                                 {user.school || "Suranaree University of Technology"}
                             </p>
                         </div>
                         <div className={`space-y-1 text-sm text-gray-600 ${isRight ? 'flex flex-col items-end' : ''}`}>
                             <p><span className="font-bold text-gray-800">Major:</span> {user.major}</p>
                             <p><span className="font-bold text-gray-800">GPAX:</span> <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">{user.gpa}</span></p>
                         </div>
                     </div>
                 </div>
             );
        }

        // 2. ส่วน Content Grid
        if (blocks.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-2xl mb-2">📭</div>
                    <div className="text-sm">ยังไม่มีเนื้อหาในส่วนนี้</div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blocks.map((block: any, idx: number) => {
                    const c = parseBlockContent(block.content);
                    if(c?.type === 'profile') return null;

                    let itemData = null;
                    if(c?.type === 'activity') itemData = activities.find((a: any) => a.ID == c.data_id);
                    else if(c?.type === 'working') itemData = workings.find((w: any) => w.ID == c.data_id);
                    
                    const finalData = itemData || c?.data;
                    
                    if(!finalData) return null;

                    const images = extractImages(finalData, c.type);
                    
                    // Slider Logic: หา index ปัจจุบัน ถ้าไม่มีให้เริ่มที่ 0
                    // ใช้ block.ID เป็น Key ถ้าไม่มีใช้ idx คู่กับ section.ID เพื่อความ Unique
                    const uniqueKey = block.ID ? block.ID.toString() : `${section.ID}-${idx}`;
                    const currentIndex = imageIndices[uniqueKey] || 0;
                    const currentImageSrc = images.length > 0 ? getImageUrl(images[currentIndex]) : "https://via.placeholder.com/300?text=No+Image";

                    return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group relative">
                            {/* Image Container */}
                            <div className="h-48 w-full bg-gray-100 relative overflow-hidden group">
                                <img 
                                    src={currentImageSrc} 
                                    className="w-full h-full object-cover transition-all duration-500" 
                                />
                                
                                {/* Badge Type */}
                                <span className={`absolute top-2 right-2 text-[10px] text-white px-2 py-1 rounded font-bold uppercase z-10 ${c.type === 'activity' ? 'bg-orange-400' : 'bg-blue-400'}`}>
                                    {c.type}
                                </span>

                                {/* ปุ่มเลื่อนรูป (แสดงเฉพาะเมื่อมีมากกว่า 1 รูป) */}
                                {images.length > 1 && (
                                    <>
                                        {/* ปุ่มซ้าย */}
                                        <button 
                                            onClick={(e) => handlePrevImage(uniqueKey, images.length, e)}
                                            className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 z-20"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                            </svg>
                                        </button>

                                        {/* ปุ่มขวา */}
                                        <button 
                                            onClick={(e) => handleNextImage(uniqueKey, images.length, e)}
                                            className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 z-20"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </button>

                                        {/* จุดบอกตำแหน่ง (Dots Indicator) */}
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                            {images.map((_: any, i: number) => (
                                                <div 
                                                    key={i}
                                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-4">
                                <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                                    {c.type === 'activity' ? finalData.activity_name : finalData.working_name}
                                </h4>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {c.type === 'activity' ? finalData.activity_detail?.description : finalData.working_detail?.description || "-"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center">กำลังโหลด...</div>;
    if (!portfolio) return null;

    const primaryColor = portfolio.colors?.primary_color || '#FF6B35';

    return (
        <div className="min-h-screen bg-white p-6 pb-20">
            <div className="mx-auto" style={{ maxWidth: 1500 }}>
                <button 
                    onClick={() => router.back()} 
                    className="mb-6 px-4 py-2 bg-white rounded-lg shadow-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 hover:bg-gray-50 transition"
                >
                    ← ย้อนกลับ
                </button>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-l-4" style={{ borderLeftColor: primaryColor }}>
                    <h1 className="text-3xl font-bold text-gray-900">{portfolio.portfolio_name}</h1>
                    <p className="text-gray-500">{portfolio.description}</p>
                </div>

                <div className="space-y-6">
                    {portfolio.portfolio_sections?.filter((s:any) => s.is_enabled !== false).map((section: any, idx: number) => (
                        <div key={section.ID} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm shadow-sm"
                                      style={{ backgroundColor: primaryColor }}>
                                    {idx + 1}
                                </span>
                                <h3 className="font-bold text-gray-800 text-lg">
                                    {section.section_title}
                                </h3>
                            </div>

                            <div className="p-6">
                                {renderSectionContent(section)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}