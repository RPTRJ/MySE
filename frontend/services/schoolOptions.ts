export const SCHOOL_LOCATION_OPTIONS = [
  {
    value: "domestic",
    label: "โรงเรียนในประเทศ",
    schoolTypeName: "โรงเรียนทั่วไป",
  },
  {
    value: "international",
    label: "โรงเรียนต่างประเทศ / อินเตอร์",
    schoolTypeName: "โรงเรียนนานาชาติ / อินเตอร์",
  },
  { value: "ged", label: "GED / อื่นๆ", schoolTypeName: "GED/อื่นๆ" },
] as const;

export type SchoolLocationKey = (typeof SCHOOL_LOCATION_OPTIONS)[number]["value"];

export const SCHOOL_TYPE_FROM_LOCATION = Object.fromEntries(
  SCHOOL_LOCATION_OPTIONS.map((item) => [item.value, item.schoolTypeName]),
) as Record<SchoolLocationKey, string>;

export const inferLocationFromTypeName = (
  typeName?: string,
): SchoolLocationKey | "" => {
  if (!typeName) return "";
  const match = SCHOOL_LOCATION_OPTIONS.find(
    (item) => item.schoolTypeName === typeName,
  );
  return match?.value || "";
};
