import apiClient from "./apiClient";

const toNumberOrNull = (value) => {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

export async function fetchFlaggedUnsure() {
  const [observationsRes, speciesRes, usersRes, aiResultsRes] = await Promise.all([
    apiClient.get("/plant-observations"),
    apiClient.get("/species"),
    apiClient.get("/users"),
    apiClient.get("/ai-results"),
  ]);

  const observations = Array.isArray(observationsRes.data) ? observationsRes.data : [];
  const species = Array.isArray(speciesRes.data) ? speciesRes.data : [];
  const users = Array.isArray(usersRes.data) ? usersRes.data : [];
  const aiResults = Array.isArray(aiResultsRes.data) ? aiResultsRes.data : [];

  const speciesMap = new Map(
    species.map((item) => [item.species_id, item])
  );

  const userMap = new Map(
    users.map((item) => [item.user_id, item])
  );

  const confidenceMap = new Map();
  aiResults.forEach((result) => {
    if (!result || result.observation_id == null) return;
    const score = toNumberOrNull(result.confidence_score);
    if (score == null) return;
    const existing = confidenceMap.get(result.observation_id);
    if (existing == null || score > existing) {
      confidenceMap.set(result.observation_id, score);
    }
  });

  const flagged = observations
    .filter(
      (obs) => typeof obs.status === "string" && obs.status.toLowerCase() === "pending"
    )
    .map((obs) => {
      const speciesInfo = speciesMap.get(obs.species_id);
      const userInfo = userMap.get(obs.user_id);
      const locationFallback = [obs.location_latitude, obs.location_longitude]
        .filter((coord) => coord != null)
        .map((coord) => Number(coord).toFixed(4))
        .join(", ");

      return {
        observation_id: obs.observation_id,
        plant_name:
          speciesInfo?.common_name ||
          speciesInfo?.scientific_name ||
          "Unknown species",
        confidence: confidenceMap.get(obs.observation_id),
        user: userInfo?.username || "Unknown reporter",
        submitted_at: obs.created_at,
        location: obs.location_name || (locationFallback || "Location unavailable"),
        photo: obs.photo_url,
        is_endangered: Boolean(speciesInfo?.is_endangered),
        notes: obs.notes ?? "",
        status: obs.status,
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.submitted_at).getTime();
      const dateB = new Date(b.submitted_at).getTime();
      return Number.isNaN(dateB) - Number.isNaN(dateA) || dateB - dateA;
    });

  return flagged;
}

export async function updateObservationStatus(observationId, options = {}) {
  if (!observationId) {
    throw new Error("Observation id is required");
  }

  const [detailRes] = await Promise.all([
    apiClient.get(`/plant-observations/${observationId}`),
  ]);

  const detail = detailRes.data;
  if (!detail || !detail.observation_id) {
    throw new Error("Observation not found");
  }

  const payload = {
    species_id:
      typeof options.speciesId !== "undefined"
        ? options.speciesId
        : detail.species_id ?? null,
    photo_url: detail.photo_url ?? null,
    location_latitude: detail.location_latitude ?? null,
    location_longitude: detail.location_longitude ?? null,
    location_name: detail.location_name ?? null,
    notes:
      typeof options.notes !== "undefined"
        ? options.notes
        : detail.notes ?? null,
    source: detail.source ?? null,
    status:
      options.status ?? detail.status ?? "pending",
  };

  await apiClient.put(`/plant-observations/${observationId}`, payload);

  return {
    ...detail,
    ...payload,
  };
}
