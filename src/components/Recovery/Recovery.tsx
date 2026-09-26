import React, { FC, useState } from "react";
import { getPinError, updatePin, verifyRecoveryKey } from "../../helpers/auth";
import "./Recovery.css";

export interface IRecoveryProps {
  onRecovered: () => void;
  onCancel: () => void;
}

type RecoveryStep = "key" | "pin" | "confirm";

const sanitizePin = (value: string) => value.replace(/\D/g, "").slice(0, 8);

export const Recovery: FC<IRecoveryProps> = ({ onRecovered, onCancel }) => {
  const [step, setStep] = useState<RecoveryStep>("key");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyKey = async () => {
    if (isSubmitting) {
      return;
    }

    if (!recoveryKey.trim()) {
      setError("Recovery key is required");
      return;
    }

    setIsSubmitting(true);
    const isValid = await verifyRecoveryKey(recoveryKey);
    setIsSubmitting(false);

    if (!isValid) {
      setError("Invalid recovery key");
      return;
    }

    setError("");
    setStep("pin");
  };

  const handleSetPin = () => {
    const pinError = getPinError(pin);

    if (pinError) {
      setError(pinError);
      return;
    }

    setError("");
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (confirmPin !== pin) {
      setError("PINs do not match");
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePin(pin);
      onRecovered();
    } catch {
      setIsSubmitting(false);
      setError("Something went wrong, please try again");
    }
  };

  const renderError = () =>
    error && (
      <p className="recovery-error" data-testid="recovery-error">
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
      className="recovery-input"
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
    <div className="recovery-container" data-testid="recovery-screen">
      {step === "key" && (
        <>
          <h2 className="recovery-title">Recover your PIN</h2>
          <p className="recovery-subtitle">
            Enter the recovery key you saved during setup.
          </p>
          <input
            data-testid="recovery-input"
            className="recovery-key-input"
            type="text"
            autoFocus
            placeholder="XXXX-XXXX-XXXX"
            value={recoveryKey}
            onChange={(event) => {
              setRecoveryKey(event.target.value.toUpperCase());
              setError("");
            }}
          />
          {renderError()}
          <div className="recovery-actions">
            <button onClick={onCancel}>Cancel</button>
            <button
              className="recovery-primary"
              disabled={isSubmitting}
              onClick={handleVerifyKey}
            >
              {isSubmitting ? "Checking..." : "Verify"}
            </button>
          </div>
        </>
      )}

      {step === "pin" && (
        <>
          <h2 className="recovery-title">Create a new PIN</h2>
          <p className="recovery-subtitle">
            4 to 8 digits, cannot start with 0.
          </p>
          {renderPinInput("recovery-pin", pin, setPin)}
          {renderError()}
          <div className="recovery-actions">
            <button onClick={() => setStep("key")}>Back</button>
            <button className="recovery-primary" onClick={handleSetPin}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <h2 className="recovery-title">Confirm your new PIN</h2>
          <p className="recovery-subtitle">Re-enter the same PIN.</p>
          {renderPinInput("recovery-confirm", confirmPin, setConfirmPin)}
          {renderError()}
          <div className="recovery-actions">
            <button
              onClick={() => {
                setStep("pin");
                setConfirmPin("");
                setError("");
              }}
            >
              Back
            </button>
            <button
              className="recovery-primary"
              disabled={isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
