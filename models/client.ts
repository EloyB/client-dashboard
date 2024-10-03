import { BaseType } from "./base-type";
import { DefaultTableKeys } from "./enums/default-table-keys";
import { Project } from "./project";

export interface Client extends BaseType {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  vatNumber: string;
  logoUri?: string;
  language?: string;
  balance?: number;

  projects?: Project[];
}

export const ClientKeys = {
  Id: "id",
  Name: "name",
  Email: "email",
  Phone: "phone",
  Address: "address",
  VatNumber: "vatNumber",
  LogoUri: "logoUri",
  Language: "language",
  Balance: "balance",
  Projects: "projects",
  ...DefaultTableKeys,
};
