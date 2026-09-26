import React, { FC, useState } from "react";
import { CalculationHistory } from "../components/CalculationHistory";
import { NumericKeypad } from "../components/NumericKeypad";
import { Screen } from "../components/Screen/Screen";
import { verifyPin } from "../helpers/auth";
import { formattedValue } from "../helpers/mix";
import { useCalculator } from "../hooks/calculator";
import "./Calculator.css";

export interface ICalculatorProps {
  onUnlock?: () => void;
  onRecover?: () => void;
}

export const Calculator: FC<ICalculatorProps> = ({
  onUnlock,
  onRecover,
}) => {
  const {
    calculationState,
    displayValue,
    inputEqual,
    inputNumber,
    inputOperator,
    inputDot,
    toggleSign,
    clear,
    isAllClear,
  } = useCalculator();

  const [isShowHistory, setIsShowHistory] = useState(false);

  const onClickKeypad = (key: string) => {
    switch (key) {
      case "C":
      case "AC":
        clear(key);
        break;
      case "=":
        handleEqual();
        break;
      case "+":
      case "-":
      case "x":
      case "/":
        inputOperator(key);
        break;
      case "±":
        toggleSign();
        break;
      case ".":
        inputDot();
        break;
      case "H":
        setIsShowHistory((prev) => !prev);
        break;
      default:
        inputNumber(key);
    }
  };

  const handleEqual = async () => {
    const { firstOperand, secondOperand, operator } = calculationState;

    if (operator === "" && secondOperand === "") {
      if (onUnlock && (await verifyPin(firstOperand))) {
        onUnlock();
      }
      return;
    }

    inputEqual();
  };

  const onLongPressKeypad = (key: string) => {
    if (key === "H") {
      onRecover?.();
    }
  };

  return (
    <div className="calculator-container">
      <Screen
        className="calculator-screen"
        displayValue={formattedValue(displayValue)}
      />
      <NumericKeypad
        handleOnClick={onClickKeypad}
        handleOnLongPress={onLongPressKeypad}
        operator={calculationState.operator}
        isAllClear={isAllClear()}
      />
      {isShowHistory && (
        <CalculationHistory className="calculation-history-class" />
      )}
    </div>
  );
};
