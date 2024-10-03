import { BaseType } from "./base-type";
import { FileType } from "./enums/file-type";

export interface Document extends BaseType {
  id: string;
  documentType: DocumentType;
  title: string;
  fileType: FileType;
  projectId: string; //FK to Project
}
