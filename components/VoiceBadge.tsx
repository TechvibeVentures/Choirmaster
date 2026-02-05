import Badge from "@/components/Badge";
import type { Voice } from "@/lib/mockData";
import { getVoiceLabel } from "@/lib/labels";

const voiceColors: Record<Voice, string> = {
  Soprano: "var(--voice-soprano)",
  Alto: "var(--voice-alto)",
  Tenor: "var(--voice-tenor)",
  Bass: "var(--voice-bass)"
};

export default function VoiceBadge({ voice }: { voice: Voice }) {
  return <Badge dotColor={voiceColors[voice]}>{getVoiceLabel(voice)}</Badge>;
}
