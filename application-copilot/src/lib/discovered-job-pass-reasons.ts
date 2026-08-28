export const discoveredJobPassReasons = [
  { value: "TOO_SENIOR", label: "Too senior" },
  { value: "SKILL_GAP", label: "Skill gap" },
  { value: "LOCATION", label: "Location" },
  { value: "LOW_PAY", label: "Low pay" },
  { value: "ROLE_MISMATCH", label: "Role mismatch" },
  { value: "OTHER", label: "Other" },
] as const;

export type DiscoveredJobPassReason = (typeof discoveredJobPassReasons)[number]["value"];

export function isDiscoveredJobPassReason(value: string): value is DiscoveredJobPassReason {
  return discoveredJobPassReasons.some((reason) => reason.value === value);
}

export function getDiscoveredJobPassReasonLabel(value: string) {
  return discoveredJobPassReasons.find((reason) => reason.value === value)?.label ?? "Other";
}
