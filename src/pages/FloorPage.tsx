import React from "react";
import { FloorProvider, FloorView } from "../features/floor";

export function FloorPage() {
  return (
    <FloorProvider>
      <FloorView />
    </FloorProvider>
  );
}

export default FloorPage;
