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

async function authenticatedNotificationFetch(
  endpoint,
  options = {}
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body instanceof FormData
          ? {}
          : {
              "Content-Type": "application/json",
            }),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.error?.message ||
        "Unable to process notifications."
    );
  }

  return data;
}

export async function getNotifications(limit = 30) {
  return authenticatedNotificationFetch(
    `/notifications?limit=${encodeURIComponent(limit)}`,
    {
      method: "GET",
    }
  );
}

export async function markNotificationAsRead(
  notificationId
) {
  if (!notificationId) {
    throw new Error("Notification ID is required.");
  }

  return authenticatedNotificationFetch(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    }
  );
}

export async function markAllNotificationsAsRead() {
  return authenticatedNotificationFetch(
    "/notifications/read-all",
    {
      method: "POST",
    }
  );
}

/*
 * Clear only notifications that are already read.
 *
 * IMPORTANT:
 * The backend endpoint must delete notifications
 * belonging to the authenticated user where
 * is_read = true.
 *
 * Unread notifications are never deleted.
 */
export async function clearReadNotifications() {
  return authenticatedNotificationFetch(
    "/notifications/read",
    {
      method: "DELETE",
    }
  );
}