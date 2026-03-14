"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ConversationWithTag } from "@/lib/types/messaging";

interface ConversationDetailRowProps {
  conversation: ConversationWithTag;
}

export function ConversationDetailRow({ conversation }: ConversationDetailRowProps) {
  const c = conversation;

  const leadName = [c.lead_first_name, c.lead_last_name].filter(Boolean).join(" ");

  // Parse custom_fields
  let customEntries: [string, string][] = [];
  if (c.custom_fields) {
    if (typeof c.custom_fields === "object" && "raw" in c.custom_fields) {
      // Try parsing the raw string as JSON
      try {
        const parsed = JSON.parse(c.custom_fields.raw as string);
        if (typeof parsed === "object" && parsed !== null) {
          customEntries = Object.entries(parsed).map(([k, v]) => [k, String(v)]);
        }
      } catch {
        // Not JSON, show as-is
        customEntries = [["Data", c.custom_fields.raw as string]];
      }
    } else {
      customEntries = Object.entries(c.custom_fields).map(([k, v]) => [k, String(v)]);
    }
  }

  return (
    <div className="grid gap-6 p-4 md:grid-cols-3 bg-muted/30 border-t">
      {/* Lead Info */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Lead Info</h4>
        {leadName && <p className="text-sm">{leadName}</p>}
        {c.lead_position && (
          <p className="text-xs text-muted-foreground">{c.lead_position}</p>
        )}
        {c.lead_company && (
          <p className="text-xs text-muted-foreground">{c.lead_company}</p>
        )}
        {c.lead_location && (
          <p className="text-xs text-muted-foreground">{c.lead_location}</p>
        )}
        {c.lead_profile_url && (
          <a
            href={c.lead_profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            LinkedIn Profile
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Messages</h4>

        {c.first_outbound_message && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">First Outbound</p>
            <p className="text-xs bg-background rounded p-2 border leading-relaxed">
              {c.first_outbound_message}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">First Reply</p>
          {c.first_inbound_reply ? (
            <p className="text-xs bg-blue-50 dark:bg-blue-950 rounded p-2 border border-blue-200 dark:border-blue-800 leading-relaxed">
              {c.first_inbound_reply}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">No reply</p>
          )}
        </div>

        {c.last_message_text &&
          c.last_message_text !== c.first_outbound_message &&
          c.last_message_text !== c.first_inbound_reply && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Last Message</p>
              <p className="text-xs bg-background rounded p-2 border leading-relaxed">
                {c.last_message_text}
              </p>
            </div>
          )}
      </div>

      {/* Metadata + Custom Fields */}
      <div className="space-y-3">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Metadata</h4>
          <div className="space-y-1 text-xs">
            {c.conversation_depth_category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depth</span>
                <Badge variant="outline" className="text-xs">
                  {c.conversation_depth_category}
                </Badge>
              </div>
            )}
            {c.sender_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sender</span>
                <span>{c.sender_name}</span>
              </div>
            )}
            {c.sender_email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="truncate ml-2">{c.sender_email}</span>
              </div>
            )}
          </div>
        </div>

        {customEntries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Custom Fields</h4>
            <div className="space-y-1 text-xs">
              {customEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="truncate ml-2">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {customEntries.length === 0 && !c.custom_fields && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Custom Fields</h4>
            <p className="text-xs text-muted-foreground italic">No additional data</p>
          </div>
        )}
      </div>
    </div>
  );
}
