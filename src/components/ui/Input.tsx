import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
  children: React.ReactNode;
};

export function Input({ className = "", ...props }: InputProps) {
  return <input className={className} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaProps) {
  return <textarea className={className} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select className={className} {...props}>
      {children}
    </select>
  );
}
