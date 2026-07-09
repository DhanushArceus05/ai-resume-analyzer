import { apiClient } from "./apiClient";
import type { ApiSuccessResponse } from "@/types/api.types";

/**
 * Calls the backend health check endpoint.
 * Not yet wired into any UI in Step 1, but available for a
 * future "API status" indicator.
 */
export const getApiHealth = async (): Promise<ApiSuccessResponse> => {
  const { data } = await apiClient.get<ApiSuccessResponse>("/health");
  return data;
};
