import React, { FC, useState } from "react";
import { getPinError, updatePin, verifyPin } from "../../helpers/auth";
import "./Vault.css";

export interface IVaultProps {
  onLock: () => void;
}

type ChangePinStep = "current" | "new" | "confirm";

const sanitizePin = (value: string) => value.replace(/\D/g, "").slice(0, 8);

const ChangePin: FC<{ onDone: () => void; onCancel: () => void }> = ({
  onDone,
  onCancel,
}) => {
  const [step, setStep] = useState<ChangePinStep>("current");
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyCurrent = async () => {
    if (isSubmitting) {
      return;
    }

    if (!currentPin) {
      setError("Current PIN is required");
      return;
    }

    setIsSubmitting(true);
    const isValid = await verifyPin(currentPin);
    setIsSubmitting(false);

    if (!isValid) {
      setError("Wrong current PIN");
      return;
    }

    setError("");
    setStep("new");
  };

  const handleSetPin = () => {
    const pinError = getPinError(pin);

    if (pinError) {
      setError(pinError);
      return;
    }

    if (pin === currentPin) {
      setError("New PIN must be different");
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
      onDone();
    } catch {
      setIsSubmitting(false);
      setError("Something went wrong, please try again");
    }
  };

  const renderError = () =>
    error && (
      <p className="vault-error" data-testid="vault-error">
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
      className="vault-input"
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
    <div className="vault-container" data-testid="vault-change-pin">
      <h2 className="vault-title">Change PIN</h2>

      {step === "current" && (
        <>
          <p className="vault-subtitle">Enter your current PIN.</p>
          {renderPinInput("vault-current-pin", currentPin, setCurrentPin)}
          {renderError()}
          <div className="vault-actions">
            <button onClick={onCancel}>Cancel</button>
            <button
              className="vault-primary"
              disabled={isSubmitting}
              onClick={handleVerifyCurrent}
            >
              {isSubmitting ? "Checking..." : "Continue"}
            </button>
          </div>
        </>
      )}

      {step === "new" && (
        <>
          <p className="vault-subtitle">
            4 to 8 digits, cannot start with 0.
          </p>
          {renderPinInput("vault-new-pin", pin, setPin)}
          {renderError()}
          <div className="vault-actions">
            <button onClick={() => setStep("current")}>Back</button>
            <button className="vault-primary" onClick={handleSetPin}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <p className="vault-subtitle">Re-enter the new PIN.</p>
          {renderPinInput("vault-confirm-pin", confirmPin, setConfirmPin)}
          {renderError()}
          <div className="vault-actions">
            <button
              onClick={() => {
                setStep("new");
                setConfirmPin("");
                setError("");
              }}
            >
              Back
            </button>
            <button
              className="vault-primary"
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

export const Vault: FC<IVaultProps> = ({ onLock }) => {
  const [isChangingPin, setIsChangingPin] = useState(false);

  if (isChangingPin) {
    return (
      <ChangePin
        onDone={() => setIsChangingPin(false)}
        onCancel={() => setIsChangingPin(false)}
      />
    );
  }

  return (
    <div className="vault-container" data-testid="vault">
      <div className="vault-header">
        <h2 className="vault-title">Private Space</h2>
        <button className="vault-lock-button" onClick={onLock}>
          Lock now
        </button>
      </div>

      <div className="vault-placeholder">
        <p className="vault-placeholder-title">Chats coming soon</p>
        <p className="vault-placeholder-text">
          Your private conversations will appear here.
        </p>
      </div>

      <div className="vault-settings">
        <h3 className="vault-settings-title">Settings</h3>
        <button
          className="vault-settings-button"
          onClick={() => setIsChangingPin(true)}
        >
          Change PIN
        </button>
        <p className="vault-note">
          Your recovery key was shown once during setup. If you forget your
          PIN, long-press the H key on the calculator and enter your recovery
          key.
        </p>
      </div>
    </div>
  );
};
