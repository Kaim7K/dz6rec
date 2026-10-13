import { apiClient } from "@/api/appClient";

export async function deleteProjectCascade(projectId) {
  const [tracks, sections] = await Promise.all([
    apiClient.entities.Track.filter({ project_id: projectId }).catch(() => []),
    apiClient.entities.ChecklistSection.filter({ project_id: projectId }).catch(() => []),
  ]);

  await Promise.all([
    ...tracks.map((track) => apiClient.entities.TrackVersion.deleteMany({ track_id: track.id })),
    ...sections.map((section) => apiClient.entities.ChecklistNote.deleteMany({ section_id: section.id })),
  ]);

  await Promise.all([
    apiClient.entities.ActivityLog.deleteMany({ project_id: projectId }),
    apiClient.entities.ChecklistItem.deleteMany({ project_id: projectId }),
    apiClient.entities.ChecklistSection.deleteMany({ project_id: projectId }),
    apiClient.entities.Notification.deleteMany({ project_id: projectId }),
    apiClient.entities.ProjectFile.deleteMany({ project_id: projectId }),
    apiClient.entities.ProjectMessage.deleteMany({ project_id: projectId }),
    apiClient.entities.Track.deleteMany({ project_id: projectId }),
  ]);

  await apiClient.entities.Project.delete(projectId);
}
