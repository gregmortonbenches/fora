// Edit these to suit you. The `id` is used as a storage key, so keep it
// short and lowercase (and avoid changing it once deployed, otherwise the
// existing status will look like it has reset).
export const PEOPLE = [
  { id: "greg", name: "Greg" },
  { id: "friend", name: "My friend" },
] as const;

export const OFFICE_NAME = "the office";

export type PersonId = (typeof PEOPLE)[number]["id"];
