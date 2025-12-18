const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Fetch user's portfolios
export async function fetchMyPortfolios() {
  const response = await fetch(`${API}/portfolio/my`);
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
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw new Error("Failed to use template");
  }
  return response.json();
}

// Create a new custom portfolio (no template)
export async function createPortfolio(data: { portfolio_name: string }) {
  const response = await fetch(`${API}/portfolio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create portfolio");
  }
  return response.json();
}

// Create a new template (using portfolio controller)
export async function createTemplate(data: { template_name: string }) {
  const response = await fetch(`${API}/portfolio/template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  const response = await fetch(`${API}/portfolio/activities`);
  if (!response.ok) {
    throw new Error("Failed to fetch activities");
  }
  return response.json();
}

// Fetch workings
export async function fetchWorkings() {
  const response = await fetch(`${API}/portfolio/workings`);
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
      "Content-Type": "application/json",
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
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update section");
  }
  return response.json();
}

// ✅ Create a new portfolio block
export async function createBlock(data: {
  portfolio_section_id: number;
  block_order: number;
  content: any;
}) {
  const response = await fetch(`${API}/portfolio/block`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create block");
  }
  return response.json();
}

// ✅ Update a portfolio block
export async function updateBlock(blockId: number, data: {
  content?: any;
  block_order?: number;
}) {
  const response = await fetch(`${API}/portfolio/block/${blockId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update block");
  }
  return response.json();
}

// ✅ Delete a portfolio block
export async function deleteBlock(blockId: number) {
  const response = await fetch(`${API}/portfolio/block/${blockId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete block");
  }
  return response.json();
}