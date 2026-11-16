import { countValidStamps } from "./stamp-store.js";

export function isComplete(progress, config) {
  const ids = [...new Set(config.points.map(({ id }) => id))];
  const required = config.completion.requiredStampCount;
  return Boolean(progress?.stamps && Number.isInteger(required) && required > 0 &&
    required <= ids.length && countValidStamps(progress, ids) >= required);
}
