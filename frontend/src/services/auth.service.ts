import { apiClient } from "./apiClient";
import type { ApiSuccessResponse } from "@/types/api.types";
import type { AuthPayload, LoginInput, RegisterInput, User } from "@/types/auth.types";

export const registerUser = async (input: RegisterInput): Promise<AuthPayload> => {
  const { data } = await apiClient.post<ApiSuccessResponse<AuthPayload>>("/auth/register", input);
  return data.data as AuthPayload;
};

export const loginUser = async (input: LoginInput): Promise<AuthPayload> => {
  const { data } = await apiClient.post<ApiSuccessResponse<AuthPayload>>("/auth/login", input);
  return data.data as AuthPayload;
};

export const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<ApiSuccessResponse<{ user: User }>>("/auth/me");
  return (data.data as { user: User }).user;
};
