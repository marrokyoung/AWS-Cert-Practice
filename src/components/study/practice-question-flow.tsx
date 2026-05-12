"use client";

import { useMemo, useReducer } from "react";

import { QuestionCard } from "@/components/study/question-card";
import { StudyCardShell } from "@/components/study/study-card-shell";
import { Button } from "@/components/ui/button";
import {
  buildPracticeQuestionResult,
  evaluateQuestion,
  recordPracticeQuestionResult,
  type PracticeQuestionResult,
  type QuestionEvaluation,
} from "@/features/practice";
import type { Question } from "@/types/question";
import type { Confidence } from "@/types/review";

type PracticeFlowState = {
  currentIndex: number;
  selectedAnswerIds: string[];
  submitted: boolean;
  evaluation?: QuestionEvaluation;
  confidence?: Confidence;
  recordedResults: PracticeQuestionResult[];
  finished: boolean;
};

type PracticeFlowAction =
  | { type: "selectAnswer"; optionId: string; questionType: Question["type"] }
  | { type: "submit"; evaluation: QuestionEvaluation }
  | { type: "setConfidence"; confidence: Confidence }
  | { type: "recordResult"; result: PracticeQuestionResult }
  | { type: "nextQuestion"; totalQuestions: number };

const INITIAL_STATE: PracticeFlowState = {
  currentIndex: 0,
  selectedAnswerIds: [],
  submitted: false,
  evaluation: undefined,
  confidence: undefined,
  recordedResults: [],
  finished: false,
};

function reducer(
  state: PracticeFlowState,
  action: PracticeFlowAction,
): PracticeFlowState {
  switch (action.type) {
    case "selectAnswer": {
      if (state.submitted) return state;
      if (action.questionType === "multiple-select") {
        const exists = state.selectedAnswerIds.includes(action.optionId);
        const next = exists
          ? state.selectedAnswerIds.filter((id) => id !== action.optionId)
          : [...state.selectedAnswerIds, action.optionId];
        return { ...state, selectedAnswerIds: next };
      }
      return { ...state, selectedAnswerIds: [action.optionId] };
    }
    case "submit": {
      if (state.submitted || state.selectedAnswerIds.length === 0) return state;
      return { ...state, submitted: true, evaluation: action.evaluation };
    }
    case "setConfidence": {
      if (!state.submitted) return state;
      return { ...state, confidence: action.confidence };
    }
    case "recordResult": {
      // Confidence can change between selection and Next, so an existing
      // result for this question must be replaced rather than ignored.
      // Otherwise the stored retryCandidate flag and session summary
      // would diverge from the confidence the user actually settled on.
      const existingIndex = state.recordedResults.findIndex(
        (r) => r.questionId === action.result.questionId,
      );
      if (existingIndex === -1) {
        return {
          ...state,
          recordedResults: [...state.recordedResults, action.result],
        };
      }
      const next = state.recordedResults.slice();
      next[existingIndex] = action.result;
      return { ...state, recordedResults: next };
    }
    case "nextQuestion": {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= action.totalQuestions) {
        return {
          ...state,
          finished: true,
          selectedAnswerIds: [],
          submitted: false,
          evaluation: undefined,
          confidence: undefined,
        };
      }
      return {
        ...state,
        currentIndex: nextIndex,
        selectedAnswerIds: [],
        submitted: false,
        evaluation: undefined,
        confidence: undefined,
      };
    }
    default:
      return state;
  }
}

export type PracticeQuestionFlowProps = {
  questions: Question[];
};

export function PracticeQuestionFlow({ questions }: PracticeQuestionFlowProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const totalQuestions = questions.length;
  const currentQuestion = questions[state.currentIndex];

  const stats = useMemo(() => {
    const answered = state.recordedResults.length;
    const correct = state.recordedResults.filter(
      (r) => r.result === "correct",
    ).length;
    const retryCandidates = state.recordedResults.filter(
      (r) => r.retryCandidate,
    ).length;
    return { answered, correct, retryCandidates };
  }, [state.recordedResults]);

  const progressPct = totalQuestions === 0
    ? 0
    : Math.round(((state.finished ? totalQuestions : state.currentIndex) / totalQuestions) * 100);

  if (totalQuestions === 0 || !currentQuestion) {
    // Defensive: server should already gate on this, but render a stable
    // shell so the client never explodes if it ever hits this path.
    return null;
  }

  function handleSelectAnswer(optionId: string) {
    dispatch({
      type: "selectAnswer",
      optionId,
      questionType: currentQuestion!.type,
    });
  }

  function handleSubmit() {
    if (state.submitted || state.selectedAnswerIds.length === 0) return;
    const evaluation = evaluateQuestion(currentQuestion!, state.selectedAnswerIds);
    dispatch({ type: "submit", evaluation });
  }

  function handleConfidenceChange(confidence: Confidence) {
    if (!state.submitted || !state.evaluation) return;
    dispatch({ type: "setConfidence", confidence });

    // Build and record immediately so retry/progress receive the result
    // even if the user closes the tab before pressing Next.
    const result = buildPracticeQuestionResult({
      evaluation: state.evaluation,
      cert: currentQuestion!.cert,
      domain: currentQuestion!.domain,
      confidence,
    });
    recordPracticeQuestionResult(result);
    dispatch({ type: "recordResult", result });
  }

  function handleNext() {
    if (!state.submitted || !state.confidence) return;
    dispatch({ type: "nextQuestion", totalQuestions });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label="Practice session progress"
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <dt className="font-medium">Answered:</dt>
            <dd>
              {stats.answered} / {totalQuestions}
            </dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium">Correct:</dt>
            <dd>{stats.correct}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium">Retry candidates:</dt>
            <dd>{stats.retryCandidates}</dd>
          </div>
        </dl>
      </div>

      {state.finished ? (
        <StudyCardShell className="space-y-4 text-center">
          <h2 className="font-heading text-xl font-semibold">
            Session complete
          </h2>
          <p className="text-sm text-muted-foreground">
            You answered {stats.answered} of {totalQuestions} questions.
            {" "}
            {stats.correct} correct.
            {stats.retryCandidates > 0
              ? ` ${stats.retryCandidates} flagged for retry.`
              : ""}
          </p>
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Start a new session
            </Button>
          </div>
        </StudyCardShell>
      ) : (
        <QuestionCard
          question={currentQuestion}
          questionNumber={state.currentIndex + 1}
          totalQuestions={totalQuestions}
          selectedAnswerIds={state.selectedAnswerIds}
          submitted={state.submitted}
          evaluation={state.evaluation}
          confidence={state.confidence}
          onSelectAnswer={handleSelectAnswer}
          onSubmit={handleSubmit}
          onConfidenceChange={handleConfidenceChange}
          onNext={handleNext}
          isLastQuestion={state.currentIndex === totalQuestions - 1}
        />
      )}
    </div>
  );
}
