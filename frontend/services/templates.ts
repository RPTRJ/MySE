const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// API functions for templates

// Fetch all templates from the backend
export async function fetchTemplates() {
    const response = await fetch(`${API}/templates`);
    if (!response.ok) {
        throw new Error("Failed to fetch templates");
    }
    return response.json();
}

// Fetch a single template by ID from the backend
export async function fetchTemplateById(templateId: number) {
    const response = await fetch(`${API}/templates/${templateId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch template");
    }
    return response.json();
}

