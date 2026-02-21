import type { SessionEventV1_0 } from "@/lib/validation/session-event-schema";

type SafetyReasonCode =
  | "acute_anxiety_paranoia_escalation"
  | "panic_like_symptoms"
  | "psychosis_like_experience"
  | "severe_nausea_vomiting_pattern";

export type SessionEventSafetyReason = {
  code: SafetyReasonCode;
  detail: string;
};

export type SessionEventResponsePolicy =
  | "standard_optimization_guidance"
  | "safety_support_guidance";

export type SessionEventSafetyAssessment = {
  safetyFlag: boolean;
  reasons: SessionEventSafetyReason[];
  selectedPolicy: SessionEventResponsePolicy;
  guidance: string[];
  audit: {
    safetyFlagFired: boolean;
    triggerReasonCodes: SafetyReasonCode[];
    selectedPolicy: SessionEventResponsePolicy;
    suppressedAdviceCategory: "casual_optimization_advice" | null;
  };
};

const PSYCHOSIS_KEYWORDS = [
  "hallucinat",
  "hearing voices",
  "seeing things",
  "delusion",
  "detached from reality",
  "lost touch with reality",
  "psychosis",
  "extreme paranoia",
];

const PANIC_KEYWORDS = [
  "panic attack",
  "couldn't breathe",
  "hyperventilat",
  "racing heart",
  "overwhelming fear",
  "intense panic",
];

const VOMIT_KEYWORDS = ["vomit", "throwing up", "threw up", "retch", "couldn't keep anything down"];

function collectCheckpointTexts(event: SessionEventV1_0): string {
  const checkpointNotes = [
    event.outcomes.checkpoints["15"].notes,
    event.outcomes.checkpoints["60"].notes,
    event.outcomes.checkpoints["180"].notes,
  ]
    .filter((note): note is string => typeof note === "string")
    .join(" ");

  return `${event.notes ?? ""} ${checkpointNotes}`.toLowerCase();
}

function isKnownScore(value: number | "unknown"): value is number {
  return typeof value === "number";
}

export function assessSessionEventSafety(
  event: SessionEventV1_0,
): SessionEventSafetyAssessment {
  const reasons: SessionEventSafetyReason[] = [];
  const allText = collectCheckpointTexts(event);
  const checkpoints = [
    event.outcomes.checkpoints["15"],
    event.outcomes.checkpoints["60"],
    event.outcomes.checkpoints["180"],
  ];

  const baselineAnxiety = event.context.baseline_mood.anxiety_0_10;
  const maxAnxiety = checkpoints.reduce<number | null>((max, checkpoint) => {
    const value = checkpoint.anxiety_0_10;
    if (!isKnownScore(value)) {
      return max;
    }
    return max === null ? value : Math.max(max, value);
  }, null);
  const maxParanoia = checkpoints.reduce<number | null>((max, checkpoint) => {
    const value = checkpoint.paranoia_0_10;
    if (!isKnownScore(value)) {
      return max;
    }
    return max === null ? value : Math.max(max, value);
  }, null);

  const hasAcuteEscalation =
    (isKnownScore(baselineAnxiety) &&
      maxAnxiety !== null &&
      maxAnxiety >= 7 &&
      maxAnxiety - baselineAnxiety >= 4) ||
    (maxParanoia !== null && maxParanoia >= 8);

  if (hasAcuteEscalation) {
    reasons.push({
      code: "acute_anxiety_paranoia_escalation",
      detail:
        "Detected sharp rise in anxiety/paranoia severity (high checkpoint score or large increase from baseline).",
    });
  }

  const panicByAdverseEvent = checkpoints.some(
    (checkpoint) => checkpoint.adverse_event === "panic",
  );
  const panicByNotes = PANIC_KEYWORDS.some((keyword) => allText.includes(keyword));
  if (panicByAdverseEvent || panicByNotes) {
    reasons.push({
      code: "panic_like_symptoms",
      detail:
        "Detected panic-like symptoms from adverse_event markers or panic-language in notes.",
    });
  }

  const psychosisByKeywords = PSYCHOSIS_KEYWORDS.some((keyword) =>
    allText.includes(keyword),
  );
  const psychosisByParanoiaExtreme = maxParanoia !== null && maxParanoia >= 9;
  if (psychosisByKeywords || psychosisByParanoiaExtreme) {
    reasons.push({
      code: "psychosis_like_experience",
      detail:
        "Detected psychosis-like indicators from text patterns or extreme paranoia score.",
    });
  }

  const vomitingEvents = checkpoints.filter(
    (checkpoint) => checkpoint.adverse_event === "vomiting",
  ).length;
  const vomitingByText = VOMIT_KEYWORDS.some((keyword) => allText.includes(keyword));
  if (vomitingEvents >= 1 || vomitingByText) {
    reasons.push({
      code: "severe_nausea_vomiting_pattern",
      detail:
        "Detected severe nausea/vomiting signal from adverse_event markers or vomiting-language in notes.",
    });
  }

  const safetyFlag = reasons.length > 0;
  const selectedPolicy: SessionEventResponsePolicy = safetyFlag
    ? "safety_support_guidance"
    : "standard_optimization_guidance";

  const guidance = safetyFlag
    ? [
        "I’m seeing signs of a potentially unsafe session. Prioritize immediate safety: move to a calm place, hydrate slowly, and avoid additional cannabis or intoxicants right now.",
        "If symptoms feel intense, persist, or return repeatedly, consider professional help from a licensed clinician or urgent care service.",
        "If you feel at immediate risk (for example, chest pain, confusion, or inability to keep fluids down), seek emergency care right away.",
      ]
    : [
        "No severe safety flags were detected in this event.",
        "For routine optimization, keep dose changes gradual and document context (setting, timing, and route) to spot better patterns over time.",
      ];

  return {
    safetyFlag,
    reasons,
    selectedPolicy,
    guidance,
    audit: {
      safetyFlagFired: safetyFlag,
      triggerReasonCodes: reasons.map((reason) => reason.code),
      selectedPolicy,
      suppressedAdviceCategory: safetyFlag ? "casual_optimization_advice" : null,
    },
  };
}
