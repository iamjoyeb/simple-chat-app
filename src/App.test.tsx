import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { createAuthRecord } from "./helpers/auth";

const clickButton = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
const typePin = (pin: string) => pin.split("").forEach(clickButton);

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

const longPressH = async () => {
  fireEvent.pointerDown(screen.getByRole("button", { name: "H" }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  });
};

const fillOnboarding = (pin: string) => {
  fireEvent.change(screen.getByTestId("onboarding-pin"), {
    target: { value: pin },
  });
  clickButton("Continue");
  fireEvent.change(screen.getByTestId("onboarding-confirm"), {
    target: { value: pin },
  });
  clickButton("Continue");
};

const finishOnboarding = async () => {
  fireEvent.click(screen.getByTestId("recovery-saved"));
  clickButton("Get started");
  await screen.findByTestId("screen-input");
};

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("first launch runs onboarding, then gates the calculator behind the PIN", async () => {
    render(<App />);

    expect(screen.getByTestId("onboarding")).toBeInTheDocument();

    fillOnboarding("1234");
    expect(screen.getByTestId("recovery-key")).toBeInTheDocument();
    await finishOnboarding();

    typePin("9999");
    clickButton("=");
    expect(screen.queryByTestId("vault")).not.toBeInTheDocument();
    expect(screen.getByTestId("screen-input")).toHaveValue("9,999");

    clickButton("AC");
    typePin("1234");
    clickButton("=");

    expect(await screen.findByTestId("vault")).toBeInTheDocument();

    clickButton("Lock now");
    expect(screen.getByTestId("screen-input")).toBeInTheDocument();
    expect(screen.queryByTestId("vault")).not.toBeInTheDocument();
  });

  it("launches directly into the calculator when a PIN already exists", async () => {
    await createAuthRecord("1234", "ABCD-EFGH-JK23");
    render(<App />);

    expect(screen.queryByTestId("onboarding")).not.toBeInTheDocument();
    expect(screen.getByTestId("screen-input")).toHaveValue("0");
  });

  it("recovers a forgotten PIN through the recovery key on long-press H", async () => {
    render(<App />);

    fillOnboarding("1234");
    const recoveryKey = screen.getByTestId("recovery-key").textContent || "";
    await finishOnboarding();

    await longPressH();
    expect(screen.getByTestId("recovery-screen")).toBeInTheDocument();
    expect(screen.queryByText("History")).not.toBeInTheDocument();

    clickButton("Cancel");
    expect(screen.getByTestId("screen-input")).toBeInTheDocument();

    await longPressH();
    fireEvent.change(screen.getByTestId("recovery-input"), {
      target: { value: recoveryKey },
    });
    clickButton("Verify");
    expect(await screen.findByTestId("recovery-pin")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("recovery-pin"), {
      target: { value: "5678" },
    });
    clickButton("Continue");
    fireEvent.change(screen.getByTestId("recovery-confirm"), {
      target: { value: "5678" },
    });
    clickButton("Save");

    expect(await screen.findByTestId("screen-input")).toBeInTheDocument();

    typePin("1234");
    clickButton("=");
    await settle();
    expect(screen.queryByTestId("vault")).not.toBeInTheDocument();

    clickButton("AC");
    typePin("5678");
    clickButton("=");
    expect(await screen.findByTestId("vault")).toBeInTheDocument();
  });

  it("changes the PIN from settings and invalidates the old one", async () => {
    await createAuthRecord("1234", "ABCD-EFGH-JK23");
    render(<App />);

    typePin("1234");
    clickButton("=");
    await screen.findByTestId("vault");

    clickButton("Change PIN");
    expect(screen.getByTestId("vault-change-pin")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("vault-current-pin"), {
      target: { value: "1111" },
    });
    clickButton("Continue");
    expect(await screen.findByTestId("vault-error")).toHaveTextContent(
      "Wrong current PIN"
    );

    fireEvent.change(screen.getByTestId("vault-current-pin"), {
      target: { value: "1234" },
    });
    clickButton("Continue");
    expect(await screen.findByTestId("vault-new-pin")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("vault-new-pin"), {
      target: { value: "5678" },
    });
    clickButton("Continue");
    fireEvent.change(screen.getByTestId("vault-confirm-pin"), {
      target: { value: "5678" },
    });
    clickButton("Save");

    expect(await screen.findByTestId("vault")).toBeInTheDocument();

    clickButton("Lock now");
    typePin("1234");
    clickButton("=");
    await settle();
    expect(screen.queryByTestId("vault")).not.toBeInTheDocument();

    clickButton("AC");
    typePin("5678");
    clickButton("=");
    expect(await screen.findByTestId("vault")).toBeInTheDocument();
  });
});
