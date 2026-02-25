import type { Voice, VoiceDistribution } from "@/lib/domain/types";

export const VOICE_ORDER: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];

export const DEFAULT_VOICE_DISTRIBUTION: VoiceDistribution = {
  Soprano: [4, 4, 0],
  Alto: [4, 4, 0],
  Tenor: [4, 4, 0],
  Bass: [4, 4, 0]
};

const normalizeSlots = (value: unknown): [number, number, number] | null => {
  if (!Array.isArray(value) || value.length !== 3) return null;

  const parsed = value.map((slot) => {
    if (typeof slot !== "number" || !Number.isInteger(slot) || slot < 0) {
      return null;
    }
    return slot;
  });

  if (parsed.some((slot) => slot === null)) return null;
  return parsed as [number, number, number];
};

export const cloneVoiceDistribution = (
  source: VoiceDistribution = DEFAULT_VOICE_DISTRIBUTION
): VoiceDistribution => ({
  Soprano: [...source.Soprano] as [number, number, number],
  Alto: [...source.Alto] as [number, number, number],
  Tenor: [...source.Tenor] as [number, number, number],
  Bass: [...source.Bass] as [number, number, number]
});

export const normalizeVoiceDistribution = (value: unknown): VoiceDistribution => {
  if (!value || typeof value !== "object") {
    return cloneVoiceDistribution(DEFAULT_VOICE_DISTRIBUTION);
  }

  const draft = value as Partial<Record<Voice, unknown>>;
  const parsed: Partial<VoiceDistribution> = {};

  for (const voice of VOICE_ORDER) {
    const slots = normalizeSlots(draft[voice]);
    if (!slots) {
      return cloneVoiceDistribution(DEFAULT_VOICE_DISTRIBUTION);
    }
    parsed[voice] = slots;
  }

  return {
    Soprano: parsed.Soprano as [number, number, number],
    Alto: parsed.Alto as [number, number, number],
    Tenor: parsed.Tenor as [number, number, number],
    Bass: parsed.Bass as [number, number, number]
  };
};

export const getVoiceCapacity = (distribution: VoiceDistribution, voice: Voice) =>
  distribution[voice].reduce((sum, slot) => sum + slot, 0);
