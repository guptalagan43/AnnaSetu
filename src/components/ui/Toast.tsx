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

export const toast = {
  success: (options: ToastOptions) => 
    sonnerToast.success(options.title, {
      description: options.description,
      action: options.action,
    }),
  
  error: (options: ToastOptions) => 
    sonnerToast.error(options.title, {
      description: options.description,
      action: options.action,
    }),
  
  warning: (options: ToastOptions) => 
    sonnerToast.warning(options.title, {
      description: options.description,
      action: options.action,
    }),
  
  info: (options: ToastOptions) => 
    sonnerToast.info(options.title, {
      description: options.description,
      action: options.action,
    }),
  
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