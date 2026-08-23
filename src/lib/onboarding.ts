export const PRIORITY_OPTIONS = [
  { value: "career", label: "Career", hint: "Study or work" },
  { value: "growth", label: "Growth", hint: "Learning something new" },
  { value: "social", label: "Social", hint: "People and connection" },
  { value: "wellbeing", label: "Well-being", hint: "Body and mind" },
  { value: "adventure", label: "Adventure", hint: "Exploring new things" },
] as const;

export function priorityLabel(value: string) {
  return PRIORITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
