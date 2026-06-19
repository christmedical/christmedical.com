import type { ReactNode } from "react";
import {
  FC_BTN_PRIMARY,
  FC_BTN_SECONDARY,
  FC_CHIP,
  FC_CHIP_ACTIVE,
  FC_FIELD_LABEL,
  FC_INPUT,
  FC_SECTION_LABEL,
  FC_SURFACE,
  FC_SURFACE_BODY,
  FC_SURFACE_HEADER,
  FC_TEXTAREA,
} from "@/components/design/fieldClinical";

export function FcSectionLabel({ children }: { children: ReactNode }) {
  return <span className={FC_SECTION_LABEL}>{children}</span>;
}

export function FcFieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={FC_FIELD_LABEL}>
      {children}
    </label>
  );
}

export function FcCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${FC_SURFACE} ${className}`}>
      <div className={FC_SURFACE_HEADER}>{title}</div>
      <div className={FC_SURFACE_BODY}>{children}</div>
    </section>
  );
}

export function FcChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? FC_CHIP_ACTIVE : FC_CHIP}
    >
      {children}
    </button>
  );
}

export function FcButtonPrimary({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${FC_BTN_PRIMARY} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function FcButtonSecondary({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${FC_BTN_SECONDARY} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function FcInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={FC_INPUT} {...props} />;
}

export function FcTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={FC_TEXTAREA} {...props} />;
}
