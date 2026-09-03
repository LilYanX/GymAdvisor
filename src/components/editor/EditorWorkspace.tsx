"use client";

import { useEffect, useState } from "react";
import type { EditorData } from "@/lib/editor-types";
import type { Exercise } from "@/lib/supabase/models";
import { ProgramEditor } from "@/components/editor/ProgramEditor";
import {
  SubProgramEditor,
  type SavedTemplate,
} from "@/components/editor/SubProgramEditor";

type TabId = "program" | "subprogram";

export function EditorWorkspace({
  data,
  templates: initialTemplates,
  library,
}: {
  data: EditorData;
  templates: SavedTemplate[];
  library: Exercise[];
}) {
  const [tab, setTab] = useState<TabId>("program");
  const [templates, setTemplates] = useState(initialTemplates);

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-ga-border px-6 py-2">
        <div className="flex w-full gap-1 rounded-lg border border-ga-border bg-ga-card p-1">
          <button
            type="button"
            onClick={() => setTab("program")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              tab === "program"
                ? "bg-ga-lime text-black"
                : "text-ga-muted hover:text-ga-fg"
            }`}
          >
            Programme
          </button>
          <button
            type="button"
            onClick={() => setTab("subprogram")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              tab === "subprogram"
                ? "bg-ga-lime text-black"
                : "text-ga-muted hover:text-ga-fg"
            }`}
          >
            Sous-programme
          </button>
        </div>
      </div>
      {tab === "program" ? (
        <ProgramEditor data={data} templates={templates} />
      ) : (
        <SubProgramEditor
          library={library}
          templates={templates}
          onTemplatesChange={setTemplates}
        />
      )}
    </div>
  );
}
