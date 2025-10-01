"use client";

import * as React from "react";

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number;
}

function AspectRatio({
  ratio = 1,
  className,
  style,
  ...props
}: AspectRatioProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${100 / ratio}%`,
        ...style,
      }}
      {...props}
    />
  );
}

export { AspectRatio };