import type {
  DomainSnapshot,
  Person,
  Project,
  Rehearsal,
  Weekday
} from "@/lib/domain/types";
import {
  buildAdminProfile,
  mapMembershipRolesToPeopleRoles,
  normalizeSettings
} from "@/lib/data/common";
import {
  enrichPeopleRolesFromMemberships,
  getChoirMembershipsByChoirIds,
  getChoirsByIds,
  getCurrentPersonMemberships
} from "@/lib/data/choirs";
import {
  getAvailabilityByRehearsalIds,
  getProjectParticipantsByProjectIds
} from "@/lib/data/availability";
import {
  getCurrentPerson,
  getPersonSettings,
  getPersonsByIds
} from "@/lib/data/persons";
import {
  getProjectsByChoirIds,
  mapConcertsByProject,
  mapProjectsForUi
} from "@/lib/data/projects";
import { getRehearsalsByProjectIds } from "@/lib/data/rehearsals";
import { getRepertoireByChoirIds } from "@/lib/data/repertoire";

const emptySnapshot = (personId: string): DomainSnapshot => {
  const emptyPerson: Person = {
    id: personId,
    email: "",
    first_name: "",
    last_name: "",
    city: "",
    experience_level: "regular",
    tags: [],
    roles: ["singer"]
  };

  const settings = normalizeSettings({ person_id: personId }, "");

  return {
    current_person_id: personId,
    choirs: [],
    people: [emptyPerson],
    memberships: [],
    projects: [],
    projectParticipations: [],
    concertsByProject: {},
    rehearsalsByProject: {},
    availability: [],
    repertoirePieces: [],
    concertPrograms: [],
    adminProfile: buildAdminProfile(emptyPerson, settings, []),
    personSettings: settings,
    activeChoirId: ""
  };
};

export const getDomainSnapshot = async (): Promise<DomainSnapshot> => {
  const currentPerson = await getCurrentPerson();

  if (!currentPerson) {
    return emptySnapshot("");
  }

  const myMemberships = await getCurrentPersonMemberships(currentPerson.id);
  const choirIds = Array.from(
    new Set(myMemberships.map((item: any) => item.choir_id))
  ) as string[];
  const adminChoirIds = Array.from(
    new Set(
      myMemberships
        .filter((item: any) => {
          const roles = item.roles || [];
          return roles.includes("chairman") || roles.includes("conductor");
        })
        .map((item: any) => item.choir_id)
    )
  ) as string[];
  const choirs = await getChoirsByIds(choirIds);

  const fallbackChoirId = choirs[0]?.id || "";
  const personSettings = await getPersonSettings(currentPerson.id, fallbackChoirId);

  const activeChoirId =
    personSettings.active_choir_id && choirs.some((item) => item.id === personSettings.active_choir_id)
      ? personSettings.active_choir_id
      : fallbackChoirId;

  const memberships = await getChoirMembershipsByChoirIds(choirIds);

  const personIds = Array.from(new Set(memberships.map((item) => item.person_id)));
  const people = await getPersonsByIds(personIds);

  const peopleWithRoles = people.map((person) => ({
    ...person,
    roles: mapMembershipRolesToPeopleRoles(
      memberships
        .filter((membership) => membership.person_id === person.id)
        .flatMap((membership) => membership.roles || [])
    )
  }));

  const projectsRows = await getProjectsByChoirIds(choirIds, {
    currentPersonId: currentPerson.id,
    adminChoirIds
  });
  const projectIds = projectsRows.map((item) => item.id);
  const adminProjectIds = projectsRows
    .filter((item) => adminChoirIds.includes(item.choir_id))
    .map((item) => item.id);

  const rehearsals = await getRehearsalsByProjectIds(
    projectIds,
    personSettings.timezone || "Europe/Zurich"
  );

  const rehearsalsByProject = rehearsals.reduce<Record<string, Rehearsal[]>>((acc, row) => {
    const bucket = acc[row.project_id] || [];
    bucket.push(row);
    acc[row.project_id] = bucket;
    return acc;
  }, {});

  const choirDefaultsById = new Map(
    choirs.map((choir) => [
      choir.id,
      {
        weekdays: choir.rehearsal_pattern.weekdays as Weekday[],
        start: choir.rehearsal_pattern.start_time,
        end: choir.rehearsal_pattern.end_time,
        location: choir.rehearsal_pattern.default_location || ""
      }
    ])
  );

  const projects: Project[] = mapProjectsForUi(
    projectsRows,
    choirDefaultsById,
    rehearsalsByProject
  );

  const concertsByProject = mapConcertsByProject(projectsRows);

  const projectParticipations = await getProjectParticipantsByProjectIds(
    projectIds,
    {
      currentPersonId: currentPerson.id,
      adminProjectIds
    }
  );

  const availability = await getAvailabilityByRehearsalIds(rehearsals.map((item) => item.id));

  const repertoire = await getRepertoireByChoirIds(choirIds);

  const currentPersonMemberships = memberships.filter(
    (membership) => membership.person_id === currentPerson.id
  );

  const adminProfile = buildAdminProfile(
    currentPerson,
    personSettings,
    currentPersonMemberships
  );

  return {
    current_person_id: currentPerson.id,
    choirs,
    people: peopleWithRoles,
    memberships,
    projects,
    projectParticipations,
    concertsByProject,
    rehearsalsByProject,
    availability,
    repertoirePieces: repertoire.pieces,
    concertPrograms: repertoire.programs,
    adminProfile,
    personSettings,
    activeChoirId
  };
};
