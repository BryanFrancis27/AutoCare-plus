import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, children, className = "" }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}
