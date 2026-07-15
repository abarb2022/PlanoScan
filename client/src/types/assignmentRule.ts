export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export const ALL_DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export interface AssignmentRule {
  id: string;
  storeId: string;
  storeName: string;
  storeAddress: string | null;
  repId: string;
  repName: string;
  repeatType: string;
  dayOfWeek: DayOfWeek;
  validFrom: string;
  validUntil: string | null;
  createdAt: string | null;
}

export interface AssignmentRuleRequest {
  storeId: string;
  repId: string;
  days: DayOfWeek[];
  validFrom: string;
  validUntil?: string;
}
