export type InspectorId = 'dix' | 'legislature-committee';

export type EndingTier = 'damning' | 'mixed' | 'commendation';

export interface PatientTemplate {
  id: string;
  namePool: 'male' | 'female' | 'any';
  condition: string;
  backstoryTags: string[];
  restraints: boolean;
  initialMental: number;
}

export interface ScenarioAction {
  id: string;
  label: string;
  cost: number;
  laborDays: number;
}

export interface HistoricalQuote {
  id: string;
  source: string;
  year: number;
  text: string;
  triggersOn: string[];
}

export interface Scenario {
  id: string;
  title: string;
  year: number;
  location: string;
  introText: string;
  epilogueText: Record<EndingTier, string>;
  startingBudget: number;
  durationDays: number;
  map: string;
  startingPatients: PatientTemplate[];
  availableActions: ScenarioAction[];
  inspector: InspectorId;
  quoteBank: HistoricalQuote[];
}
