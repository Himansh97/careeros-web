"use client";

import * as React from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ApprovalCard } from "@/components/approvals/approval-card";
import { subscribeApprovals, getApprovalsSnapshot } from "@/lib/api/approvals";
import type { ApprovalItem, ApprovalKind } from "@/types/approval";

const isMockMode = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const tabs: { value: ApprovalKind; label: string }[] = [
  { value: "application", label: "Applications" },
  { value: "outreach", label: "Outreach" },
  { value: "question", label: "Questions" },
  { value: "sensitive", label: "Sensitive" },
];

export default function ApprovalsPage() {
  const allItems = React.useSyncExternalStore(
    subscribeApprovals,
    getApprovalsSnapshot,
    () => [] as ApprovalItem[]
  );

  if (!isMockMode()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Needs Your Attention"
          description="Applications, outreach, and sensitive questions that require your review before anything goes out."
        />
        <EmptyState
          icon={AlertCircle}
          title="Approval Center isn't connected"
          description="Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview this page with mock data."
          className="flex-1"
        />
      </div>
    );
  }

  const pending = allItems.filter((a) => a.status === "pending");
  const countByKind = (kind: ApprovalKind) => pending.filter((a) => a.kind === kind).length;

  if (pending.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Needs Your Attention" description="You're all caught up." />
        <EmptyState
          icon={ShieldCheck}
          title="Nothing needs your attention"
          description="Applications ready to submit, outreach ready to send, and questions CareerOS can't answer safely will show up here."
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Needs Your Attention"
        description={`${pending.length} item${pending.length === 1 ? "" : "s"} waiting on you.`}
      />

      <Tabs defaultValue={tabs.find((t) => countByKind(t.value) > 0)?.value ?? "application"}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              {countByKind(tab.value) > 0 && (
                <Badge variant="secondary" className="h-4 min-w-4 px-1 font-normal">
                  {countByKind(tab.value)}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => {
          const items = pending.filter((a) => a.kind === tab.value);
          return (
            <TabsContent key={tab.value} value={tab.value} className="space-y-3">
              {items.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title={`No ${tab.label.toLowerCase()} pending`}
                  description="Nothing in this category needs your attention right now."
                />
              ) : (
                items.map((item) => <ApprovalCard key={item.id} item={item} />)
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
