import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://api.moltenpancake.club/",
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post("/api/auth/register", data),
  login: (data) => API.post("/api/auth/login/json", data),
  getCurrentUser: () => API.get("/api/auth/me"),
  logout: () => API.post("/api/auth/logout"),
};

export const tasksAPI = {
  generate: (data) => API.post("/api/tasks/generate", data),
  generateSeries: (data) => API.post("/api/tasks/generate-series", data),
  refine: (data) => API.post("/api/tasks/refine", data),
  create: (data) => API.post("/api/tasks", data),
  getAll: (params) => API.get("/api/tasks", { params }),
  getById: (id) => API.get(`/api/tasks/${id}`),
  update: (id, data) => API.put(`/api/tasks/${id}`, data),
  delete: (id) => API.delete(`/api/tasks/${id}`),
  getStatistics: () => API.get("/api/tasks/statistics"),
};

export const validationAPI = {
  validateSolution: (taskId, force = true) =>
    API.post(`/api/validation/validate-solution?task_id=${taskId}&force=${force}`),
  fixWithAI: (taskId) =>
    API.post(`/api/validation/fix-with-ai?task_id=${taskId}`),
};

export const templatesAPI = {
  create: (data) => API.post("/api/templates", data),
  getAll: () => API.get("/api/templates"),
  getById: (id) => API.get(`/api/templates/${id}`),
  update: (id, data) => API.put(`/api/templates/${id}`, data),
  delete: (id) => API.delete(`/api/templates/${id}`),
};

export const exportAPI = {
  exportTasks: (data) =>
    API.post("/api/export", data, {
      responseType:
        data.format === "pdf" ||
        data.format === "docx"
          ? "blob"
          : "text",
    }),

  exportTaskMarkdown: (id) =>
    API.get(`/api/export/${id}/markdown`, {
      responseType: "text",
    }),

  exportTaskPdf: (id) =>
    API.get(`/api/export/${id}/pdf`, {
      responseType: "blob",
    }),
};

export const chatAPI = {
  send: (messages) => API.post("/api/chat", { messages }),
};

export default API;
