"use client";

import { createContext, useContext } from "react";

import type { Tenant } from "../types";

const TenantContext = createContext<Tenant | null>(null);

interface TenantProviderProps {
  tenant: Tenant;
  children: React.ReactNode;
}

export function TenantProvider({ tenant, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): Tenant {
  const tenant = useContext(TenantContext);

  if (!tenant) {
    throw new Error("useTenant must be used within a TenantProvider.");
  }

  return tenant;
}
