"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { useToast } from "@/components/ui/toast";
import { trpc } from "@/lib/trpc";
import { useUserStore } from "@/lib/stores/user-store";
import {
  Plus,
  Search,
  Building2,
  Pencil,
  Trash2,
  Inbox,
  Loader2,
  Globe,
  DollarSign,
  Calendar,
} from "lucide-react";

type PipelineStage =
  | "lead"
  | "contacted"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

const STAGE_BADGE_VARIANT: Record<PipelineStage, "secondary" | "default" | "warning" | "success" | "destructive"> = {
  lead: "secondary",
  contacted: "default",
  meeting: "warning",
  proposal: "default",
  negotiation: "warning",
  closed_won: "success",
  closed_lost: "destructive",
};

const PIPELINE_STAGES: PipelineStage[] = [
  "lead",
  "contacted",
  "meeting",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

interface ClientFormData {
  companyName: string;
  website: string;
  industry: string;
  pipelineStage: PipelineStage;
  dealValue: string;
  notes: string;
}

const emptyForm: ClientFormData = {
  companyName: "",
  website: "",
  industry: "",
  pipelineStage: "lead",
  dealValue: "",
  notes: "",
};

export default function ClientsPage() {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { toast } = useToast();
  const { isAuthenticated } = useUserStore();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);

  // --- tRPC queries ---
  const listQuery = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated && !searchQuery.trim(),
  });

  const searchQueryResult = trpc.clients.search.useQuery(
    { query: searchQuery.trim() },
    { enabled: isAuthenticated && searchQuery.trim().length > 0 }
  );

  const clients = searchQuery.trim()
    ? searchQueryResult.data ?? []
    : listQuery.data ?? [];

  const isLoading = searchQuery.trim()
    ? searchQueryResult.isLoading
    : listQuery.isLoading;

  // --- Mutations ---
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast(t("saveSuccess"), "success");
      closeForm();
      utils.clients.list.invalidate();
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast(t("saveSuccess"), "success");
      closeForm();
      utils.clients.list.invalidate();
      utils.clients.search.invalidate();
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast(t("deleteSuccess"), "success");
      setDeleteId(null);
      utils.clients.list.invalidate();
      utils.clients.search.invalidate();
    },
    onError: (err) => {
      toast(err.message, "error");
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // --- Currency formatter ---
  const formatCurrency = (value: string | null) => {
    const num = Number(value) || 0;
    if (num === 0) return "-";
    return new Intl.NumberFormat(
      locale === "zh-TW" ? "zh-TW" : locale === "ja" ? "ja-JP" : "en-US",
      {
        style: "currency",
        currency: locale === "zh-TW" ? "TWD" : locale === "ja" ? "JPY" : "USD",
        maximumFractionDigits: 0,
      }
    ).format(num);
  };

  // --- Date formatter ---
  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat(
      locale === "zh-TW" ? "zh-TW" : locale === "ja" ? "ja-JP" : "en-US",
      { month: "short", day: "numeric" }
    ).format(new Date(date));
  };

  // --- Stage options for Select ---
  const stageOptions = useMemo(
    () =>
      PIPELINE_STAGES.map((s) => ({
        value: s,
        label: t(`stages.${s}`),
      })),
    [t]
  );

  // --- Form handlers ---
  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (client: (typeof clients)[number]) => {
    setForm({
      companyName: client.companyName,
      website: client.website ?? "",
      industry: client.industry ?? "",
      pipelineStage: client.pipelineStage as PipelineStage,
      dealValue: client.dealValue ?? "",
      notes: client.notes ?? "",
    });
    setEditingId(client.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.companyName.trim()) return;

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        companyName: form.companyName.trim(),
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        pipelineStage: form.pipelineStage,
        dealValue: form.dealValue.trim() || null,
        notes: form.notes.trim() || null,
      });
    } else {
      createMutation.mutate({
        companyName: form.companyName.trim(),
        website: form.website.trim() || undefined,
        industry: form.industry.trim() || undefined,
        pipelineStage: form.pipelineStage,
        dealValue: form.dealValue.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  // --- Auth check ---
  if (!isAuthenticated) {
    return (
      <AppShell>
        <SignInPrompt />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">{t("title")}</h1>
          <Button onClick={openAddForm}>
            <Plus className="h-4 w-4" />
            {t("addClient")}
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-bg-card pl-10 pr-3 text-sm text-text placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-border-hover"
          />
        </div>

        {/* Client list */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-12 w-12 text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">{t("emptyState")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="group cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openEditForm(client)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Company name + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 shrink-0 text-primary" />
                      <h3 className="font-semibold text-text truncate">
                        {client.companyName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(client);
                        }}
                        className="rounded p-1 text-text-muted hover:bg-bg-muted hover:text-text transition-colors"
                        title={tc("edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(client.id);
                        }}
                        className="rounded p-1 text-text-muted hover:bg-danger-light hover:text-danger transition-colors"
                        title={tc("delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={STAGE_BADGE_VARIANT[client.pipelineStage as PipelineStage] ?? "secondary"}>
                      {t(`stages.${client.pipelineStage}`)}
                    </Badge>
                    {client.industry && (
                      <Badge variant="outline">{client.industry}</Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-text-secondary">
                    {client.dealValue && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatCurrency(client.dealValue)}</span>
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3" />
                        <span className="truncate">{client.website}</span>
                      </div>
                    )}
                    {client.lastContactAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {t("lastContact")}: {formatDate(client.lastContactAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onClose={closeForm}>
        <DialogHeader onClose={closeForm}>
          {editingId ? t("editClient") : t("addClient")}
        </DialogHeader>
        <div className="space-y-4">
          <Input
            label={t("companyName")}
            placeholder={t("companyName")}
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            required
          />
          <Input
            label={t("website")}
            placeholder="https://"
            type="url"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
          <Input
            label={t("industry")}
            placeholder={t("industry")}
            value={form.industry}
            onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
          />
          <Select
            label={t("stage")}
            options={stageOptions}
            value={form.pipelineStage}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                pipelineStage: e.target.value as PipelineStage,
              }))
            }
          />
          <Input
            label={t("dealValue")}
            placeholder="0"
            type="number"
            value={form.dealValue}
            onChange={(e) => setForm((f) => ({ ...f, dealValue: e.target.value }))}
          />
          <Textarea
            label={t("notes")}
            placeholder={t("notes")}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeForm}>
              {tc("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.companyName.trim() || isMutating}
            >
              {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
              {tc("save")}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogHeader onClose={() => setDeleteId(null)}>
          {t("deleteClient")}
        </DialogHeader>
        <p className="text-sm text-text-secondary mb-6">{t("deleteConfirm")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            {tc("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {tc("delete")}
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
