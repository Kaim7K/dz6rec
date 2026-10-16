import { apiClient } from "@/api/appClient";

export async function deleteProjectCascade(projectId) {
  return apiClient.entities.Project.delete(projectId);
}
