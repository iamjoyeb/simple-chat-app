import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createAuthRecord } from "../helpers/auth";
import { Calculator } from "./Calculator";

const button = (name: string) => screen.getByRole("button", { name });
const clickButton = (name: string) => fireEvent.click(button(name));
const typePin = (pin: string) => pin.split("").forEach(clickButton);

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

describe("<Calculator /> PIN unlock", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("unlocks when the typed value matches the stored PIN", async () => {
    await createAuthRecord("1234", "ABCD-EFGH-JK23");
    const onUnlock = jest.fn();
    render(<Calculator onUnlock={onUnlock} />);

    typePin("1234");
    clickButton("=");

    await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1));
  });

  it("stays locked and does normal math for a wrong PIN", async () => {
    await createAuthRecord("1234", "ABCD-EFGH-JK23");
    const onUnlock = jest.fn();
    render(<Calculator onUnlock={onUnlock} />);

    typePin("9999");
    clickButton("=");
    await settle();

    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.getByTestId("screen-input")).toHaveValue("9,999");
  });

  it("does not run the PIN check for normal calculations", async () => {
    await createAuthRecord("1234", "ABCD-EFGH-JK23");
    const onUnlock = jest.fn();
    render(<Calculator onUnlock={onUnlock} />);

    clickButton("9");
    clickButton("+");
    clickButton("6");
    clickButton("=");
    await settle();

    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.getByTestId("screen-input")).toHaveValue("15");
  });

  it("stays locked when no PIN record exists", async () => {
    const onUnlock = jest.fn();
    render(<Calculator onUnlock={onUnlock} />);

    typePin("1234");
    clickButton("=");
    await settle();

    expect(onUnlock).not.toHaveBeenCalled();
  });

  it("long-press H opens recovery without toggling history", async () => {
    const onRecover = jest.fn();
    render(<Calculator onRecover={onRecover} />);

    fireEvent.pointerDown(button("H"));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(onRecover).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("History")).not.toBeInTheDocument();
  });

  it("short-press H still toggles history", () => {
    render(<Calculator />);

    clickButton("H");
    expect(screen.getByText("History")).toBeInTheDocument();
    clickButton("H");
    expect(screen.queryByText("History")).not.toBeInTheDocument();
  });
});
