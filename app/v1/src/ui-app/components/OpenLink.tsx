import { type ButtonVariant, buttonClass, Icon } from "design-system/react";
import type { ReactNode } from "react";

/**
 * A link that opens a deck in a new tab and looks like the design system's
 * button: its own `buttonClass` and arrow icon, because the React `Button`
 * takes no `target`.
 */
export function OpenLink({
  href,
  variant = "secondary",
  size = "sm",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  children: ReactNode;
}) {
  return (
    <a className={buttonClass({ variant, size })} href={href} target="_blank" rel="noreferrer">
      <span className="ds-button__label">{children}</span>
      <Icon name="arrow-up-right" size={size === "sm" ? "sm" : "md"} />
    </a>
  );
}
