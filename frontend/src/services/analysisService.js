const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8001/api/v1";

const TOKEN_KEY = "resumeiq-access-token";

function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    throw new Error(
      data?.detail ||
        "Unable to complete the analysis request."
    );
  }

  return data;
}

function authHeaders() {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getResumesForAnalysis() {
  const response = await fetch(
    `${API_BASE_URL}/resumes?page=1&page_size=100&sort_by=uploaded_at&sort_order=desc`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  const data = await parseResponse(response);

  return Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];
}

export async function getAIAnalysis(resumeId) {
  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/ai-analysis`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return parseResponse(response);
}

export async function generateAIAnalysis(resumeId) {
  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/ai-test`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );

  return parseResponse(response);
}

export async function getAnalysisHistory(resumeId) {
  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/analysis-history`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return parseResponse(response);
}

export async function compareAnalysisHistory(resumeId) {
  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/analysis-history/compare`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return parseResponse(response);
}