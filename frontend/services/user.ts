const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface UserDTO {
  id?: number;
  ID?: number;
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  email: string;
  password?: string; // Optional for updates
  profile_image_url?: string;
  id_number: string;
  phone: string;
  birthday: string; // Format: "YYYY-MM-DD"
  pdpa_consent: boolean;
  pdpa_consent_at?: string;
  profile_completed?: boolean;
  type_id: number; // 1=Student, 2=Teacher, 3=Admin
  id_type: number;
  user_type?: {
    id: number;
    type_name: string;
  };
  user_id_type?: {
    id: number;
    type_name: string;
  };
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
}

export interface CreateUserPayload {
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  email: string;
  password: string;
  profile_image_url?: string;
  id_number: string;
  phone: string;
  birthday: string; // Format: "YYYY-MM-DD"
  pdpa_consent: boolean;
  type_id: number;
  id_type: number;
}

export interface UpdateUserPayload {
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  email: string;
  password?: string; // Optional - only if changing password
  profile_image_url?: string;
  id_number: string;
  phone: string;
  birthday: string;
  pdpa_consent: boolean;
  type_id: number;
  id_type: number;
}

// Map UI-friendly payload (type_id/id_type) to API contract (account_type_id/id_doc_type_id)
function buildUserApiPayload<T extends { type_id: number; id_type: number }>(
  payload: T,
) {
  const { type_id, id_type, ...rest } = payload;
  return {
    ...rest,
    account_type_id: type_id,
    id_doc_type_id: id_type,
  };
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    
    throw new HttpError(response.status, errorMessage);
  }

  const data = await response.json();
  return data.data || data;
}

// =============== CRUD Functions ===============

/**
 * Fetch all users (Admin only)
 */
export async function fetchAllUsers(): Promise<UserDTO[]> {
  const response = await fetch(`${API_URL}/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<UserDTO[]>(response);
}

/**
 * Fetch a single user by ID (Admin only)
 */
export async function fetchUserById(userId: number): Promise<UserDTO> {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<UserDTO>(response);
}

/**
 * Create a new user (Admin only)
 */
export async function createUser(payload: CreateUserPayload): Promise<UserDTO> {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(buildUserApiPayload(payload)),
  });

  return handleResponse<UserDTO>(response);
}

/**
 * Update an existing user (Admin only)
 */
export async function updateUser(userId: number, payload: UpdateUserPayload): Promise<UserDTO> {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(buildUserApiPayload(payload)),
  });

  return handleResponse<UserDTO>(response);
}

/**
 * Delete a user (Admin only)
 */
export async function deleteUser(userId: number): Promise<void> {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to delete user: ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    
    throw new HttpError(response.status, errorMessage);
  }
}

// =============== Helper Functions ===============

/**
 * Get user type name from ID
 */
export function getUserTypeName(typeId: number): string {
  const types: Record<number, string> = {
    1: "นักเรียน",
    2: "ครู",
    3: "แอดมิน",
  };
  return types[typeId] || "ไม่ทราบ";
}

/**
 * Get ID document type name
 */
export function getIDTypeName(idType: number): string {
  const types: Record<number, string> = {
    1: "บัตรประชาชน",
    2: "G-Code",
    3: "Passport",
  };
  return types[idType] || "ไม่ทราบ";
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
export function formatDateForInput(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

export { HttpError };
