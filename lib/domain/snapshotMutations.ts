import type { DomainSnapshot, Person, Voice } from "@/lib/domain/types";

type AvailabilityRow = {
  rehearsal_id: string;
  person_id: string;
  status: "yes" | "no" | "unknown";
};

export const mergeAvailabilityRows = (
  snapshot: DomainSnapshot,
  rows: AvailabilityRow[]
): DomainSnapshot => {
  if (!rows.length) return snapshot;

  const byKey = new Map(
    snapshot.availability.map((item) => [`${item.rehearsal_id}:${item.person_id}`, item])
  );

  rows.forEach((row) => {
    byKey.set(`${row.rehearsal_id}:${row.person_id}`, {
      rehearsal_id: row.rehearsal_id,
      person_id: row.person_id,
      status: row.status
    });
  });

  return {
    ...snapshot,
    availability: Array.from(byKey.values())
  };
};

export const mergeCurrentPerson = (
  snapshot: DomainSnapshot,
  patch: Partial<
    Pick<
      Person,
      "first_name" | "last_name" | "email" | "phone" | "city" | "experience_level"
    >
  >
): DomainSnapshot => {
  const currentPersonId = snapshot.current_person_id;
  if (!currentPersonId) return snapshot;

  const people = snapshot.people.map((person) =>
    person.id === currentPersonId ? { ...person, ...patch } : person
  );

  const adminProfile =
    snapshot.adminProfile.id === currentPersonId
      ? {
          ...snapshot.adminProfile,
          first_name: patch.first_name ?? snapshot.adminProfile.first_name,
          last_name: patch.last_name ?? snapshot.adminProfile.last_name,
          email: patch.email ?? snapshot.adminProfile.email,
          phone: patch.phone ?? snapshot.adminProfile.phone,
          city: patch.city ?? snapshot.adminProfile.city
        }
      : snapshot.adminProfile;

  return {
    ...snapshot,
    people,
    adminProfile
  };
};

export const mergeMembershipVoice = (
  snapshot: DomainSnapshot,
  choirId: string,
  personId: string,
  voice: Voice
): DomainSnapshot => {
  return {
    ...snapshot,
    memberships: snapshot.memberships.map((membership) =>
      membership.choir_id === choirId && membership.person_id === personId
        ? { ...membership, voice }
        : membership
    )
  };
};
