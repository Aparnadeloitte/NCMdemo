export const env = {
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, ""),
};

export const isMockApi = env.apiBaseUrl.length === 0;
