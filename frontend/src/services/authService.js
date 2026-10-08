const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8001/api/v1";

const ACCESS_TOKEN_KEY = "resumeiq-access-token";

/**
 * Safely parse an API response.
 */
async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      "Something went wrong. Please try again.";

    throw new Error(message);
  }

  return data;
}

/**
 * Register a new ResumeIQ account.
 */
export async function registerUser({
  fullName,
  email,
  password,
}) {
  const response = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    }
  );

  return parseResponse(response);
}

/**
 * Login to ResumeIQ.
 */
export async function loginUser({
  email,
  password,
}) {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    }
  );

  return parseResponse(response);
}

/**
 * Save the JWT access token.
 */
export function saveAccessToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error(
      "Authentication token was not provided."
    );
  }

  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    token
  );
}

/**
 * Get the currently stored JWT.
 */
export function getAccessToken() {
  return localStorage.getItem(
    ACCESS_TOKEN_KEY
  );
}

/**
 * Remove the current JWT.
 */
export function removeAccessToken() {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );
}

/**
 * Check whether a JWT exists locally.
 */
export function isAuthenticated() {
  return Boolean(getAccessToken());
}

/**
 * Dispatch a global ResumeIQ toast.
 *
 * Services cannot directly use React hooks,
 * so authentication events are sent through
 * a browser CustomEvent.
 */
function dispatchToast(type, message) {
  if (!message || typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("resumeiq:toast", {
      detail: {
        type,
        message,
      },
    })
  );
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Not authenticated.");
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/auth/me`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch {
    throw new Error(
      "Unable to connect to ResumeIQ. Please check your connection."
    );
  }

  if (response.status === 401) {
    removeAccessToken();

    dispatchToast(
      "warning",
      "Your session has expired. Please sign in again."
    );

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  return parseResponse(response);
}

/**
 * Authenticated API request helper.
 *
 * Automatically attaches the JWT.
 *
 * When the backend returns 401:
 * - removes the invalid token
 * - shows a global status message
 * - throws an authentication error
 */
export async function authenticatedFetch(
  url,
  options = {}
) {
  const token = getAccessToken();

  if (!token) {
    dispatchToast(
      "warning",
      "Please sign in to continue."
    );

    throw new Error("Not authenticated.");
  }

  const headers = new Headers(
    options.headers || {}
  );

  headers.set(
    "Accept",
    "application/json"
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    dispatchToast(
      "error",
      "Unable to connect to ResumeIQ. Please check your connection."
    );

    throw new Error(
      "Unable to connect to ResumeIQ. Please check your connection."
    );
  }

  if (response.status === 401) {
    removeAccessToken();

    dispatchToast(
      "warning",
      "Your session has expired. Please sign in again."
    );

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  return response;
}

/**
 * Logout helper.
 *
 * ResumeIQ uses JWT authentication without
 * a server-side logout endpoint, so logout
 * is completed by removing the local token.
 */
export function logoutUser() {
  removeAccessToken();

  dispatchToast(
    "success",
    "Signed out successfully."
  );
}