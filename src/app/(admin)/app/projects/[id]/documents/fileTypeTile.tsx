const labelByMimeType: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLS',
};

/** Small type-tile leading a document row (see COMPONENTS.md "Lijstrijvarianten"). */
export function fileTypeTile(mimeType: string) {
  return (
    <div className="text-small text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 font-medium">
      {labelByMimeType[mimeType] ?? 'BESTAND'}
    </div>
  );
}
