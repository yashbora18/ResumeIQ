const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8001/api/v1";

function getAccessToken() {
  return (
    localStorage.getItem("resumeiq-access-token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

export async function getResumeStats() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const response = await fetch(
    `${API_BASE_URL}/resumes/stats`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Unable to load your resume statistics."
    );
  }

  return data;
}