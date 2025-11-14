import apiClient from "./apiClient";

export const fetchHeatmapObservations = async () => {
  const { data } = await apiClient.get("/admin/heatmap");
  return Array.isArray(data) ? data : [];
};

export const setObservationMask = async (observationId, isMasked) => {
  if (!observationId) {
    throw new Error("Observation id is required");
  }

  await apiClient.patch(`/plant-observations/${observationId}/mask`, {
    is_masked: isMasked ? 1 : 0,
  });
};
