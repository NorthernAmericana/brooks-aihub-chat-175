import type { SessionEventV1_0 } from "@/lib/validation/session-event-schema";

type NumericOrUnknown = number | "unknown";

export type BaselineProfile = {
  tolerance_self_rating_0to10: number | null;
  expected_strength_0to10: number | null;
  average_satisfaction_0to10: number | null;
  average_peak_high_0to10: number | null;
  average_peak_anxiety_0to10: number | null;
};

export type WithinPersonTrendSummary = {
  label: string;
  detail: string;
};

export type SessionEventTrendReport = {
  sample_size: number;
  baseline_profile: BaselineProfile;
  adaptation_signals: {
    tolerance_drift_0to10: number | null;
    recency_days_since_last_use: number | null;
    frequency_sessions_30d_average: number | null;
  };
  within_person_associations: WithinPersonTrendSummary[];
  caveats: string[];
};

function isKnown(value: NumericOrUnknown | undefined): value is number {
  return typeof value === "number";
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function getPeakMetric(event: SessionEventV1_0, key: "high_0_10" | "anxiety_0_10"): number | null {
  const values = [
    event.outcomes.checkpoints["15"][key],
    event.outcomes.checkpoints["60"][key],
    event.outcomes.checkpoints["180"][key],
  ].filter(isKnown);

  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

function getExpectedStrength(event: SessionEventV1_0): number | null {
  const value = event.expectancy?.expected_strength_0to10;
  return isKnown(value) ? value : null;
}

function getTolerance(event: SessionEventV1_0): number | null {
  const value = event.context.user_factors?.tolerance_self_rating_0to10;
  return isKnown(value) ? value : null;
}

function getSessions30d(event: SessionEventV1_0): number | null {
  const value = event.context.user_factors?.use_history.sessions_30d;
  return isKnown(value) ? value : null;
}

function getReliefMotive(event: SessionEventV1_0): number | null {
  const relief = event.context.user_factors?.motive_probabilities.relief;
  return isKnown(relief) ? relief : null;
}

function getCopingMotive(event: SessionEventV1_0): number | null {
  const coping = event.context.user_factors?.motive_probabilities.coping;
  return isKnown(coping) ? coping : null;
}

function getEnhancementMotive(event: SessionEventV1_0): number | null {
  const enhancement = event.context.user_factors?.motive_probabilities.enhancement;
  return isKnown(enhancement) ? enhancement : null;
}

function buildAssociation(
  events: SessionEventV1_0[],
  metricName: string,
  selector: (event: SessionEventV1_0) => number | null,
  outcomeSelector: (event: SessionEventV1_0) => number | null,
): WithinPersonTrendSummary | null {
  const pairs = events
    .map((event) => {
      const x = selector(event);
      const y = outcomeSelector(event);
      return x === null || y === null ? null : { x, y };
    })
    .filter((pair): pair is { x: number; y: number } => pair !== null);

  if (pairs.length < 4) {
    return null;
  }

  const sortedByPredictor = [...pairs].sort((a, b) => a.x - b.x);
  const splitIndex = Math.floor(sortedByPredictor.length / 2);
  const lower = sortedByPredictor.slice(0, splitIndex).map((pair) => pair.y);
  const upper = sortedByPredictor.slice(splitIndex).map((pair) => pair.y);

  const lowerAverage = average(lower);
  const upperAverage = average(upper);

  if (lowerAverage === null || upperAverage === null) {
    return null;
  }

  const delta = Number((upperAverage - lowerAverage).toFixed(2));
  const direction = delta > 0 ? "higher" : delta < 0 ? "lower" : "similar";

  return {
    label: metricName,
    detail:
      direction === "similar"
        ? `Across this user's sessions, ${metricName} tended to align with similar outcomes.`
        : `Across this user's sessions, higher ${metricName} coincided with ${Math.abs(delta)} ${direction} outcome points in this sample.`,
  };
}

export function buildSessionEventTrendReport(
  events: SessionEventV1_0[],
): SessionEventTrendReport {
  const chronologicalEvents = [...events].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );

  const satisfactionValues = chronologicalEvents
    .map((event) => event.outcomes.final.satisfaction_0_10)
    .filter(isKnown);
  const highPeaks = chronologicalEvents
    .map((event) => getPeakMetric(event, "high_0_10"))
    .filter((value): value is number => value !== null);
  const anxietyPeaks = chronologicalEvents
    .map((event) => getPeakMetric(event, "anxiety_0_10"))
    .filter((value): value is number => value !== null);

  const toleranceValues = chronologicalEvents
    .map((event) => getTolerance(event))
    .filter((value): value is number => value !== null);
  const expectedStrengthValues = chronologicalEvents
    .map((event) => getExpectedStrength(event))
    .filter((value): value is number => value !== null);
  const sessions30dValues = chronologicalEvents
    .map((event) => getSessions30d(event))
    .filter((value): value is number => value !== null);

  const baselineProfile: BaselineProfile = {
    tolerance_self_rating_0to10: average(toleranceValues),
    expected_strength_0to10: average(expectedStrengthValues),
    average_satisfaction_0to10: average(satisfactionValues),
    average_peak_high_0to10: average(highPeaks),
    average_peak_anxiety_0to10: average(anxietyPeaks),
  };

  const toleranceDrift =
    toleranceValues.length >= 2
      ? Number((toleranceValues[toleranceValues.length - 1] - toleranceValues[0]).toFixed(2))
      : null;

  let recencyDaysSinceLastUse: number | null = null;
  const latestEvent = chronologicalEvents[chronologicalEvents.length - 1];
  if (latestEvent?.context.user_factors?.use_history.last_use_at) {
    const lastUse = new Date(latestEvent.context.user_factors.use_history.last_use_at);
    if (!Number.isNaN(lastUse.getTime())) {
      recencyDaysSinceLastUse = Number(
        ((new Date(latestEvent.occurred_at).getTime() - lastUse.getTime()) / (1000 * 60 * 60 * 24)).toFixed(2),
      );
    }
  }

  const withinPersonAssociations = [
    buildAssociation(
      chronologicalEvents,
      "relief motive probability",
      getReliefMotive,
      (event) => {
        const satisfaction = event.outcomes.final.satisfaction_0_10;
        return isKnown(satisfaction) ? satisfaction : null;
      },
    ),
    buildAssociation(
      chronologicalEvents,
      "coping motive probability",
      getCopingMotive,
      (event) => getPeakMetric(event, "anxiety_0_10"),
    ),
    buildAssociation(
      chronologicalEvents,
      "enhancement motive probability",
      getEnhancementMotive,
      (event) => getPeakMetric(event, "high_0_10"),
    ),
    buildAssociation(
      chronologicalEvents,
      "expected strength",
      getExpectedStrength,
      (event) => getPeakMetric(event, "high_0_10"),
    ),
  ].filter((summary): summary is WithinPersonTrendSummary => summary !== null);

  return {
    sample_size: chronologicalEvents.length,
    baseline_profile: baselineProfile,
    adaptation_signals: {
      tolerance_drift_0to10: toleranceDrift,
      recency_days_since_last_use: recencyDaysSinceLastUse,
      frequency_sessions_30d_average: average(sessions30dValues),
    },
    within_person_associations: withinPersonAssociations,
    caveats: [
      "These are within-person associations, not proof of causation.",
      "Small sample sizes can produce unstable trends; interpret directionally.",
    ],
  };
}
