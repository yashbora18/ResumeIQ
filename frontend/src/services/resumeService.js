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
        "Unable to complete the resume request."
    );
  }

  return data;
}

export async function getResumes() {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/resumes`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return parseResponse(response);
}

export async function uploadResume(file) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/resumes/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  return parseResponse(response);
}

export async function getResumeStatus(resumeId) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/status`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return parseResponse(response);
}

export async function getResumePreview(resumeId) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/preview`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return parseResponse(response);
}

export async function downloadResume(resumeId) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}/download`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    throw new Error(
      data?.detail || "Unable to download the resume."
    );
  }

  return response.blob();
}

export async function deleteResume(resumeId) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/resumes/${resumeId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return parseResponse(response);
}