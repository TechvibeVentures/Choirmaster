import { z } from "zod";

export const bootstrapAdminChoirSchema = z.object({
  profile: z.object({
    first_name: z.string().optional().default(""),
    last_name: z.string().optional().default(""),
    city: z.string().optional().default(""),
    role: z.enum(["chair", "conductor", "manager"]).default("conductor"),
    language: z.string().optional().default("Deutsch"),
    timezone: z.string().optional().default("Europe/Zurich")
  }),
  choir: z.object({
    name: z.string().min(1),
    city: z.string().min(1),
    type: z.enum(["mixed", "chamber", "project"]).default("mixed"),
    genres: z.array(z.string()).optional().default([]),
    rehearsal_weekdays: z.array(z.string()).optional().default(["Tue"]),
    rehearsal_start_time: z.string().optional().default("19:30"),
    rehearsal_end_time: z.string().optional().default("21:30"),
    default_location: z.string().optional().default("")
  }),
  createDefaultProject: z.boolean().optional().default(true)
});

export const setActiveChoirSchema = z.object({
  choirId: z.string().uuid()
});

export const commitInvitesSchema = z.object({
  invites: z.array(
    z.object({
      name: z.string().optional().default(""),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().email(),
      voice: z.string().optional().nullable(),
      singer_status: z.enum(["active", "inactive", "project_only"]).optional(),
      roles: z.array(z.string()).optional()
    })
  )
});

export const joinCompleteSchema = z.object({
  token: z.string().min(1),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  city: z.string().optional().default(""),
  voice: z.string().optional().nullable()
});

export const updateAdminProfileSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  city: z.string().optional().default(""),
  language: z.string().optional().default("Deutsch")
});

export const availabilityBatchSchema = z.object({
  projectId: z.string().uuid(),
  personId: z.string().uuid().optional(),
  entries: z
    .array(
      z.object({
        rehearsalId: z.string().uuid(),
        status: z.enum(["yes", "no", "unknown"])
      })
    )
    .min(1)
});

export const updateMeProfileSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  city: z.string().optional().default(""),
  experience_level: z.enum(["junior", "regular", "advanced", "professional"]),
  voice: z.enum(["Soprano", "Alto", "Tenor", "Bass"]),
  choir_id: z.string().uuid()
});
