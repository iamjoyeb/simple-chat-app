import React, { FC, useState } from "react";
import {
  createAuthRecord,
  generateRecoveryKey,
  getPinError,
} from "../../helpers/auth";
import "./Onboarding.css";

export interface IOnboardingProps {
  onComplete: () => void;
}

type OnboardingStep = "create" | "confirm" | "recovery";

const sanitizePin = (value: string) => value.replace(/\D/g, "").slice(0, 8);

export const Onboarding: FC<IOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [recoveryKey] = useState(generateRecoveryKey);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCreate = () => {
    const pinError = getPinError(pin);

    if (pinError) {
      setError(pinError);
      return;
    }

    setError("");
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (confirmPin !== pin) {
      setError("PINs do not match");
      return;
    }

    setError("");
    setStep("recovery");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  };

  const handleFinish = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createAuthRecord(pin, recoveryKey);
      onComplete();
    } catch {
      setIsSubmitting(false);
      setError("Something went wrong, please try again");
    }
  };

  const renderError = () =>
    error && (
      <p className="onboarding-error" data-testid="onboarding-error">
        {error}
      </p>
    );

  const renderPinInput = (
    testId: string,
    value: string,
    onChange: (value: string) => void
  ) => (
    <input
      data-testid={testId}
      className="onboarding-input"
      type="password"
      inputMode="numeric"
      autoFocus
      maxLength={8}
      placeholder="4-8 digits"
      value={value}
      onChange={(event) => {
        onChange(sanitizePin(event.target.value));
        setError("");
      }}
    />
  );

  return (
    <div className="onboarding-container" data-testid="onboarding">
      {step === "create" && (
        <>
          <h2 className="onboarding-title">Create your PIN</h2>
          <p className="onboarding-subtitle">
            This PIN opens your private space. Type it on the calculator and
            press equals. 4 to 8 digits, cannot start with 0.
          </p>
          {renderPinInput("onboarding-pin", pin, setPin)}
          {renderError()}
          <button className="onboarding-button" onClick={handleCreate}>
            Continue
          </button>
        </>
      )}

      {step === "confirm" && (
        <>
          <h2 className="onboarding-title">Confirm your PIN</h2>
          <p className="onboarding-subtitle">Re-enter the same PIN.</p>
          {renderPinInput("onboarding-confirm", confirmPin, setConfirmPin)}
          {renderError()}
          <div className="onboarding-actions">
            <button
              onClick={() => {
                setStep("create");
                setConfirmPin("");
                setError("");
              }}
            >
              Back
            </button>
            <button onClick={handleConfirm}>Continue</button>
          </div>
        </>
      )}

      {step === "recovery" && (
        <>
          <h2 className="onboarding-title">Save your recovery key</h2>
          <p className="onboarding-subtitle">
            If you forget your PIN, this key lets you reset it. It is shown
            only once.
          </p>
          <div className="onboarding-recovery-key" data-testid="recovery-key">
            {recoveryKey}
          </div>
          <button className="onboarding-button" onClick={handleCopy}>
            {isCopied ? "Copied" : "Copy"}
          </button>
          <label className="onboarding-save">
            <input
              type="checkbox"
              data-testid="recovery-saved"
              checked={isSaved}
              onChange={(event) => setIsSaved(event.target.checked)}
            />
            I saved my recovery key
          </label>
          {renderError()}
          <button
            className="onboarding-button"
            disabled={!isSaved || isSubmitting}
            onClick={handleFinish}
          >
            {isSubmitting ? "Saving..." : "Get started"}
          </button>
          <p className="onboarding-hint">
            Forgotten your PIN later? Long-press the H key on the calculator
            and enter your recovery key.
          </p>
        </>
      )}
    </div>
  );
};
