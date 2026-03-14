"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Flag } from "@/lib/types/flags";
import { FLAG_TYPE_LABELS } from "@/lib/types/flags";

interface AcknowledgeFlagDialogProps {
  flag: Flag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (flagId: string, note: string) => void;
  isSubmitting: boolean;
}

export function AcknowledgeFlagDialog({
  flag,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: AcknowledgeFlagDialogProps) {
  const [note, setNote] = useState("");

  function handleConfirm() {
    if (!flag) return;
    onConfirm(flag.id, note);
    setNote("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setNote("");
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acknowledge Flag</DialogTitle>
          <DialogDescription>
            {flag
              ? `Acknowledge the "${FLAG_TYPE_LABELS[flag.flag_type]}" flag for ${flag.workspace}. Optionally add a note about actions taken.`
              : "Acknowledge this flag."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="acknowledge-note">Note (optional)</Label>
            <Textarea
              id="acknowledge-note"
              placeholder="e.g., Investigating low reply rate, will adjust messaging..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground text-right">
              {note.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Acknowledging..." : "Acknowledge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
