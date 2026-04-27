// Edit these to suit you. The `id` is used as a storage key, so keep it
// short and lowercase (and avoid changing it once deployed, otherwise the
// existing status will look like it has reset).
//
// flagColors: three colours, top stripe to bottom stripe.
export const PEOPLE = [
  {
    id: "greg",
    name: "Greg",
    flagColors: ["#0b3d91", "#0a7d3b", "#ffffff"], // blue, green, white
  },
  {
    id: "friend",
    name: "Will",
    flagColors: ["#c1272d", "#f4c430", "#f08a24"], // red, yellow, orange
  },
] as const;

export const OFFICE_NAME = "the office";

export type PersonId = (typeof PEOPLE)[number]["id"];
