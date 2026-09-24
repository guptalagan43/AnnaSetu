"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="light"
      className="font-body"
      toastOptions={{
        classNames: {
          toast: "brutal-card bg-brand-cream border-brand-black shadow-brutal",
          title: "font-display font-bold text-brand-black",
          description: "font-body text-brand-black",
          closeButton: "text-brand-black hover:text-brand-red",
          actionButton: "btn-secondary text-xs",
          cancelButton: "btn-ghost text-xs",
        },
      }}
    />
  );
}

export interface ToastOptions {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ToastInput = string | ToastOptions;

function normalizeOptions(input: ToastInput): ToastOptions {
  return typeof input === "string" ? { title: input } : input;
}

export const toast = {
  success: (input: ToastInput) => {
    const opts = normalizeOptions(input);
    return sonnerToast.success(opts.title, {
      description: opts.description,
      action: opts.action,
    });
  },

  error: (input: ToastInput) => {
    const opts = normalizeOptions(input);
    return sonnerToast.error(opts.title, {
      description: opts.description,
      action: opts.action,
    });
  },

  warning: (input: ToastInput) => {
    const opts = normalizeOptions(input);
    return sonnerToast.warning(opts.title, {
      description: opts.description,
      action: opts.action,
    });
  },

  info: (input: ToastInput) => {
    const opts = normalizeOptions(input);
    return sonnerToast.info(opts.title, {
      description: opts.description,
      action: opts.action,
    });
  },
  
  loading: (title: string) => 
    sonnerToast.loading(title),
  
  dismiss: (toastId: string | number) => 
    sonnerToast.dismiss(toastId),
  
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((value: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => 
    sonnerToast.promise(promise, messages),
};