"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface MetadataContextType {
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export function MetadataProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("TuitionHub");
  const [description, setDescription] = useState(
    "The ultimate tool for modern educators to manage tuition centers, students, and fees."
  );

  const formattedTitle = title.includes("TuitionHub") ? title : `${title} | TuitionHub`;

  return (
    <MetadataContext.Provider value={{ setTitle, setDescription }}>
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      {children}
    </MetadataContext.Provider>
  );
}

export function useMetadata() {
  const context = useContext(MetadataContext);
  if (context === undefined) {
    throw new Error("useMetadata must be used within a MetadataProvider");
  }
  return context;
}
