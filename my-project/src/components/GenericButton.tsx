import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { NavLink, type NavLinkProps } from "react-router-dom";

type ButtonVariant = "create" | "danger" | "accent" | "olive" | "neutral" | "outline" | "plain";

type SharedProps = {
  label: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  className?: string;
};

type ButtonProps = SharedProps & {
  to?: never;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  disabled?: boolean;
  disabledCursor?: "not-allowed" | "wait";
};

type LinkProps = SharedProps & {
  to: string;
  state?: NavLinkProps["state"];
  onClick?: never;
  type?: never;
  disabled?: never;
  disabledCursor?: never;
};

type GenericButtonProps = ButtonProps | LinkProps;

// Shared dimensions and alignment for the solid and neutral button variants.
const standardVariantClasses = "min-h-10 justify-center px-4 py-2";
// Shared foreground color for filled action buttons.
const filledVariantTextClassName = "text-white";
// Shared removal of shadows for understated button variants.
const noShadowClassName = "shadow-none";

const variantClasses: Record<ButtonVariant, string> = {
  create: `${standardVariantClasses} bg-action-create ${filledVariantTextClassName} hover:bg-action-create-hover`,
  danger: `${standardVariantClasses} bg-action-danger ${filledVariantTextClassName} hover:bg-action-danger-hover`,
  accent: `${standardVariantClasses} bg-brand-tomato ${filledVariantTextClassName} hover:bg-brand-tomato-hover`,
  olive: `${standardVariantClasses} bg-brand-olive ${filledVariantTextClassName} hover:bg-brand-forest`,
  neutral: `${standardVariantClasses} border border-app-border bg-app-surface text-app-ink ${noShadowClassName} hover:bg-app-border-soft`,
  outline: `justify-center border border-brand-tomato bg-transparent px-2 py-1 text-brand-tomato ${noShadowClassName} hover:bg-brand-tomato hover:text-white`,
  plain: `justify-start bg-transparent px-0 py-0 text-app-ink ${noShadowClassName} hover:bg-app-row-hover`,
};

const baseClasses =
  "inline-flex cursor-pointer items-center gap-2 rounded-md text-center text-sm font-medium transition-colors duration-200";

export default function GenericButton(props: GenericButtonProps) {
  const { label, variant = "create", icon, className = "" } = props;
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  const content = (
    <>
      {icon}
      <span>{label}</span>
    </>
  );

  if ("to" in props && props.to) {
    return (
      <NavLink to={props.to} state={props.state} className={classes}>
        {content}
      </NavLink>
    );
  }

  const disabledCursorClass =
    props.disabledCursor === "wait" ? "disabled:cursor-wait" : "disabled:cursor-not-allowed";

  return (
    <button
      type={props.type ?? "button"}
      className={`${classes} enabled:cursor-pointer disabled:opacity-50 ${disabledCursorClass}`}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {content}
    </button>
  );
}
