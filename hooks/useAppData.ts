"use client";

import { useMemo } from "react";
import type { ChoirMembership, DomainSnapshot, Person, Project } from "@/lib/domain/types";
import { useAppDataContext } from "@/components/providers/AppDataProvider";
import { getMembership as getMembershipFromList } from "@/lib/domain/utils";

export const useAppData = () => {
  const { snapshot, activeChoirId, setActiveChoirId, replaceSnapshot } = useAppDataContext();

  const choir = useMemo(
    () => snapshot.choirs.find((item) => item.id === activeChoirId) || snapshot.choirs[0],
    [activeChoirId, snapshot.choirs]
  );

  const choirId = choir?.id || "";

  const membersByChoir = useMemo(
    () =>
      snapshot.memberships.filter((membership) => membership.choir_id === choirId),
    [choirId, snapshot.memberships]
  );

  const peopleByChoir = useMemo(() => {
    const ids = new Set(membersByChoir.map((item) => item.person_id));
    return snapshot.people.filter((person) => ids.has(person.id));
  }, [membersByChoir, snapshot.people]);

  const projectsByChoir = useMemo(
    () => snapshot.projects.filter((project) => project.choir_id === choirId),
    [choirId, snapshot.projects]
  );

  const getMembership = (personId: string, overrideChoirId?: string) =>
    getMembershipFromList(snapshot.memberships, personId, overrideChoirId || choirId);

  const getPersonById = (personId: string) =>
    snapshot.people.find((person) => person.id === personId);

  const getProjectById = (projectId: string) =>
    snapshot.projects.find((project) => project.id === projectId);

  const getCurrentProject = () => {
    const sorted = [...projectsByChoir].sort(
      (a, b) =>
        new Date(`${a.date_range.start}T00:00:00`).getTime() -
        new Date(`${b.date_range.start}T00:00:00`).getTime()
    );
    const now = new Date();
    const primary =
      sorted.find((project) => new Date(`${project.date_range.end}T00:00:00`) >= now) ||
      sorted[0] ||
      null;

    if (!primary) return null;

    const primaryConcerts = snapshot.concertsByProject[primary.id] ?? [];
    if (primaryConcerts.length > 0) return primary;

    const fallbackWithConcerts =
      sorted.find((project) => {
        const hasConcerts = (snapshot.concertsByProject[project.id] ?? []).length > 0;
        const notEnded = new Date(`${project.date_range.end}T00:00:00`) >= now;
        return hasConcerts && notEnded;
      }) ||
      sorted.find((project) => (snapshot.concertsByProject[project.id] ?? []).length > 0);

    return fallbackWithConcerts || primary;
  };

  return {
    snapshot,
    activeChoirId: choirId,
    setActiveChoirId,
    replaceSnapshot,
    choir,
    choirs: snapshot.choirs,
    projects: projectsByChoir,
    allProjects: snapshot.projects,
    people: peopleByChoir,
    allPeople: snapshot.people,
    memberships: membersByChoir,
    allMemberships: snapshot.memberships,
    projectParticipations: snapshot.projectParticipations,
    concertsByProject: snapshot.concertsByProject,
    rehearsalsByProject: snapshot.rehearsalsByProject,
    availability: snapshot.availability,
    concertPrograms: snapshot.concertPrograms,
    repertoirePieces: snapshot.repertoirePieces,
    adminProfile: snapshot.adminProfile,
    personSettings: snapshot.personSettings,
    currentPersonId: snapshot.current_person_id,
    getMembership,
    getPersonById,
    getProjectById,
    getCurrentProject
  };
};

export type AppDataHook = ReturnType<typeof useAppData>;

export type AppChoirPerson = Person;
export type AppChoirMembership = ChoirMembership;
export type AppChoirProject = Project;
export type AppDomainSnapshot = DomainSnapshot;
