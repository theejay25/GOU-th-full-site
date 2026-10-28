// Change this if your backend runs somewhere other than localhost:5000
const API_BASE = "https://gou-th-full-site.vercel.app";

async function postJSON(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// Upload a file (multipart/form-data) with optional Bearer auth
async function postFormData(path, formData, token) {
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// Update a resource with file upload (multipart/form-data, PUT)
async function putFormData(path, formData, token) {
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// PATCH request with JSON body
async function patchJSON(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// DELETE request
async function deleteRequest(path, token) {
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// Legacy status helpers (still available for backward compatibility)
function showStatus(el, kind, message) {
  el.className = "status visible " + kind;
  el.textContent = message;
}

function hideStatus(el) {
  el.className = "status";
  el.textContent = "";
}

// Modern Toast Notification System
// Uses Font Awesome icons - ensure FA is loaded on the page.
// Toasts auto-dismiss after 4.5 seconds; click the close button to dismiss manually.
// Supported types: success | error | info | warning
// showToast(type, message, title) — an optional bold title can be supplied.

function showToast(type, message, title) {
  // Ensure the toast container exists
  var container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  // Build the toast element
  var toast = document.createElement("div");
  toast.className = "toast toast--" + (type || "info");

  // Icon mapping
  var iconHtml = "";
  if (type === "success") {
    iconHtml = '<i class="fas fa-check"></i>';
  } else if (type === "error") {
    iconHtml = '<i class="fas fa-times"></i>';
  } else if (type === "warning") {
    iconHtml = '<i class="fas fa-exclamation-triangle"></i>';
  } else {
    iconHtml = '<i class="fas fa-info"></i>';
  }

  var safeMsg = escapeHtml(message);
  var titleHtml = title
    ? '<div class="toast__title">' + escapeHtml(title) + "</div>"
    : "";

  toast.innerHTML =
    '<div class="toast__icon">' +
    iconHtml +
    "</div>" +
    '<div class="toast__body">' +
    titleHtml +
    '<div class="toast__message">' +
    safeMsg +
    "</div>" +
    "</div>" +
    "<button class=\"toast__close\" onclick=\"var t=this.closest('.toast');t.classList.add('removing');setTimeout(function(){if(t.parentNode)t.remove()},300)\">" +
    '<i class="fas fa-times"></i>' +
    "</button>";

  container.appendChild(toast);

  // Auto-dismiss after 4.5 seconds
  var autoDismiss = setTimeout(function () {
    if (toast.parentNode) {
      toast.classList.add("removing");
      setTimeout(function () {
        if (toast.parentNode) toast.remove();
      }, 300);
    }
  }, 4500);

  // If user hovers, cancel the auto-dismiss
  toast.addEventListener("mouseenter", function () {
    clearTimeout(autoDismiss);
  });

  // Restart auto-dismiss on mouse leave if not already removing
  toast.addEventListener("mouseleave", function () {
    if (!toast.classList.contains("removing")) {
      setTimeout(function () {
        if (toast.parentNode && !toast.classList.contains("removing")) {
          toast.classList.add("removing");
          setTimeout(function () {
            if (toast.parentNode) toast.remove();
          }, 300);
        }
      }, 4500);
    }
  });
}

// Convenience helpers for the four supported notification types.
function notifySuccess(message, title) {
  showToast("success", message, title);
}
function notifyError(message, title) {
  showToast("error", message, title);
}
function notifyInfo(message, title) {
  showToast("info", message, title);
}
function notifyWarning(message, title) {
  showToast("warning", message, title);
}

function hideToast() {
  // Remove all toasts with animation
  document.querySelectorAll(".toast").forEach(function (t) {
    t.classList.add("removing");
    setTimeout(function () {
      if (t.parentNode) t.remove();
    }, 300);
  });
}

// Simple HTML escape to prevent XSS in toast messages
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/[&]/g, function () {
      return "&" + "amp;";
    })
    .replace(/[<]/g, function () {
      return "&" + "lt;";
    })
    .replace(/[>]/g, function () {
      return "&" + "gt;";
    })
    .replace(/["]/g, function () {
      return "&" + "quot;";
    })
    .replace(/[']/g, function () {
      return "&#" + "039;";
    });
}
