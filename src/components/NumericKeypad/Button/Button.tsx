import React, { FC, useRef } from "react";
import { IButtonProps } from "../types";
import "./Button.css";

const LONG_PRESS_DURATION = 500;

export const Button: FC<IButtonProps> = ({
  className,
  children,
  isActive,
  type = "default",
  onLongPress,
  onClick,
  ...buttonProps
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressTriggeredRef = useRef(false);

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const resetLongPress = () => {
    cancelLongPress();
    longPressTriggeredRef.current = false;
  };

  const handlePointerDown = () => {
    resetLongPress();

    if (!onLongPress) {
      return;
    }

    timerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress();
    }, LONG_PRESS_DURATION);
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    cancelLongPress();

    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    onClick?.(event);
  };

  const handleContextMenu: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    if (onLongPress) {
      event.preventDefault();
    }
  };

  const setButtonType = `button-${type}`;
  const buttonClass = `button-container ${
    setButtonType + (isActive ? "-active" : "")
  } ${className}`;

  return (
    <button
      className={buttonClass}
      {...buttonProps}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={handleContextMenu}
    >
      {children}
    </button>
  );
};
