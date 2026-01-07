"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProfileBlock,
         ShowcaseBlock
 } from "@/src/components/informationPortfolio";
import {API, 
        theme,
        fetchMyPortfolios,
        fetchActivities,
        fetchWorkings,
        createSection,
        updateSection,
        createBlock,
        updateBlock,
        deleteBlock,
        deleteSection, 
} from "@/services/sectionsPortfolio"
import { PortfolioSection } from "@/src/interfaces/section";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {CirclePlus} from "lucide-react";

// Utility Functions
function parseBlockContent(content: any): any {
    if (!content) return null;
    if (typeof content === 'string') {
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('Failed to renderSectionContentparse:', e);
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

function formatDateThai(dateString?: string) {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short", // ม.ค., ก.พ.
            year: "numeric", // 2569
        });
    }

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1 
        }
    }
};

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%", // เลื่อนมาจากขวา/ซ้ายสุด
        opacity: 1, // ✅ ต้องเป็น 1 เพื่อไม่ให้รูปหายวูบ
        zIndex: 1
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    // ...
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? "100%" : "-100%", // เลื่อนออกไปจนสุด
        opacity: 1 // ✅ ต้องเป็น 1
    })
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const PortfolioItemCard = ({ 
    block, 
    data, 
    contentType, 
    onEdit, 
    onDelete 
}: { 
    block: any, 
    data: any, 
    contentType: 'activity' | 'working', 
    onEdit: () => void, 
    onDelete: () => void 
}) => {
    // State สำหรับเก็บ index ของรูปภาพในการ์ดใบนี้โดยเฉพาะ
    const [[page, direction], setPage] = useState([0, 0]);
    const [isHovered, setIsHovered] = useState(false);

    const images = extractImages(data, contentType);
    const hasMultipleImages = images.length > 1;
    const imageIndex = ((page % images.length) + images.length) % images.length;
    
    // ตรวจสอบ index ให้ถูกต้องเสมอ (กัน Error กรณีข้อมูลเปลี่ยน)
    // const validIndex = (currentImgIdx >= 0 && currentImgIdx < images.length) ? currentImgIdx : 0;
    const coverImage = images.length > 0 ? getImageUrl(images[imageIndex]) : "";
    const title = contentType === 'activity' ? data.activity_name : data.working_name;

    // ดึงข้อมูลรายละเอียด
    let level, category, reward, date, location,description;
    if (contentType === 'activity') {
        level = data.activity_detail?.level_activity?.level_name;
        category = data.activity_detail?.type_activity?.type_name;
        reward = data.reward?.level_name;
        date = data.activity_detail?.activity_at;
        location = data.activity_detail?.institution;
        description = data.activity_detail?.description;
    } else {
        category = data.working_detail?.type_working?.type_name;
        date = data.working_detail?.working_at;
        description = data.working_detail?.description;
    }
    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };
    useEffect(() => {
        if (!hasMultipleImages || !isHovered) return; // ถ้ามีรูปเดียวไม่ต้องทำอะไร

        const interval = setInterval(() => {
            paginate(1);
        }, 5000); // เลื่อนทุกๆ 5 วินาที

        return () => clearInterval(interval); // ล้าง timer เมื่อ component ถูกทำลาย
    }, [hasMultipleImages, isHovered, page]);
    // ฟังก์ชันเลื่อนรูป (Next / Prev)
    // const nextImage = (e: React.MouseEvent) => {
    //     e.stopPropagation();
    //     setCurrentImgIdx((prev) => (prev + 1) % images.length);
    // };

    // const prevImage = (e: React.MouseEvent) => {
    //     e.stopPropagation();
    //     setCurrentImgIdx((prev) => (prev - 1 + images.length) % images.length);
    // };

    return (
        <motion.div variants={fadeInUp} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col h-[460px] relative group hover:shadow-md transition-shadow"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            
            {/* --- ส่วนรูปภาพ (Carousel) --- */}
            <div 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="h-64 w-full bg-gray-100 relative overflow-hidden cursor-pointer flex-shrink-0 group/image"
            >
            <AnimatePresence initial={false} custom={direction}>    
                {coverImage ? (
                    <motion.img
                            key={page}
                            src={coverImage}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            alt={title}
                            className="absolute inset-0 w-full h-full object-cover"
                            draggable="false"
                        />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <span className="text-2xl">🖼️</span>
                    </div>
                )}
            </AnimatePresence>

                {/* ปุ่มเลื่อนรูป (แสดงเมื่อมี > 1 รูป) */}
                {hasMultipleImages && (
                    <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70 z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); paginate(1); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70 z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>

                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {images.map((_: any, i: number) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imageIndex ? 'bg-white scale-125' : 'bg-white/60'}`}></div>
                            ))}
                        </div>
                    </>
                )}

                {/* Badge ประเภท */}
                <span className={`absolute top-2 right-2 text-[9px] text-white px-2 py-0.5 rounded-full font-bold uppercase shadow-sm z-10 ${contentType === 'activity' ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {contentType}
                </span>
            
            </div>

            {/* --- ส่วนรายละเอียด --- */}
            <div className="p-3 flex-1 flex flex-col bg-white">
                <h4 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight h-10" title={title}>
                    {title}
                </h4>

                <div className="flex flex-wrap gap-1.5 mb-2">
                    {level && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-md font-medium truncate max-w-[80px]">{level}</span>}
                    {category && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-md font-medium truncate max-w-[80px]">{category}</span>}
                    {reward && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-md font-medium truncate max-w-[80px]">🏆 {reward}</span>}
                </div>

                <div className="space-y-1 text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1.5">
                            <span className="truncate">{description}</span>
                    </div>
                </div>

                <div className="space-y-1 text-xs text-gray-500 mb-2">
                    {date && (
                        <div className="flex items-center gap-1.5">
                            <span>📅</span> <span>{formatDateThai(date)}</span>
                        </div>
                    )}
                    {location && (
                        <div className="flex items-center gap-1.5">
                            <span>📍</span> <span className="truncate">{location}</span>
                        </div>
                    )}
                </div>
                
                <div className="mt-auto flex gap-2 pt-2 border-t border-gray-100">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 rounded transition-colors font-medium border border-blue-200"
                    >
                        แก้ไข
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded transition-colors font-medium border border-red-200"
                    >
                        ลบ
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const EmptySlot = ({ onClick }: { onClick: () => void }) => (
        <div 
            onClick={onClick}
            className="border-2 border-gray-200 rounded-lg h-[460px] overflow-hidden cursor-pointer group hover:border-blue-400 transition-colors bg-white relative"
        >
            {/* ส่วนรูปจำลอง */}
            <div className="h-64 bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <CirclePlus className="text-gray-300 group-hover:text-blue-400" size={48} />
            </div>
            {/* ส่วนข้อความจำลอง */}
            <div className="p-3 space-y-2">
                <div className="h-2 bg-gray-100 rounded w-3/4 group-hover:bg-blue-50"></div>
                <div className="h-2 bg-gray-100 rounded w-1/2 group-hover:bg-blue-50"></div>
            </div>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-sm">
                    + เลือกข้อมูล
                </span>
            </div>
        </div>
    );

function SectionsContent() {
    const [sections, setSections] = useState<PortfolioSection[]>([]);
    const [selectedSection, setSelectedSection] = useState<PortfolioSection | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPortfolioID, setCurrentPortfolioID] = useState<number | null>(null);
    const [currentPortfolioName, setCurrentPortfolioName] = useState<string>("");

    const [activities, setActivities] = useState<any[]>([]);
    const [workings, setWorkings] = useState<any[]>([]);

    const [isEditingItem, setIsEditingItem] = useState(false);

    const [selectedDataType, setSelectedDataType] = useState<'activity' | 'working' |'profile'>('activity');
    const [selectedDataId, setSelectedDataId] = useState<string>("");
    const [currentBlock, setCurrentBlock] = useState<any>(null);

    const [imageIndices, setImageIndices] = useState<{ [blockId: number]: number }>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const searchParams = useSearchParams();
    const portfolioIdParam = searchParams.get("portfolio_id");

    const [isModalOpen, setIsModalOpen] = useState(false); // เปิด/ปิด Modal
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list'); // สลับหน้า List/Form


    const setBlockImageIndex = (blockId: number, index: number) => {
        setImageIndices(prev => ({ ...prev, [blockId]: index }));
    };

    const fetchUserData = async () => {
        try {
            const res = await fetch(`${API}/user/me`); //ดึงข้อมูลผู้ใช้ปัจจุบัน
            if (res.ok) setCurrentUser(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    // Auto-play timer อาจจะลบ
    useEffect(() => {
        const interval = setInterval(() => {
            setImageIndices(prev => {
                const newIndices = { ...prev };
                sections.forEach(section => {
                    const blocks = section.section_blocks || [];
                    if (blocks.length === 0) return;

                    const content = parseBlockContent(blocks[0].content);
                    const images = extractImages(content?.data, content?.type);

                    if (images.length > 1) {
                        const currentIndex = prev[section.ID] || 0;
                        newIndices[section.ID] = (currentIndex + 1) % images.length;
                    }
                });
                return newIndices;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [sections]);


    
    const loadAll = async () => {
        try {
            const [portfoliosComp, activitiesComp, workingsComp] = await Promise.all([
                fetchMyPortfolios(),
                fetchActivities(),
                fetchWorkings()
            ]);
            
            setActivities(activitiesComp.data || []);
            setWorkings(workingsComp.data || []);
            
            const portfolios = portfoliosComp.data || [];
            let targetPortfolioID: number | null = null;
            if (portfolioIdParam && !isNaN(Number(portfolioIdParam))) {
                targetPortfolioID = Number(portfolioIdParam);
            } else if (portfolios.length > 0) {
                targetPortfolioID = portfolios[0].ID;
            }

            setCurrentPortfolioID(targetPortfolioID);
            const targetPortfolio = portfolios.find((p: any) => p.ID === targetPortfolioID);

            if (targetPortfolio) {
                // console.warn("⚠️ Portfolio not found:", targetPortfolioID);
                // setSections([]);
                // setLoading(false);
                // return;
                setCurrentPortfolioName(targetPortfolio.portfolio_name || targetPortfolio.PortfolioName || "");
                const allSections: PortfolioSection[] = [];
                if (targetPortfolio.portfolio_sections) {
                    targetPortfolio.portfolio_sections.forEach((s: any) => {
                        allSections.push({
                            ID: s.ID,
                            section_title: s.section_title || "Untitled Section",
                            section_port_key: s.section_port_key,
                            section_blocks: s.portfolio_blocks || [],
                            portfolio_id: targetPortfolio.ID,
                            order_index: s.section_order,
                            is_enabled: s.is_enabled !== undefined ? s.is_enabled : true,
                        });
                    });
                }
                allSections.sort((a, b) => a.order_index - b.order_index);
                setSections(allSections);

                if (selectedSection) {
                    const updated = allSections.find(s => s.ID === selectedSection.ID);
                    if (updated) setSelectedSection(updated);
                }
            }else{
                console.warn("⚠️ Portfolio not found:", targetPortfolioID);
                setSections([]);
            }
            setLoading(false);
        } catch (err) {
            console.error("Error:", err);
            setLoading(false);
        }
    };

    const handleCreateSection = async () => {
        if (!currentPortfolioID) {
            alert("ไม่พบ Portfolio กรุณาสร้าง Portfolio ก่อน");
            return;
        }
        const name = prompt("ชื่อ Section ใหม่:");
        if (!name) return;

        try {
            await createSection({
                section_title: name,
                section_port_key: name,
                portfolio_id: currentPortfolioID,
                section_order: sections.length + 1,
                is_enabled: true
            });
            alert("สร้าง Section สำเร็จ!");
            loadAll();
        } catch (e) {
            console.error(e);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleToggleSection = async (id: number, currentStatus: boolean) => {
        try {
            // ส่งไปยัง Backend
            await updateSection(id, { is_enabled: !currentStatus });

            // รอให้ DB อัปเดต
            await new Promise(resolve => setTimeout(resolve, 200));

            // โหลดข้อมูลใหม่
            await loadAll();

            alert(!currentStatus ? "เปิดใช้งาน Section แล้ว" : "ปิดการใช้งาน Section");
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleDeleteSection = async (id: number) => {
        if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ Section นี้? ข้อมูลทั้งหมดใน Section นี้จะหายไป")) return;

        try {
            await deleteSection(id);
            alert("ลบ Section สำเร็จ!");
            loadAll();
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการลบ Section");
        }
    };
    // useEffect(() => {
    //     // โหลดทุกครั้งที่หน้านี้ active
    //     const handleFocus = () => {
    //         console.log("🔄 Page focused - reloading sections");
    //         loadAll();
    //     };

    //     window.addEventListener('focus', handleFocus);
    //     loadAll(); // โหลดครั้งแรก

    //     return () => {
    //         window.removeEventListener('focus', handleFocus);
    //     };
    // }, [portfolioIdParam]);

    // ฟังก์ชันสำหรับเปิด Modal และตั้งค่าเริ่มต้น
    const openModal = (section: PortfolioSection) => {
        setSelectedSection(section);
        setViewMode('list');
        setIsModalOpen(true);
        setIsEditingItem(false);
    };

    const openForm = (block: any | null) => {
        setCurrentBlock(block);
        if (block) {
            const c = parseBlockContent(block.content);
            setSelectedDataType(c?.type || 'activity');
            setSelectedDataId(c?.data_id?.toString() || "");
        } else {
            setSelectedDataType('activity');
            setSelectedDataId("");
        }
        setIsEditingItem(true);
        setViewMode('form');
    };

    const handleDirectEdit = (section: PortfolioSection, block: any) => {
        setSelectedSection(section);
        openForm(block);
    };

    const handleDirectAdd = (section: PortfolioSection) => {
        setSelectedSection(section);
        openForm(null);
    };

    const handleSaveItem = async () => {
        if (!selectedSection || (selectedDataType !== 'profile' && !selectedDataId)) {
            alert("กรุณาเลือกข้อมูลก่อน");
            return;
        }

        try {
            let contentData = {};
            if (selectedDataType === 'profile') {
                contentData = {
                    type: 'profile',
                    title: 'My Profile'
                };
            } else {
                let dataItem: any = null;
                let dataName = "";
                

                if (selectedDataType === 'activity') {
                    dataItem = activities.find(a => a.ID.toString() === selectedDataId);
                    dataName = dataItem?.activity_name || "";
                } else {
                    dataItem = workings.find(w => w.ID.toString() === selectedDataId);
                    dataName = dataItem?.working_name || "";
                }

                if (!dataItem) {
                    alert("ไม่พบข้อมูลที่เลือก");
                    return;
                }

                contentData = {
                    // title: dataName,
                    // type: selectedDataType,
                    // data_id: parseInt(selectedDataId),
                    // data: dataItem
                    title: selectedDataType === 'activity' ? dataItem.activity_name : dataItem.working_name,
                    type: selectedDataType,
                    data_id: parseInt(selectedDataId),
                    data: dataItem
                };
            }

            if (currentBlock) {
                await updateBlock(currentBlock.ID, { content: contentData });
                alert("แก้ไขข้อมูลสำเร็จ!");
            } else {
                // สร้าง block ใหม่โดยคำนวณ order
                const maxOrder = Math.max(0, ...selectedSection.section_blocks.map((b: any) => b.block_order || 0));
                await createBlock({
                    portfolio_section_id: selectedSection.ID,
                    block_order: maxOrder + 1,
                    content: contentData
                });
                alert("เพิ่มข้อมูลสำเร็จ!");
            }

            // setIsEditingItem(false);
            // setSelectedDataId("");
            // setCurrentBlock(null);
            // await loadAll();
            // await refreshSelectedSection();
            // setViewMode('list'); 
            // setCurrentBlock(null);
            // loadAll();
            await loadAll();
            setIsEditingItem(false); 
            setCurrentBlock(null);
            setViewMode('list');
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleDeleteBlock = async (blockId: number) => {
        if (!confirm("ต้องการลบข้อมูลนี้?")) return;

        try {
            await deleteBlock(blockId);
            alert("ลบข้อมูลสำเร็จ!");
            await loadAll();
            await refreshSelectedSection();
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        }
    };

    const handleEditBlock = (block: any) => {
        const content = parseBlockContent(block.content);
        setCurrentBlock(block);
        setSelectedDataType(content?.type || 'activity');
        setSelectedDataId(content?.data_id?.toString() || "");
        setIsEditingItem(true);
    };

    const refreshSelectedSection = async () => {
        if (!selectedSection || !currentPortfolioID) return;
        const updated = await fetchMyPortfolios();
        const portfolio = updated.data.find((p: any) => p.ID === currentPortfolioID);
        const updatedSection = portfolio?.portfolio_sections?.find((s: any) => s.ID === selectedSection.ID);
        if (updatedSection) {
            setSelectedSection({
                ID: updatedSection.ID,
                section_title: updatedSection.section_title,
                section_port_key: updatedSection.section_port_key,
                section_blocks: updatedSection.portfolio_blocks || [],
                portfolio_id: portfolio.ID,
                order_index: updatedSection.section_order,
                is_enabled: updatedSection.is_enabled,
            });
        }
    };

    const renderSectionContent = (section: PortfolioSection) => {
        const blocks = section.section_blocks || [];
        // const isProfileLayout = section.section_title?.toLowerCase().includes('profile') || 
        //                         (section as any).layout_type === 'profile_header_left';
        // if (isProfileLayout) {
             // ใช้ข้อมูลจาก currentUser ที่เราดึงมา (User ที่ login อยู่)
             // ถ้ายังโหลดไม่เสร็จ ให้แสดง Loading หรือ Placeholder
            //  const user = currentUser || { 
            //      firstname: "Loading...", lastname: "", 
            //      major: "-", gpa: "-", bio: "-", profile_image: null 
            //  };

            //  return (
            //      <div className="h-full w-full bg-white p-6 flex flex-row items-center gap-6">
            //          {/* 1. รูปวงกลมด้านซ้าย (ตาม Template) */}
            //          <div className="flex-shrink-0">
            //             <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 shadow-md">
            //                 <img 
            //                     src={user.profile_image || getImageUrl(null)} 
            //                     alt="Profile" 
            //                     className="w-full h-full object-cover" 
            //                     onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150'}
            //                 />
            //             </div>
            //          </div>
                     
            //          {/* 2. ข้อมูล User ด้านขวา (ดึงมาโชว์เลย) */}
            //          <div className="flex-1 flex flex-col justify-center space-y-2 text-left">
            //              {/* ชื่อ-นามสกุล */}
            //              <div className="border-b-2 border-blue-200 pb-2 mb-2 w-full">
            //                  <h2 className="text-2xl font-bold text-gray-800">
            //                      {user.firstname} {user.lastname}
            //                  </h2>
            //                  <p className="text-blue-500 font-medium">
            //                      {user.major || "ไม่ได้ระบุสาขาวิชา"}
            //                  </p>
            //              </div>

            //              {/* ข้อมูลย่อย (เกรด / Bio) */}
            //              <div className="space-y-1">
            //                  <p className="text-sm text-gray-600">
            //                      <span className="font-bold text-gray-700">GPAX:</span> {user.gpa || "-"}
            //                  </p>
            //                  <p className="text-sm text-gray-500 line-clamp-2">
            //                      {user.bio || "ยังไม่มีข้อมูลสังเขป"}
            //                  </p>
            //                  <div className="mt-1 inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
            //                     GPAX: {user.gpa || "-"}
            //                 </div>
            //              </div>
            //          </div>
            //      </div>
            //  );
        //     return null;
        // }                        
        
        
        // --- 2. ส่วนแสดงผล Activity / Working (แบบ Card ตามเทมเพลต) ---
        // if (blocks.length === 0) {
        //     return (
        //         <div className="text-gray-400 h-full flex flex-col justify-center items-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 m-4">
        //             <div className="text-4xl mb-2">📭</div>
        //             <div className="text-xs">ยังไม่มีข้อมูลใน Section นี้</div>
        //         </div>
        //     );
        // }

        return (
            <div className="h-full bg-white p-4 overflow-y-auto w-full no-arrow">
                {/* <div className="grid grid-cols-2 gap-4"> */}
                    <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 gap-4 p-4"
                    >
                    
                    {/* Loop แสดงรายการที่มีอยู่จริง */}
                    {blocks.map((block: any, idx: number) => {
                        const c = parseBlockContent(block.content);
                        if(c?.type === 'profile') return null;

                        let itemData = null;
                        if(c?.type === 'activity') itemData = activities.find(a => a.ID == c.data_id);
                        else if(c?.type === 'working') itemData = workings.find(w => w.ID == c.data_id);
                        
                        const finalData = itemData || c?.data;
                        if(!finalData) return null;
                        

                    //     const images = extractImages(finalData, c.type);
                    //     const coverImage = images.length > 0 ? getImageUrl(images[0]) : "";
                    //     const title = c.type === 'activity' ? finalData.activity_name : finalData.working_name;
                    //     const desc = c.type === 'activity' ? finalData.activity_detail?.description : finalData.working_detail?.description;
                    //     const hasMultipleImages = images.length > 1;
                    //     const currentImageIndex = imageIndices[block.ID] || 0;
                    //     const validIndex = images[currentImageIndex] ? currentImageIndex : 0;

                    //     let level, category, reward, date, location, description ;
                    //     if (c.type === 'activity') {
                    //         level = finalData.activity_detail?.level_activity?.level_name;
                    //         category = finalData.activity_detail?.type_activity?.type_name;
                    //         reward = finalData.reward?.level_name;
                    //         date = finalData.activity_detail?.activity_at;
                    //         location = finalData.activity_detail?.institution;
                    //         description = finalData.activity_detail?.description;
                    //     } else {
                    //         // กรณี Working
                    //         category = finalData.working_detail?.type_working?.type_name;
                    //         date = finalData.working_detail?.working_at;
                    //         description = finalData.working_detail?.description;
                    //         // Working อาจไม่มี field location ตรงๆ ให้ใช้ description หรือว่างไว้
                    //     }
                    //     return (
                    //         <div 
                    //             key={idx} 
                    //             className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full min-h-[260px] cursor-pointer relative"
                    //             // onClick={(e) => { e.stopPropagation(); openForm(block); }}
                    //         >
                    //             {/* รูปภาพ (ด้านบน) */}
                    //             <div 
                    //                 onClick={(e) => { e.stopPropagation(); openForm(block); }}
                    //                 className="h-32 w-full bg-gray-100 relative overflow-hidden cursor-pointer"
                    //             >
                    //                 {coverImage ? (
                    //                     <img src={coverImage} alt={title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    //                 ) : (
                    //                     <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    //                         <span className="text-2xl">🖼️</span>
                    //                     </div>
                    //                 )}
                    //                 {/* ✅ ปุ่มควบคุม Carousel (แสดงเมื่อมี > 1 รูป) */}
                    //                 {hasMultipleImages && (
                    //                     <>
                    //                         {/* ปุ่มซ้าย */}
                    //                         <button 
                    //                             onClick={(e) => {
                    //                                 e.stopPropagation(); // ป้องกันการคลิกทะลุไปเปิดฟอร์ม
                    //                                 setBlockImageIndex(block.ID, (validIndex - 1 + images.length) % images.length);
                    //                             }}
                    //                             className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70"
                    //                         >
                    //                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    //                                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    //                             </svg>
                    //                         </button>
                    //                         {/* ปุ่มขวา */}
                    //                         <button 
                    //                             onClick={(e) => {
                    //                                 e.stopPropagation();
                    //                                 setBlockImageIndex(block.ID, (validIndex + 1) % images.length);
                    //                             }}
                    //                             className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/70"
                    //                         >
                    //                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    //                                 <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    //                             </svg>
                    //                         </button>
                    //                         {/* จุด Indicator ด้านล่าง */}
                    //                         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    //                             {images.map((_, i) => (
                    //                                 <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === validIndex ? 'bg-white scale-125' : 'bg-white/60'}`}></div>
                    //                             ))}
                    //                         </div>
                    //                     </>
                    //                 )}
                    //                 {/* Badge */}
                    //                 <span className={`absolute top-2 right-2 text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase shadow-sm ${c.type === 'activity' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                    //                     {c.type}
                    //                 </span>
                    //             </div>
                    //             {/* ข้อความ (รายละเอียด) (ด้านล่าง) */}
                    //             <div className="p-2 flex-1 flex flex-col bg-white">
                    //                 <h4 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight mb-1" title={title}>
                    //                     {title}
                    //                 </h4>
                    //                 {/* Tags (Badges) - แสดงเป็นกลุ่ม */}
                    //                 <div className="flex flex-col gap-1 mb-3">
                    //                     {level && (
                    //                         <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-md font-medium truncate max-w-[80px]">
                    //                             {level}
                    //                         </span>
                    //                     )}
                    //                     {category && (
                    //                         <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-md font-medium truncate max-w-[80px]">
                    //                             {category}
                    //                         </span>
                    //                     )}
                    //                     {reward && (
                    //                         <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-md font-medium truncate max-w-[80px]">
                    //                             🏆 {reward}
                    //                         </span>
                    //                     )}
                    //                 </div>

                    //                 {/* รายละเอียด */}
                    //                 <div className="space-y-1 text-xs text-gray-500 mb-2">
                    //                     {date && (
                    //                         <div className="flex items-center gap-1.5">
                    //                             <span className="truncate">{description}</span>
                    //                         </div>
                    //                     )}
                                        
                    //                 </div>

                    //                 {/* วันที่ & สถานที่ */}
                    //                 <div className="space-y-1 text-xs text-gray-500 mb-2">
                    //                     {date && (
                    //                         <div className="flex items-center gap-1.5">
                    //                             <span className="text-gray-400">📅</span>
                    //                             <span>{formatDateThai(date)}</span>
                    //                         </div>
                    //                     )}
                    //                     {location && (
                    //                         <div className="flex items-center gap-1.5">
                    //                             {/* <span className="text-gray-400">📍</span> */}
                    //                             <span className="truncate">{location}</span>
                    //                         </div>
                    //                     )}
                    //                 </div>
                                    
                    //                 {/* ส่วนปุ่มจัดการ (อยู่ด้านล่างสุดของแต่ละ item) */}
                    //                 <div className="mt-auto flex gap-2 pt-2 border-t border-gray-50">
                    //                     <button 
                    //                         onClick={(e) => { 
                    //                             e.stopPropagation(); 
                    //                             setSelectedSection(section); 
                    //                             openForm(block); 
                    //                         }}
                    //                         className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 rounded transition-colors font-medium"
                    //                     >
                    //                         แก้ไข
                    //                     </button>
                    //                     <button 
                    //                         onClick={(e) => { 
                    //                             e.stopPropagation(); 
                    //                             handleDeleteBlock(block.ID); 
                    //                         }}
                    //                         className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded transition-colors font-medium"
                    //                     >
                    //                         ลบ
                    //                     </button>
                    //                 </div>
                    //             </div>
                    //         </div>
                    //     );
                        return (
                            <PortfolioItemCard 
                                key={block.ID || idx}
                                block={block}
                                data={finalData}
                                contentType={c.type}
                                onEdit={() => handleDirectEdit(section, block)}
                                onDelete={() => handleDeleteBlock(block.ID)}
                            />
                        );
                    })}

                    {/* ========================================================= */}
                    {/* vvv  ส่วนด้านล่าง: พื้นที่ว่าง (Placeholder)  vvv   */}
                    {/* ========================================================= */}
                    
                    {blocks.length === 0 ? (
                        /* กรณีที่ 1: ยังไม่มีข้อมูลเลย -> แสดงช่องว่าง 2 ช่อง (เพื่อให้เหมือน Template) */
                        <>
                            <EmptySlot onClick={() => openForm(null)} />
                            <EmptySlot onClick={() => openForm(null)} />
                        </>
                    ) : (
                        /* กรณีที่ 2: มีข้อมูลแล้ว -> แสดงปุ่ม "+" เล็กๆ ต่อท้ายเผื่ออยากเพิ่มอีก */
                        // <div 
                        //     onClick={() => openForm(null)}
                        //     className="border-2 border-dashed border-gray-300 rounded-lg h-[180px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-all bg-white/50"
                        // >
                        //     <span className="text-3xl font-light mb-1">+</span>
                        //     <span className="text-xs">เพิ่มรายการ</span>
                        // </div>
                        <EmptySlot onClick={() => handleDirectAdd(section)} />
                    )}
                    
                    {/* ========================================================= */}
                    </motion.div>
                {/* </div> */}
            </div>
        );
    };
        

    useEffect(() => {
        loadAll();
        fetchUserData();
    }, [portfolioIdParam]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">กำลังโหลด...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white" >
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-md z-40 ">
                <div className="mx-auto" style={{ maxWidth: 1500 }}>
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-6">
                            <Link href="/student/portfolio" className="text-gray-600 hover:text-gray-900 transition">
                                ← กลับ
                            </Link>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <h1 className="text-lg font-bold text-gray-900">{currentPortfolioName || "Portfolio Sections"}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto" style={{ maxWidth: 1500 }}>
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8 mt-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">จัดการ Sections</h1>
                        <p className="text-gray-600 mt-2">
                            เพิ่ม Section และเลือกผลงาน/กิจกรรมเพื่อแสดงในแฟ้มสะสมผลงาน
                        </p>
                    </div>
                    <button
                        onClick={handleCreateSection}
                        className="rounded-lg px-6 py-3 text-sm font-medium text-white transition shadow-md hover:shadow-lg"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            เพิ่ม Section
                        </span>
                    </button>
                </div>

                {/* Sections Grid */}
                <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6"
                >
                    {sections.map((section) => {
                        const isProfile = section.section_title?.toLowerCase().includes('profile') || 
                                          (section as any).layout_type === 'profile_header_left';
                        if (isProfile) return null;

                        return (
                            <div key={section.ID} 
                                        
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]"
                                        > {/* เพิ่มความสูงกรอบใหญ่ให้พอดี */}
                                
                                {/* 1. ส่วนแสดงผลเนื้อหา (Content Grid) - อยู่ด้านบนสุด */}
                                <div className="flex-1 bg-gray-50 overflow-hidden relative border-b border-gray-200 inner-shadow">
                                    {renderSectionContent(section)}
                                </div>

                                {/* 2. ส่วน Footer (Title & Actions) - ย้ายมาอยู่ด้านล่างตามรูปสเก็ตช์ */}
                                <div className="p-4 bg-white flex flex-col gap-3">
                                    
                                    {/* แถวชื่อ Section + Status + Delete */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {/* ปุ่ม Toggle Status (วงกลม) */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleToggleSection(section.ID, section.is_enabled); }}
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${section.is_enabled ? 'bg-green-100 border-green-300 text-green-600' : 'bg-gray-100 border-gray-300 text-gray-300'}`}
                                                title={section.is_enabled ? "เปิดใช้งานอยู่" : "ปิดใช้งาน"}
                                            >
                                                ✓
                                            </button>
                                            <h3 className="font-bold text-gray-800 truncate text-lg" title={section.section_title}>
                                                {section.section_title}
                                            </h3>
                                        </div>
                                        
                                        {/* ปุ่มลบ Section (ถังขยะ) */}
                                        <button 
                                            onClick={(e) => {e.stopPropagation(); handleDeleteSection(section.ID)}} 
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-full"
                                            title="ลบ Section นี้"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* แถวปุ่มจัดการข้อมูล (สีส้ม) - ตามสเก็ตช์ */}
                                    <button 
                                        onClick={() => openModal(section)}
                                        className="w-full flex items-center justify-center gap-2 bg-[#ff6b35] hover:bg-[#e85a25] text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                                    >
                                        จัดการข้อมูลทั้งหมด
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
                        {/* Empty State */}
                        {sections.filter(s => !s.section_title?.toLowerCase().includes('profile')).length === 0 && (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <div className="text-gray-300 text-7xl mb-4">📂</div>
                                <p className="text-xl font-medium text-gray-600 mb-2">ยังไม่มี Sections</p>
                                <p className="text-gray-400 text-sm">เริ่มสร้าง Section แรกของคุณโดยกดปุ่ม "เพิ่ม Section ใหม่"</p>
                            </div>
                        )}
                </div>
                {/* Modal (Form Popup) */}
            <AnimatePresence>
            {selectedSection && (
                <motion.div 
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSection(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{selectedSection.section_title}</h3>
                                <p className="text-xs text-gray-500 mt-1">ID: {selectedSection.ID}</p>
                            </div>
                            <button onClick={() => setSelectedSection(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 text-xl">×</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            {/* Form View (Add/Edit) */}
                            {isEditingItem ? (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
                                    <div className="flex justify-between items-center border-b pb-4">
                                        <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                            {currentBlock ? '✏️ แก้ไขข้อมูล' : '➕ เพิ่มข้อมูลใหม่'}
                                        </h4>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทข้อมูล</label>
                                        <select className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none" value={selectedDataType} onChange={e => { setSelectedDataType(e.target.value as any); setSelectedDataId(""); }}>
                                            <option value="activity">🏆 กิจกรรม (Activity)</option>
                                            <option value="working">💼 ผลงาน (Working)</option>
                                        </select>
                                    </div>

                                    {selectedDataType !== 'profile' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกรายการ</label>
                                            <select className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none" value={selectedDataId} onChange={e => setSelectedDataId(e.target.value)}>
                                                <option value="">-- กรุณาเลือกรายการ --</option>
                                                {selectedDataType === 'activity' && activities.map(a => <option key={a.ID} value={a.ID}>{a.activity_name}</option>)}
                                                {selectedDataType === 'working' && workings.map(w => <option key={w.ID} value={w.ID}>{w.working_name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => { setIsEditingItem(false); setViewMode('list'); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium transition">ยกเลิก</button>
                                        <button onClick={handleSaveItem} className="flex-1 bg-[#ff6b35] text-white py-2.5 rounded-lg hover:bg-[#e85a25] font-medium transition shadow-sm">บันทึก</button>
                                    </div>
                                </motion.div>
                            ) : (
                                /* List View Fallback (ถ้ากดจัดการข้อมูลทั้งหมด) */
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => openForm(null)}
                                        className="w-full border-2 border-dashed border-orange-300 bg-orange-50 text-orange-600 py-4 rounded-xl font-bold hover:bg-orange-100 transition flex items-center justify-center gap-2"
                                    >
                                        <span className="text-xl">+</span> เพิ่มข้อมูลลงใน Section นี้
                                    </button>

                                    <div className="grid grid-cols-1 gap-3">
                                        {(selectedSection.section_blocks || []).length === 0 ? (
                                            <div className="text-center py-10 text-gray-400">ยังไม่มีข้อมูล</div>
                                        ) : (
                                            (selectedSection.section_blocks || []).map((block: any) => {
                                                const c = parseBlockContent(block.content);
                                                return (
                                                    <div key={block.ID} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg shadow-sm ${c.type === 'activity' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                                                {c.type === 'activity' ? '🏆' : '💼'}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-800">{c.title || 'Untitled'}</h4>
                                                                <p className="text-xs text-gray-500 uppercase font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">{c.type}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => openForm(block)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="แก้ไข">✏️</button>
                                                            <button onClick={() => handleDeleteBlock(block.ID)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="ลบ">🗑️</button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
                    
                        // const blocks = section.section_blocks || [];
                        // const hasData = blocks.length > 0;

                        // let coverImage = "";
                        // let displayData: any = null;
                        // let images: any[] = [];
                        // let validIndex = 0;

                        // // Parse data for the main item (assuming single item enforcement)
                        // if (hasData) {
                        //     const block = blocks[0]; // Primary block
                        //     const content = parseBlockContent(block.content);
                        //     const data = content?.data || {};

                        //     // Try to find cover image from this block
                        //     images = extractImages(data, content?.type);
                        //     const activeIndex = imageIndices[section.ID] || 0;
                        //     validIndex = (activeIndex >= 0 && activeIndex < images.length) ? activeIndex : 0;

                        //     if (images.length > 0) {
                        //         coverImage = getImageUrl(images[validIndex]);
                        //     }

                        //     // Helper formats
                        //     const formatDate = (dateString: string) => {
                        //         if (!dateString) return "";
                        //         const date = new Date(dateString);
                        //         return date.toLocaleDateString("th-TH", {
                        //             year: "numeric",
                        //             month: "long",
                        //             day: "numeric",
                        //         });
                        //     };

                        //     // Prepare display data based on types
                        //     if (content?.type === 'activity') {
                        //         displayData = {
                        //             type: 'activity',
                        //             title: data.activity_name,
                        //             institution: data.activity_detail?.institution,
                        //             date: formatDate(data.activity_detail?.activity_at),
                        //             desc: data.activity_detail?.description,
                        //             typeName: data.activity_detail?.type_activity?.type_name,
                        //             levelName: data.activity_detail?.level_activity?.level_name,
                        //             rewardName: data.reward?.level_name
                        //         };
                        //     } else {
                        //         // Working
                        //         displayData = {
                        //             type: 'working',
                        //             title: data.working_name,
                        //             status: data.status,
                        //             typeName: data.working_detail?.type_working?.type_name,
                        //             date: formatDate(data.working_detail?.working_at),
                        //             desc: data.working_detail?.description,
                        //             links: data.working_detail?.links || []
                        //         };
                        //     }
                        // }

                        // return (
                        //     <div
                        //         key={section.ID}
                        //         className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 ${section.is_enabled ? 'border-orange-200' : 'border-gray-200 opacity-60'
                        //             }`}
                        //     >
                        //         {/* Toggle Switch */}
                        //         <div
                        //             className="absolute top-3 right-3 z-30 flex items-center gap-2 bg-white bg-opacity-95 rounded-full px-3 py-1.5 shadow-md cursor-pointer hover:shadow-lg transition-all"
                        //             onClick={(e) => {
                        //                 e.stopPropagation();
                        //                 handleToggleSection(section.ID, section.is_enabled);
                        //             }}
                        //         >
                        //             <span className={`text-xs font-bold ${section.is_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                        //                 {section.is_enabled ? 'เปิด' : 'ปิด'}
                        //             </span>
                        //             <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ${section.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                        //                 }`}>
                        //                 <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${section.is_enabled ? 'translate-x-5' : ''
                        //                     }`}></div>
                        //             </div>
                        //         </div>

                        //         {/* Card Preview */}
                        //         <div
                        //             className={`relative overflow-hidden p-0 cursor-pointer ${!section.is_enabled && 'grayscale'}`}
                        //             style={{ height: '200px' }}
                        //             onClick={() => openModal(section)}
                        //         >
                        //             {renderSectionContent(section)}
                        //             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                        //                 <span className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1 rounded shadow text-xs text-blue-600 font-medium">
                        //                     คลิกเพื่อจัดการ
                        //                 </span>
                        //             </div>
                        //         </div>
                                    
                                
                                        {/* setSelectedSection(section);
                                        const blocks = section.section_blocks || [];
                                        if (blocks.length > 0) {
                                            const firstBlock = blocks[0];
                                            const content = parseBlockContent(firstBlock.content);
                                            setCurrentBlock(firstBlock);
                                            setSelectedDataType(content?.type || 'activity');
                                            setSelectedDataId(content?.data_id?.toString() || "");
                                        } else {
                                            setCurrentBlock(null);
                                            setSelectedDataType('activity');
                                            setSelectedDataId("");
                                        }
                                        setIsEditingItem(true);
                                         */}
                                    {/* }} */}
                                {/* <div className="relative h-48 w-full bg-gray-100 overflow-hidden"> */}
                                    {/* Slider Track */}
                                    {/* {hasData && (
                                        <div
                                            className="flex transition-transform duration-500 ease-in-out h-full w-full"
                                            style={{ transform: `translateX(-${validIndex * 100}%)` }}
                                        >
                                            {images.length > 0 ? (
                                                images.map((img: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="min-w-full h-full bg-cover bg-center flex-shrink-0"
                                                        style={{
                                                            backgroundImage: `url(${getImageUrl(img)})`
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <div
                                                    className="min-w-full h-full bg-cover bg-center flex-shrink-0"
                                                    style={{
                                                        backgroundImage: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )} */}

                                    {/* Default Gradient if no data */}
                                    {/* {!hasData && (
                                        <div
                                            className="absolute inset-0 z-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                                            }}
                                        />
                                    )} */}

                                    {/* Carousel Controls */}
                                    {/* {hasData && extractImages(parseBlockContent(blocks[0].content)?.data, parseBlockContent(blocks[0].content)?.type).length > 1 && ( */}
                                        <>
                                            {/* Left Arrow */}
                                            {/* <div
                                                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white rounded-full p-1 cursor-pointer hover:bg-opacity-70 transition-all hover:scale-110"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const images = extractImages(parseBlockContent(blocks[0].content)?.data, parseBlockContent(blocks[0].content)?.type);
                                                    const currentIdx = imageIndices[section.ID] || 0;
                                                    const newIndex = (currentIdx - 1 + images.length) % images.length;
                                                    setSectionImageIndex(section.ID, newIndex);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </div> */}

                                            {/* Right Arrow */}
                                            {/* <div
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white rounded-full p-1 cursor-pointer hover:bg-opacity-70 transition-all hover:scale-110"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const images = extractImages(parseBlockContent(blocks[0].content)?.data, parseBlockContent(blocks[0].content)?.type);
                                                    const currentIdx = imageIndices[section.ID] || 0;
                                                    const newIndex = (currentIdx + 1) % images.length;
                                                    setSectionImageIndex(section.ID, newIndex);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div> */}

                                            {/* Dots */}
                                            {/* <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
                                                {extractImages(parseBlockContent(blocks[0].content)?.data, parseBlockContent(blocks[0].content)?.type).map((_, idx) => {
                                                    const currentIdx = imageIndices[section.ID] || 0;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentIdx ? 'bg-white scale-125' : 'bg-white bg-opacity-50'}`}
                                                        ></div>
                                                    );
                                                })}
                                            </div> */}
                                        </>
                                    {/* )} */}


                                    {/* Show Icon only if NO data */}
                                    {/* {!hasData && (
                                        <div className="text-white h-full flex flex-col justify-center items-center text-center relative z-10 opacity-80">
                                            <div className="text-5xl mb-2 drop-shadow-md">
                                                📭
                                            </div>
                                            <div className="text-sm font-semibold opacity-90 drop-shadow-md">
                                                ยังไม่มีข้อมูล
                                            </div>
                                        </div>
                                    )} */}
                                {/* </div> */}
                                {/* <div className="p-5"> */}
                                    {/* <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold text-gray-900 truncate flex-1">
                                            {section.section_title}
                                        </h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleSection(section.ID, section.is_enabled);
                                            }}
                                            className={`ml-2 px-2 py-1 rounded-full text-xs font-bold transition-all border ${section.is_enabled
                                                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                                                }`}
                                            title={section.is_enabled ? "คลิกเพื่อซ่อน" : "คลิกเพื่อแสดง"}
                                        >
                                            {section.is_enabled ? '✓' : '✕'}
                                        </button>
                                    </div> */}

                                    {/* Detailed Item Info */}
                                    {/* {hasData && displayData ? ( */}
                                        {/* // <div className="flex-1 flex flex-col gap-2 text-sm text-gray-700"> */}
                                            {/* Badges Row */}
                                            {/* <div className="flex flex-wrap gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${displayData.type === 'activity' ? 'bg-orange-500' : 'bg-blue-500'
                                                    }`}>
                                                    {displayData.type}
                                                </span>
                                                {displayData.typeName && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                        {displayData.typeName}
                                                    </span>
                                                )}
                                                {displayData.levelName && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-600 border border-purple-200">
                                                        {displayData.levelName}
                                                    </span>
                                                )}
                                                {displayData.status && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase">
                                                        {displayData.status}
                                                    </span>
                                                )}
                                            </div> */}

                                            {/* Title */}
                                            {/* <div className="font-bold text-base text-gray-900 leading-tight">
                                                {displayData.title || 'ไม่มีชื่อ'}
                                            </div> */}

                                            {/* Date */}
                                            {/* {displayData.date && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <span>📅</span>
                                                    <span>{displayData.date}</span>
                                                </div>
                                            )} */}

                                            {/* Institution / Reward (Activity) */}
                                            {/* {(displayData.institution || displayData.rewardName) && (
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {displayData.institution && (
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                            <span>🏢</span>
                                                            <span className="truncate">{displayData.institution}</span>
                                                        </div>
                                                    )}
                                                    {displayData.rewardName && (
                                                        <div className="flex items-center gap-1.5 text-orange-600">
                                                            <span>🏆</span>
                                                            <span className="truncate">{displayData.rewardName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )} */}

                                            {/* Description */}
                                            {/* {displayData.desc && (
                                                <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                                                    {displayData.desc}
                                                </div>
                                            )} */}

                                            {/* Working Links */}
                                            {/* {displayData.links && displayData.links.length > 0 && (
                                                <div className="mt-2 text-xs">
                                                    <div className="flex flex-wrap gap-2">
                                                        {displayData.links.map((link: any, i: number) => (
                                                            <a
                                                                key={i}
                                                                href={link.working_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                🔗 {link.working_link ? new URL(link.working_link).hostname : 'Link'}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )} */}
                                        {/* // </div>
                                    // ) : (
                                    //     <div className="mt-4 text-xs text-gray-400 italic">
                                    //         คลิก "จัดการข้อมูล" เพื่อเพิ่มข้อมูล
                                    //     </div>
                                    // )} */}

                                    {/* <div className="flex items-center gap-3 text-xs text-gray-300 mt-4 pt-3 border-t border-gray-100">
                                        <span>ID: {section.ID}</span>
                                    </div> */}
                                {/* </div> */}






                                {/* Action Buttons */}
//                                 <div className="px-5 py-3 bg-gray-50 border-gray-200 border-t  flex gap-2">
//                                     <button
//                                         onClick={(e) => {
//                                             e.stopPropagation();
//                                             handleDeleteSection(section.ID);
//                                         }}
//                                         className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition border border-red-200"
//                                         title="ลบ Section"
//                                     >
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                         </svg>
//                                     </button>
//                                     <button
//                                         onClick={() => {
//                                             setSelectedSection(section);
//                                             // Auto-select the first block if it exists for editing
//                                             const blocks = section.section_blocks || [];
//                                             if (blocks.length > 0) {
//                                                 const firstBlock = blocks[0];
//                                                 const content = parseBlockContent(firstBlock.content);
//                                                 setCurrentBlock(firstBlock);
//                                                 setSelectedDataType(content?.type || 'activity');
//                                                 setSelectedDataId(content?.data_id?.toString() || "");
//                                             } else {
//                                                 setCurrentBlock(null);
//                                                 setSelectedDataType('activity');
//                                                 setSelectedDataId("");
//                                             }
//                                             setIsEditingItem(true);
//                                         }}
//                                         className="flex-1 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
//                                         style={{ backgroundColor: theme.primary }}
//                                     >
//                                         📝 จัดการข้อมูล
//                                     </button>
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>

//                 {sections.length === 0 && (
//                     <div className="text-center py-16">
//                         <div className="text-gray-400 text-6xl mb-4">📋</div>
//                         <p className="text-xl text-gray-600 mb-2">ยังไม่มี Sections</p>
//                         <p className="text-gray-500">กดปุ่ม "เพิ่ม Section" เพื่อเริ่มต้น</p>
//                     </div>
//                 )}
//             </div>

//             {/* Modal for Section Management */}
//             {selectedSection && (
//                 <div
//                     className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//                     onClick={() => {
//                         setSelectedSection(null);
//                         setIsEditingItem(false);
//                         setSelectedDataId("");
//                         setCurrentBlock(null);
//                     }}
//                 >
//                     <div
//                         className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
//                         onClick={(e) => e.stopPropagation()}
//                     >
//                         {/* Header */}
//                         <div className="p-6 border-b flex items-start justify-between" style={{ background: `linear-gradient(to right, ${theme.primaryLight}, ${theme.primaryLight})` }}>
//                             <div className="flex-1">
//                                 <h2 className="text-2xl font-bold text-gray-900 mb-2">
//                                     {selectedSection.section_title}
//                                 </h2>
//                                 <div className="flex items-center gap-3">
//                                     <span className="text-sm text-gray-500">
//                                         Section ID: {selectedSection.ID}
//                                     </span>
//                                     {selectedSection.is_enabled && (
//                                         <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
//                                             ✓ เปิดใช้งาน
//                                         </span>
//                                     )}
//                                 </div>
//                             </div>
//                             <button
//                                 onClick={() => {
//                                     setSelectedSection(null);
//                                     setIsEditingItem(false);
//                                     setSelectedDataId("");
//                                     setCurrentBlock(null);
//                                 }}
//                                 className="text-gray-400 hover:text-gray-600 text-3xl leading-none ml-4"
//                             >
//                                 ×
//                             </button>
//                         </div>

//                         {/* Content */}
//                         <div className="flex-1 overflow-y-auto p-6">
//                             <div className="rounded-lg p-4 border-2" style={{ backgroundColor: theme.primaryLight, borderColor: theme.accent }}>
//                                 <h3 className="text-sm font-bold mb-3" style={{ color: theme.primaryDark }}>
//                                     {currentBlock ? '✏️ แก้ไขข้อมูล (Section นี้มีข้อมูลอยู่แล้ว)' : '➕ เพิ่มข้อมูล (แทนที่ข้อมูลเดิมหากมี)'}
//                                 </h3>

//                                 <div className="space-y-3">
//                                     <div>
//                                         <label className="block text-xs font-medium text-gray-700 mb-1">ประเภทข้อมูล:</label>
//                                         <select
//                                             className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
//                                             style={{ borderColor: theme.accent }}
//                                             value={selectedDataType}
//                                             onChange={(e) => {
//                                                 setSelectedDataType(e.target.value as any);
//                                                 setSelectedDataId("");
//                                             }}
//                                         >
//                                             <option value="activity">🏆 กิจกรรม (Activity)</option>
//                                             <option value="working">💼 ผลงาน (Working)</option>
//                                             <option value="profile">👤 โปรไฟล์ (Profile)</option>
//                                         </select>
//                                     </div>
                                    
//                                 {selectedDataType !== 'profile' && (
//                                     <div>
//                                         <label className="block text-xs font-medium text-gray-700 mb-1">
//                                             เลือกรายการ:
//                                         </label>
//                                         <select
//                                             className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
//                                             style={{ borderColor: theme.accent }}
//                                             value={selectedDataId}
//                                             onChange={(e) => setSelectedDataId(e.target.value)}
//                                         >
//                                             <option value="">-- เลือกรายการ --</option>
//                                             {selectedDataType === 'activity' && activities.map(act => (
//                                                 <option key={act.ID} value={act.ID}>
//                                                     {act.activity_name} {act.activity_role && `(${act.activity_role})`}
//                                                 </option>
//                                             ))}
//                                             {selectedDataType === 'working' && workings.map(work => (
//                                                 <option key={work.ID} value={work.ID}>
//                                                     {work.working_name} {work.position && `(${work.position})`}
//                                                 </option>
//                                             ))}

//                                         </select>
//                                     </div>
//                                 )}

//                                     <div className="flex gap-2">
//                                         <button
//                                             onClick={handleSaveItem}
//                                             disabled={selectedDataType !== 'profile' && !selectedDataId}
//                                             className="flex-1 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition"
//                                             style={{ backgroundColor: theme.primary }}
//                                         >
//                                             ✓ บันทึกข้อมูล
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Footer */}
//                         <div className="p-6 border-t bg-gray-50 flex justify-end">
//                             <button
//                                 onClick={() => {
//                                     setSelectedSection(null);
//                                     setIsEditingItem(false);
//                                     setSelectedDataId("");
//                                     setCurrentBlock(null);
//                                 }}
//                                 className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
//                             >
//                                 ปิด
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

export default function SectionsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>}>
            <SectionsContent />
        </Suspense>
    );
}