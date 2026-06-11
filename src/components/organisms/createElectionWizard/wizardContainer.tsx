"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/molecules/stepIndicator";
import { BasicInfoForm } from "@/components/organisms/createElectionWizard/forms/basicInfoForm";
import { CandidateEntryForm } from "@/components/organisms/createElectionWizard/forms/candidateEntryForm";
import { VotingRulesForm } from "@/components/organisms/createElectionWizard/forms/votingRulesForm";
import { VoterBaseForm } from "@/components/organisms/createElectionWizard/forms/voterBaseForm";
import { SchedulingForm } from "@/components/organisms/createElectionWizard/forms/schedulingForm";
import { ReviewSummary } from "@/components/organisms/createElectionWizard/reviewSummary";
import { createElection } from "@/lib/api/server/election/create-election";
import type {
  CreateCandidateInput,
  VotingRulesInput,
  VoterBaseInput,
  SchedulingInput,
} from "@/types/election";

const STEPS = [
  { label: "Basic Info" },
  { label: "Candidates" },
  { label: "Voting Rules" },
  { label: "Voter Base" },
  { label: "Schedule" },
  { label: "Review" },
];

export function WizardContainer() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Form state ───
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState<CreateCandidateInput[]>([
    { name: "", description: "" },
    { name: "", description: "" },
  ]);
  const [votingRules, setVotingRules] = useState<VotingRulesInput>({
    maxTotalVotesPerVoter: 1,
    maxVotesPerCandidate: 1,
    allowVoterVisibility: false,
  });
  const [voterBase, setVoterBase] = useState<VoterBaseInput>({
    mode: "anyone_with_link",
  });
  const [scheduling, setScheduling] = useState<SchedulingInput>({
    mode: "manual",
  });

  // ─── Validation ───
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!title.trim()) newErrors.title = "Election title is required";
        if (title.trim().length < 3) newErrors.title = "Title must be at least 3 characters";
        break;

      case 1: // Candidates
        const validCandidates = candidates.filter((c) => c.name.trim());
        if (validCandidates.length < 2)
          newErrors.candidates = "At least 2 candidates with names are required";
        break;

      case 2: // Voting Rules
        if (votingRules.maxVotesPerCandidate > votingRules.maxTotalVotesPerVoter)
          newErrors.votingRules = "Max per candidate cannot exceed max total votes";
        break;

      case 3: // Voter Base
        if (voterBase.mode === "restricted_emails" && (!voterBase.emails || voterBase.emails.length === 0))
          newErrors.voterBase = "Add at least one email address";
        if (voterBase.mode === "restricted_domain" && (!voterBase.domains || voterBase.domains.length === 0))
          newErrors.voterBase = "Enter an email domain";
        break;

      case 4: // Scheduling
        if (scheduling.mode === "automatic") {
          if (!scheduling.scheduledStartAt) newErrors.scheduling = "Start time is required";
          if (!scheduling.scheduledEndAt) newErrors.scheduling = "End time is required";
          if (scheduling.scheduledStartAt && scheduling.scheduledEndAt) {
            if (new Date(scheduling.scheduledStartAt) >= new Date(scheduling.scheduledEndAt))
              newErrors.scheduling = "Start time must be before end time";
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const goBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = () => {
    // Clean candidates (remove empty ones)
    const cleanCandidates = candidates.filter((c) => c.name.trim());

    startTransition(async () => {
      try {
        const result = await createElection({
          title: title.trim(),
          description: description.trim(),
          candidates: cleanCandidates,
          votingRules,
          voterBase,
          scheduling,
        });
        router.push(`/elections/${result._id}`);
      } catch (error) {
        console.error("Failed to create election:", error);
        setErrors({ submit: error instanceof Error ? error.message : "Failed to create election" });
      }
    });
  };

  // ─── Build create input for review ───
  const createInput = {
    title,
    description,
    candidates: candidates.filter((c) => c.name.trim()),
    votingRules,
    voterBase,
    scheduling,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Step indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step content */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8 shadow-sm">
        {/* Step title */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {STEPS[currentStep].label}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {currentStep === 0 && "Give your election a title and description"}
            {currentStep === 1 && "Add the candidates voters will choose from"}
            {currentStep === 2 && "Configure how voting works"}
            {currentStep === 3 && "Decide who can vote in this election"}
            {currentStep === 4 && "Choose when the election opens and closes"}
            {currentStep === 5 && "Review everything before creating your election"}
          </p>
        </div>

        {/* Form content */}
        {currentStep === 0 && (
          <BasicInfoForm
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            errors={errors}
          />
        )}
        {currentStep === 1 && (
          <CandidateEntryForm
            candidates={candidates}
            onCandidatesChange={setCandidates}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <VotingRulesForm rules={votingRules} onRulesChange={setVotingRules} errors={errors} />
        )}
        {currentStep === 3 && (
          <VoterBaseForm voterBase={voterBase} onVoterBaseChange={setVoterBase} errors={errors} />
        )}
        {currentStep === 4 && (
          <SchedulingForm scheduling={scheduling} onSchedulingChange={setScheduling} errors={errors} />
        )}
        {currentStep === 5 && <ReviewSummary data={createInput} />}

        {/* Error display */}
        {errors.submit && (
          <div className="mt-4 rounded-lg bg-[var(--destructive-light)] px-4 py-3 text-sm text-[var(--destructive)]">
            {errors.submit}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 0}
          className={currentStep === 0 ? "invisible" : ""}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={goNext}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              "Creating..."
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Create Election
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
