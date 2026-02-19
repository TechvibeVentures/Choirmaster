import type { Voice } from "@/lib/domain/types";

export const voiceLabels: Record<Voice, string> = {
  Soprano: "Sopran",
  Alto: "Alt",
  Tenor: "Tenor",
  Bass: "Bass"
};

export const getVoiceLabel = (voice: Voice) => voiceLabels[voice];
