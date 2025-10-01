"use client";

import * as React from "react";

interface ToasterProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  richColors?: boolean;
  closeButton?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

const Toaster = ({ position = 'bottom-right', richColors = false, closeButton = false, ...props }: ToasterProps) => {
  return null; // Минимальная реализация для предотвращения ошибок
};

export { Toaster };
