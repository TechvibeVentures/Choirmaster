import type { ChoirMembership, DomainSnapshot, Person } from "@/lib/domain/types";

export const getPersonName = (person: Person) =>
  `${person.first_name} ${person.last_name}`.trim();

export const getMembership = (
  memberships: ChoirMembership[],
  personId: string,
  choirId: string
) => memberships.find((item) => item.person_id === personId && item.choir_id === choirId);

export const getDefaultChoirId = (snapshot: DomainSnapshot) =>
  snapshot.activeChoirId || snapshot.choirs[0]?.id || "";
