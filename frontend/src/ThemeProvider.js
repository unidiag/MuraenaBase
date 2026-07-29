import React from "react";

import ThemeCustomization from "theme";

export default function ThemeModeProvider({ children }) {
  return (
    <ThemeCustomization>
      {children}
    </ThemeCustomization>
  );
}