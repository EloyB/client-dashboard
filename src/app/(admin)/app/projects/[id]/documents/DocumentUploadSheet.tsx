'use client';

import { Loader2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FileUploadField, type FileUploadCallback } from '@/components/shared/FileUpload';
import { FormSheet } from '@/components/shared/FormSheet';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import type { DocumentType } from '@/db/schema';
import { createDocument } from '@/features/documents/actions';
import { uploadLimits } from '@/features/files/schemas';
import { uploadViaPresignedUrl } from '@/features/files/uploadViaPresignedUrl';

const documentAccept = uploadLimits.document.mimeTypes.join(',');

const documentTypeOptions: { value: DocumentType; label: string }[] = [
  { value: 'invoice', label: 'Factuur' },
  { value: 'quote', label: 'Offerte' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Andere' },
];

/** Drops the extension for a sensible default title ("factuur-2026.pdf" -> "factuur-2026"). */
function titleFromFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^./]+$/, '');
  return withoutExtension || filename;
}

type UploadedFile = { fileId: string; filename: string };

function emptyForm(): { type: DocumentType; title: string; visibleToClient: boolean } {
  return { type: 'other', title: '', visibleToClient: true };
}

export function DocumentUploadSheet({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uploaderKey, setUploaderKey] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  function resetForNextUpload() {
    setUploaded(null);
    setForm(emptyForm());
    setUploaderKey((key) => key + 1);
  }

  const handleUpload: FileUploadCallback = async (file, onProgress, signal) => {
    const fileId = await uploadViaPresignedUrl(file, onProgress, signal, projectId, 'document');
    setUploaded({ fileId, filename: file.name });
    setForm((current) => ({ ...current, title: current.title || titleFromFilename(file.name) }));
  };

  async function handleSave() {
    if (!uploaded) return;
    setIsSaving(true);
    try {
      const result = await createDocument({
        projectId,
        fileId: uploaded.fileId,
        title: form.title,
        type: form.type,
        visibleToClient: form.visibleToClient,
      });

      if (!result.success) {
        showErrorToast(
          'Document opslaan mislukt',
          result.formError ?? Object.values(result.fieldErrors)[0]?.[0],
        );
        return;
      }

      showSuccessToast('Document toegevoegd');
      router.refresh();
      resetForNextUpload();
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForNextUpload();
    onOpenChange(next);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Document uploaden"
      description="Bestanden blijven staan als zichtbaar voor de klant, tenzij u dat hieronder uitzet."
      primaryAction={
        <Button type="button" onClick={handleSave} disabled={!uploaded || isSaving || !form.title}>
          {isSaving ? <Loader2 className="animate-spin" strokeWidth={1.75} /> : <Upload />}
          Document opslaan
        </Button>
      }
    >
      <FileUploadField
        key={uploaderKey}
        label="Bestand"
        hint="PDF, afbeelding of Office-bestand, max. 20 MB"
        accept={documentAccept}
        onUpload={handleUpload}
      />

      {uploaded && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="document-title">Titel</Label>
            <Input
              id="document-title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="document-type">Soort</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, type: value as DocumentType }))
              }
            >
              <SelectTrigger id="document-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-border flex items-start justify-between gap-3 rounded-lg border p-3">
            <div>
              <Label htmlFor="document-visible">Zichtbaar voor klant</Label>
              <p className="text-small text-muted-foreground">
                {form.visibleToClient
                  ? 'De klant kan dit document zien en downloaden in het portaal.'
                  : 'Enkel zichtbaar voor jou, niet voor de klant.'}
              </p>
            </div>
            <Switch
              id="document-visible"
              checked={form.visibleToClient}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, visibleToClient: checked }))
              }
            />
          </div>
        </>
      )}
    </FormSheet>
  );
}
