"use client";

import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

type PipelineStage =
  | "lead"
  | "contacted"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

const STAGE_BADGE_VARIANT: Record<string, "secondary" | "default" | "warning" | "success" | "destructive"> = {
  lead: "secondary",
  contacted: "default",
  meeting: "warning",
  proposal: "default",
  negotiation: "warning",
  closed_won: "success",
  closed_lost: "destructive",
};

interface ClientRow {
  id: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  pipelineStage: string;
  dealValue: string | null;
  lastContactAt: string | Date | null;
  notes: string | null;
}

interface ClientTableProps<T extends ClientRow> {
  clients: T[];
  onEdit: (client: T) => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: string | null) => string;
  formatDate: (date: string | Date | null) => string;
  translations: {
    company: string;
    industry: string;
    stage: string;
    dealValue: string;
    lastContact: string;
    actions: string;
    stages: Record<string, string>;
    editTitle: string;
    deleteTitle: string;
  };
}

export function ClientTable<T extends ClientRow>({
  clients,
  onEdit,
  onDelete,
  formatCurrency,
  formatDate,
  translations,
}: ClientTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg-muted text-text-secondary text-xs uppercase">
            <th className="px-4 py-3 text-left font-medium">{translations.company}</th>
            <th className="px-4 py-3 text-left font-medium">{translations.industry}</th>
            <th className="px-4 py-3 text-left font-medium">{translations.stage}</th>
            <th className="px-4 py-3 text-right font-medium">{translations.dealValue}</th>
            <th className="px-4 py-3 text-left font-medium">{translations.lastContact}</th>
            <th className="px-4 py-3 text-right font-medium">{translations.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {clients.map((client) => (
            <tr
              key={client.id}
              className="hover:bg-bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onEdit(client)}
            >
              <td className="px-4 py-3 font-medium text-text">{client.companyName}</td>
              <td className="px-4 py-3 text-text-secondary">{client.industry ?? "-"}</td>
              <td className="px-4 py-3">
                <Badge variant={STAGE_BADGE_VARIANT[client.pipelineStage] ?? "secondary"}>
                  {translations.stages[client.pipelineStage] ?? client.pipelineStage}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right text-text-secondary">
                {formatCurrency(client.dealValue)}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {formatDate(client.lastContactAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(client);
                    }}
                    className="rounded p-1.5 text-text-muted hover:bg-bg-muted hover:text-text transition-colors"
                    title={translations.editTitle}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(client.id);
                    }}
                    className="rounded p-1.5 text-text-muted hover:bg-danger-light hover:text-danger transition-colors"
                    title={translations.deleteTitle}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
