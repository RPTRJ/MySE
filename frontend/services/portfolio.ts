import { fetchTemplateById } from './templates';

export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`, // ✅ ใส่ Token ตรงนี้ทีเดียวจบ
  };
};

// Fetch user's portfolios
export async function fetchMyPortfolios() {
  //ดึง token จาก localStorage
  const token = localStorage.getItem("token");
  console.log("DEBUG TOKEN:", token);

  const response = await fetch(`${API}/portfolio/my`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch portfolios");
  }
  return response.json();
}

// Use a template (create portfolio from template)
export async function useTemplate(templateId: number) {
  const response = await fetch(`${API}/portfolio/use-template/${templateId}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw new Error("Failed to use template");
  }
  return response.json();
}

// Create a new custom portfolio (no template)
export async function createPortfolio(data: { portfolio_name: string; template_id?: number }) {
  const response = await fetch(`${API}/portfolio`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const msg = `Create portfolio failed: ${response.status} ${response.statusText} ${text}`;
    console.error(msg);
    throw new Error("Failed to create portfolio");
  }
  return response.json();
}

// Create a new template (using portfolio controller)
export async function createTemplate(data: { template_name: string }) {
  const response = await fetch(`${API}/portfolio/template`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create template");
  }
  return response.json();
}

// Fetch activities
export async function fetchActivities() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API}/portfolio/activities`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch activities");
  }
  return response.json();
}

// Fetch workings
export async function fetchWorkings() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API}/portfolio/workings`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch workings");
  }
  return response.json();
}

// Create a new section
export async function createSection(data: {
  section_title: string;
  section_port_key: string;
  portfolio_id: number;
  section_order: number;
  is_enabled: boolean;
}) {
  const response = await fetch(`${API}/portfolio/section`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create section");
  }
  return response.json();
}

// Update a section (including is_enabled toggle)
export async function updateSection(sectionId: number, data: Partial<{
  section_title: string;
  is_enabled: boolean;
  section_order: number;
}>) {
  const response = await fetch(`${API}/portfolio/section/${sectionId}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update section");
  }
  return response.json();
}

// Create a new portfolio block
export async function createBlock(data: {
  portfolio_section_id: number;
  block_order: number;
  content: any;
}) {
  const response = await fetch(`${API}/portfolio/block`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create block");
  }
  return response.json();
}

// Update a portfolio block
export async function updateBlock(blockId: number, data: {
  content?: any;
  block_order?: number;
}) {
  const response = await fetch(`${API}/portfolio/block/${blockId}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update block");
  }
  return response.json();
}

// Delete a portfolio block
export async function deleteBlock(blockId: number) {
  const response = await fetch(`${API}/portfolio/block/${blockId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete block");
  }
  return response.json();
}

export async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    const response = await fetch(`${API}/upload`, {
        method: "POST",
        headers: {
           "Authorization": `Bearer ${token}`,
        },
        body: formData,
    });
    if (!response.ok) throw new Error("Failed to upload image");
    return response.json();
}

export async function updatePortfolio(id: number, data: any) {
    const response = await fetch(`${API}/portfolio/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update portfolio");
    return response.json();
}

export async function deletePortfolio(id: number) {
    const response = await fetch(`${API}/portfolio/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete portfolio");
    return response.json();
}


// สร้าง Portfolio จาก Template ที่มีการดึงข้อมูล Template มาแล้ว
export const createPortfolioFromTemplate = async (portfolioName: string, templateId: number, ) => {
  try {
    // สร้าง Portfolio ใหม่
    const createdRes = await createPortfolio({ 
      portfolio_name: portfolioName,
      template_id: templateId
    });

    const newPortfolio = createdRes.data || createdRes; 
    const newPortfolioId = newPortfolio.ID || newPortfolio.id || newPortfolio.portfolio_id;

    if (!newPortfolioId) throw new Error("Invalid portfolio creation response");

    // ดึงข้อมูล Template
    const templateRes = await fetchTemplateById(templateId);
    const templateData = templateRes.data || templateRes;

    const sectionLinks = templateData.template_section_links || [];

    // สร้าง Sections และ Blocks ตาม Template
    for (const sectionLink of sectionLinks) {

      const tempSection = sectionLink.templates_section || sectionLink.TemplatesSection;
      if (!tempSection) continue;

      const sectionData = {
        // section_title: sectionLink.section_title,
        // section_port_key: sectionLink.section_port_key,
        // portfolio_id: newPortfolio.id,
        // section_order: sectionLink.section_order,
        // is_enabled: sectionLink.is_enabled,
        section_title: tempSection.section_name, 
        section_port_key: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        portfolio_id: newPortfolioId,
        section_order: sectionLink.order_index,
        is_enabled: true,
        layout_type: tempSection.layout_type // ★ Copy layout_type มาด้วย
      };

      const sectionRes = await fetch(`${API}/portfolio/section`, {
        method: "POST",
       headers: getAuthHeaders(),
        body: JSON.stringify(sectionData),
      });

      if (!sectionRes.ok) {
        // throw new Error("Failed to create section from template");
        continue;
      }

      const newSectionData = await sectionRes.json();
      const newSection = newSectionData.data || newSectionData;
      const newSectionId = newSection.ID || newSection.id;

      const sectionBlocks = tempSection.section_blocks || tempSection.SectionBlocks || [];
      // สร้าง Blocks ภายใน Section
      // const templateBlocks = sectionLink.template_blocks || [];
      for (const blockLink of sectionBlocks) {
        const tempBlock = blockLink.templates_block || blockLink.TemplatesBlock;
        if (!tempBlock) continue;

        const blockData = {
          // portfolio_section_id: newSection.id,
          // block_name: tempBlock.block_name,
          // block_order: blockLink.block_order,
          // content: JSON.stringify(tempBlock.default_content),
          // style: JSON.stringify(tempBlock.default_style || {}),
          portfolio_section_id: newSectionId,
          block_name: tempBlock.block_name,
          block_type: tempBlock.block_type,
          block_order: blockLink.order_index,
          // แปลง JSON Object เป็น String ก่อนส่ง
          content: JSON.stringify(tempBlock.default_content),
          style: JSON.stringify(tempBlock.default_style || {}),
        };

        await fetch(`${API}/portfolio/block`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(blockData),
        });
      }
    }
    return newPortfolio;
  } catch (error) {
    console.error("Error creating portfolio from template:", error);
    throw error;
  }
};