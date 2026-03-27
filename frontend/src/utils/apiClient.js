import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const API_PREFIXES = ["/api", "/login", "/signup", "/session", "/logout"];

function shouldPrefix(path) {
  return API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function toApiUrl(path) {
  if (!API || !path || /^https?:\/\//i.test(path)) {
    return path;
  }

  return shouldPrefix(path) ? `${API}${path}` : path;
}

function toApiUrlFromRequestUrl(url) {
  if (!API || !url || typeof window === "undefined") {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.origin !== window.location.origin) {
      return url;
    }

    const pathnameWithQuery = `${parsed.pathname}${parsed.search}`;
    return shouldPrefix(parsed.pathname) ? `${API}${pathnameWithQuery}` : url;
  } catch {
    return url;
  }
}

function patchFetch() {
  if (!API || typeof window === "undefined" || window.__apiFetchPatched) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === "string") {
      return originalFetch(toApiUrl(input), init);
    }

    if (input instanceof Request) {
      const nextUrl = toApiUrlFromRequestUrl(input.url);
      if (nextUrl !== input.url) {
        const nextRequest = new Request(nextUrl, input);
        return originalFetch(nextRequest, init);
      }
    }

    return originalFetch(input, init);
  };

  window.__apiFetchPatched = true;
}

function configureAxios() {
  if (API) {
    axios.defaults.baseURL = API;
  }
}

export function initializeApiClient() {
  configureAxios();
  patchFetch();
}

export { API, toApiUrl };
