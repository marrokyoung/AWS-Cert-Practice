"use client";

import {
  CheckCircle2,
  Circle,
  ExternalLink,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StudyCardShell } from "@/components/study/study-card-shell";
import type { QuestionEvaluation } from "@/features/practice";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/question";
import type { Confidence } from "@/types/review";

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const DIFFICULTY_LABEL: Record<Question["difficulty"], string> = {
  foundational: "Foundational",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export type QuestionCardProps = {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswerIds: string[];
  submitted: boolean;
  evaluation?: QuestionEvaluation;
  confidence?: Confidence;
  onSelectAnswer: (optionId: string) => void;
  onSubmit: () => void;
  onConfidenceChange: (confidence: Confidence) => void;
  onNext: () => void;
  isLastQuestion: boolean;
};

function letterFor(index: number): string {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswerIds,
  submitted,
  evaluation,
  confidence,
  onSelectAnswer,
  onSubmit,
  onConfidenceChange,
  onNext,
  isLastQuestion,
}: QuestionCardProps) {
  const isMultiSelect = question.type === "multiple-select";
  const selectedSet = new Set(selectedAnswerIds);
  const correctSet = new Set(evaluation?.correctAnswerIds ?? []);
  const canSubmit = !submitted && selectedAnswerIds.length > 0;
  const canAdvance = submitted && confidence !== undefined;

  return (
    <StudyCardShell className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-secondary-foreground">
            {question.cert}
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5">
            {question.domain}
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5">
            {DIFFICULTY_LABEL[question.difficulty]}
          </span>
        </div>
        <div className="font-mono text-[0.75rem]">
          Question {questionNumber} of {totalQuestions}
        </div>
      </header>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {question.topic}
        </p>
        <h2 className="font-heading text-xl font-semibold leading-snug">
          {question.stem}
        </h2>
        {isMultiSelect ? (
          <p className="text-xs text-muted-foreground">
            Select all that apply.
          </p>
        ) : null}
      </div>

      <fieldset
        className="space-y-2"
        disabled={submitted}
        aria-label="Answer choices"
      >
        <legend className="sr-only">Answer choices</legend>
        {question.options.map((option, index) => {
          const isSelected = selectedSet.has(option.id);
          const isCorrectAnswer = correctSet.has(option.id);
          const showCorrect = submitted && isCorrectAnswer;
          const showIncorrect = submitted && isSelected && !isCorrectAnswer;

          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm transition-colors",
                "hover:bg-muted/60",
                "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                isSelected && !submitted && "border-ring bg-accent/40",
                showCorrect &&
                  "border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
                showIncorrect &&
                  "border-destructive/60 bg-destructive/10 text-destructive",
                submitted && "cursor-default",
              )}
            >
              <input
                type={isMultiSelect ? "checkbox" : "radio"}
                name={`question-${question.id}`}
                value={option.id}
                checked={isSelected}
                onChange={() => onSelectAnswer(option.id)}
                disabled={submitted}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-mono text-xs font-medium",
                  isSelected && !submitted && "border-ring bg-primary text-primary-foreground",
                  showCorrect && "border-emerald-500/60 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100",
                  showIncorrect && "border-destructive/60 bg-destructive/20 text-destructive",
                )}
              >
                {letterFor(index)}
              </span>
              <span className="flex-1 leading-relaxed">{option.text}</span>
              {showCorrect ? (
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400"
                />
              ) : showIncorrect ? (
                <XCircle
                  aria-hidden="true"
                  className="mt-0.5 size-4 text-destructive"
                />
              ) : isSelected && !submitted ? (
                <Circle
                  aria-hidden="true"
                  className="mt-0.5 size-4 text-primary"
                />
              ) : null}
            </label>
          );
        })}
      </fieldset>

      {submitted && evaluation ? (
        <section
          aria-live="polite"
          className="space-y-4 rounded-lg border border-border bg-muted/40 p-4"
        >
          <div
            className={cn(
              "flex items-center gap-2 text-sm font-semibold",
              evaluation.isCorrect
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-destructive",
            )}
          >
            {evaluation.isCorrect ? (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            ) : (
              <XCircle aria-hidden="true" className="size-4" />
            )}
            <span>{evaluation.isCorrect ? "Correct" : "Incorrect"}</span>
          </div>

          <div className="space-y-2 text-sm leading-relaxed">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Explanation
            </p>
            <p>{question.explanation}</p>
          </div>

          {(() => {
            const wrongPicks = selectedAnswerIds.filter(
              (id) => !correctSet.has(id),
            );
            const distractorNotes = wrongPicks
              .map((id) => {
                const note = question.distractorExplanations[id];
                if (!note) return null;
                const optionIndex = question.options.findIndex(
                  (o) => o.id === id,
                );
                const letter = optionIndex >= 0 ? letterFor(optionIndex) : id;
                return { id, letter, note };
              })
              .filter((entry): entry is { id: string; letter: string; note: string } => entry !== null);

            if (distractorNotes.length === 0) return null;

            return (
              <div className="space-y-2 text-sm leading-relaxed">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Why your selection was off
                </p>
                <ul className="space-y-2">
                  {distractorNotes.map(({ id, letter, note }) => (
                    <li key={id} className="flex gap-2">
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-destructive/15 font-mono text-[0.7rem] text-destructive">
                        {letter}
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {question.awsSourceUrls.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                AWS sources
              </p>
              <ul className="flex flex-wrap gap-2">
                {question.awsSourceUrls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-[0.7rem] text-foreground hover:bg-muted"
                    >
                      <ExternalLink aria-hidden="true" className="size-3" />
                      <span className="max-w-[18rem] truncate">{url}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              How confident were you?
            </legend>
            <div className="inline-flex rounded-lg border border-border bg-background p-1">
              {CONFIDENCE_OPTIONS.map((opt) => {
                const isActive = confidence === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <input
                      type="radio"
                      name={`confidence-${question.id}`}
                      value={opt.value}
                      checked={isActive}
                      onChange={() => onConfidenceChange(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {!submitted ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            Submit answer
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canAdvance}
            aria-disabled={!canAdvance}
          >
            {isLastQuestion ? "Finish session" : "Next question"}
          </Button>
        )}
      </div>
    </StudyCardShell>
  );
}
