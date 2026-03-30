import type {
  Certification,
  ContentStatus,
  Difficulty,
  Domain,
  QuestionType,
} from "./shared";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  cert: Certification;
  domain: Domain;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  stem: string;
  options: QuestionOption[];
  correctAnswers: string[];
  explanation: string;
  distractorExplanations: Record<string, string>;
  awsSourceUrls: string[];
  examVersion: string;
  tags: string[];
  status: ContentStatus;
}
