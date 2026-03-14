"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConversationDetailRow } from "@/components/conversation-detail-row";
import { ChevronDown, ChevronUp, MessageSquare, ExternalLink } from "lucide-react";
import type { AMNotableConversation } from "@/lib/types/am-summary";
import type { ReplyCategory } from "@/lib/types/messaging";

interface AMNotableConversationsProps {
  conversations: AMNotableConversation[];
  workspace: string;
}

const categoryColors: Record<ReplyCategory, string> = {
  interested: "bg-emerald-100 text-emerald-800 border-emerald-200",
  objection: "bg-orange-100 text-orange-800 border-orange-200",
  not_now: "bg-yellow-100 text-yellow-800 border-yellow-200",
  wrong_person: "bg-gray-100 text-gray-800 border-gray-200",
  not_interested: "bg-red-100 text-red-800 border-red-200",
  referral: "bg-blue-100 text-blue-800 border-blue-200",
};

const categoryLabels: Record<ReplyCategory, string> = {
  interested: "Interested",
  objection: "Objection",
  not_now: "Not Now",
  wrong_person: "Wrong Person",
  not_interested: "Not Interested",
  referral: "Referral",
};

function ConversationRow({ conversation }: { conversation: AMNotableConversation }) {
  const [isOpen, setIsOpen] = useState(false);

  const truncatedMessage =
    conversation.lastMessagePreview && conversation.lastMessagePreview.length > 100
      ? conversation.lastMessagePreview.substring(0, 100) + "..."
      : conversation.lastMessagePreview;

  const formattedDate = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3 border-b last:border-b-0"
          aria-label={`Toggle details for ${conversation.leadName}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {conversation.leadName || "Unknown Lead"}
              </span>
              {conversation.tagCategory && (
                <Badge
                  variant="outline"
                  className={`text-xs ${categoryColors[conversation.tagCategory]}`}
                >
                  {categoryLabels[conversation.tagCategory]}
                </Badge>
              )}
              {conversation.isNotable && !conversation.tagCategory && (
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                  Notable
                </Badge>
              )}
              {conversation.conversationDepthCategory && (
                <Badge variant="outline" className="text-xs">
                  {conversation.conversationDepthCategory}
                </Badge>
              )}
            </div>
            {(conversation.leadPosition || conversation.leadCompany) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {[conversation.leadPosition, conversation.leadCompany]
                  .filter(Boolean)
                  .join(" at ")}
              </p>
            )}
            {truncatedMessage && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {truncatedMessage}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {formattedDate && (
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            )}
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ConversationDetailRow conversation={conversation.fullConversation} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AMNotableConversations({
  conversations,
  workspace,
}: AMNotableConversationsProps) {
  if (conversations.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notable Conversations</h3>
        <Card>
          <CardContent className="py-8 text-center">
            <MessageSquare
              className="h-8 w-8 text-muted-foreground mx-auto mb-2"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Keine bemerkenswerten Conversations diese Woche
            </p>
            <Link
              href={`/dashboard/messaging`}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2"
            >
              Messaging Insights ansehen
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Notable Conversations
          <Badge variant="secondary" className="ml-2">
            {conversations.length}
          </Badge>
        </h3>
        {conversations.length >= 10 && (
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/dashboard/messaging?workspace=${encodeURIComponent(workspace)}`}
              className="gap-1"
            >
              Alle anzeigen
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {conversations.map((c) => (
            <ConversationRow key={c.conversationId} conversation={c} />
          ))}
          {conversations.length >= 10 && (
            <div className="px-4 py-3 border-t bg-muted/30 text-center">
              <Link
                href={`/dashboard/messaging?workspace=${encodeURIComponent(workspace)}`}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                Alle Conversations anzeigen
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
