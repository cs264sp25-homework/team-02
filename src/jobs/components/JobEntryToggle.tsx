import { ToggleGroup, ToggleGroupItem } from "@/core/components/toggle-group";
import React from "react";

interface JobEntryToggleProps {
  mode: "manual" | "import";
  setMode: (value: "manual" | "import") => void;
}

const JobEntryToggle: React.FC<JobEntryToggleProps> = ({ mode, setMode }) => {
  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(val) => {
        if (val) setMode(val as "manual" | "import");
      }}
      className="mb-6"
    >
      <ToggleGroupItem value="import">Import Job from Links</ToggleGroupItem>
      <ToggleGroupItem value="manual">Input Job Details Myself</ToggleGroupItem>
    </ToggleGroup>
  );
};

export default JobEntryToggle;
