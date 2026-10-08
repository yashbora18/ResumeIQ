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

function getHeaders() {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    throw new Error(
      data?.detail ||
        "Unable to complete the job matching request."
    );
  }

  return data;
}

export async function getResumesForJobMatching() {
  const response = await fetch(
    `${API_BASE_URL}/resumes?page=1&page_size=100&sort_by=uploaded_at&sort_order=desc`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await parseResponse(response);

  return Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];
}

export async function createJobMatch(
  resumeId,
  payload
) {
  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/job-match`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }
  );

  return parseResponse(response);
}

export async function getJobMatches(resumeId) {
  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/job-matches`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
}

export async function getJobMatchStatistics(
  resumeId
) {
  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/job-matches/statistics`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return parseResponse(response);
}

export async function deleteJobMatch(
  resumeId,
  jobMatchId
) {
  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/job-matches/${jobMatchId}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    return parseResponse(response);
  }

  return true;
}