export interface IButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: "default" | "number" | "operator";
  isActive?: boolean;
  onLongPress?: () => void;
}

export interface INumericKeypadProps {
  handleOnClick: (value: string) => void;
  handleOnLongPress?: (value: string) => void;
  isAllClear: boolean;
  operator: "" | "+" | "-" | "x" | "/";
}
