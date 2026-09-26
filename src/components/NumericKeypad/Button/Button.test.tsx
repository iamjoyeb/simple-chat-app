import { act, render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "./Button";

describe("<Button />", () => {
  it("renders default button", () => {
    render(<Button>C</Button>);

    const defaultButtonElement = screen.getByRole("button", { name: "C" });

    expect(defaultButtonElement).toBeInTheDocument();
    expect(
      defaultButtonElement.className.includes("button-container button-default")
    ).toEqual(true);
  });

  it("default button is active", () => {
    render(<Button isActive>C</Button>);

    const defaultButtonElement = screen.getByRole("button", { name: "C" });

    expect(defaultButtonElement).toBeInTheDocument();
    expect(
      defaultButtonElement.className.includes("button-default-active")
    ).toEqual(true);
  });

  it("renders number button", () => {
    render(<Button type="number">5</Button>);

    const defaultButtonElement = screen.getByRole("button", { name: "5" });

    expect(defaultButtonElement).toBeInTheDocument();
    expect(
      defaultButtonElement.className.includes("button-container button-number")
    ).toEqual(true);
  });

  it("number button is active", () => {
    render(
      <Button isActive type="number">
        5
      </Button>
    );

    const defaultButtonElement = screen.getByRole("button", { name: "5" });

    expect(defaultButtonElement).toBeInTheDocument();
    expect(
      defaultButtonElement.className.includes("button-number-active")
    ).toEqual(true);
  });

  it("renders operator button", () => {
    render(<Button type="operator">x</Button>);

    const defaultButtonElement = screen.getByRole("button", { name: "x" });

    expect(defaultButtonElement).toBeInTheDocument();
    expect(
      defaultButtonElement.className.includes(
        "button-container button-operator"
      )
    ).toEqual(true);
  });

  it("operator button is active", () => {
    render(
      <Button isActive type="operator">
        x
      </Button>
    );

    const defaultButtonElement = screen.getByRole("button", { name: "x" });

    expect(defaultButtonElement).toBeInTheDocument();
    expect(
      defaultButtonElement.className.includes("button-operator-active")
    ).toEqual(true);
  });

  describe("long press", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const renderLongPressButton = () => {
      const onLongPress = jest.fn();
      const onClick = jest.fn();

      render(
        <Button onLongPress={onLongPress} onClick={onClick}>
          H
        </Button>
      );

      return {
        onLongPress,
        onClick,
        buttonElement: screen.getByRole("button", { name: "H" }),
      };
    };

    it("fires onLongPress after the threshold and swallows the click", () => {
      const { onLongPress, onClick, buttonElement } = renderLongPressButton();

      fireEvent.pointerDown(buttonElement);
      act(() => {
        jest.advanceTimersByTime(499);
      });
      expect(onLongPress).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onLongPress).toHaveBeenCalledTimes(1);

      fireEvent.click(buttonElement);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("triggers a normal click when released before the threshold", () => {
      const { onLongPress, onClick, buttonElement } = renderLongPressButton();

      fireEvent.pointerDown(buttonElement);
      act(() => {
        jest.advanceTimersByTime(300);
      });
      fireEvent.pointerUp(buttonElement);
      fireEvent.click(buttonElement);

      expect(onLongPress).not.toHaveBeenCalled();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("cancels the long press when the pointer leaves", () => {
      const { onLongPress, onClick, buttonElement } = renderLongPressButton();

      fireEvent.pointerDown(buttonElement);
      act(() => {
        jest.advanceTimersByTime(300);
      });
      fireEvent.pointerLeave(buttonElement);
      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();

      fireEvent.click(buttonElement);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("behaves like a normal button when onLongPress is not provided", () => {
      const onClick = jest.fn();
      render(<Button onClick={onClick}>H</Button>);
      const buttonElement = screen.getByRole("button", { name: "H" });

      fireEvent.pointerDown(buttonElement);
      act(() => {
        jest.advanceTimersByTime(600);
      });
      fireEvent.click(buttonElement);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
