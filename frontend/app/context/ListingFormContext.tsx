'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LISTING_FORM, type ListingFormData } from '../types';

const STORAGE_KEY = 'campus-marketplace-listing-draft';

interface ListingFormContextValue {
  form: ListingFormData;
  updateForm: (patch: Partial<ListingFormData>) => void;
  resetForm: () => void;
  primaryPhoto: string | null;
  /** False until the draft has been loaded from storage; guard redirects on it. */
  hydrated: boolean;
}

const ListingFormContext = createContext<ListingFormContextValue | null>(null);

function loadDraft(): ListingFormData {
  if (typeof window === 'undefined') return DEFAULT_LISTING_FORM;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LISTING_FORM;
    return { ...DEFAULT_LISTING_FORM, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LISTING_FORM;
  }
}

export function ListingFormProvider({ children }: { children: React.ReactNode }) {
  const [form, setForm] = useState<ListingFormData>(DEFAULT_LISTING_FORM);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setForm(loadDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // quota exceeded (usually large images) — skip persistence
    }
  }, [form, hydrated]);

  const updateForm = useCallback((patch: Partial<ListingFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(DEFAULT_LISTING_FORM);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const primaryPhoto = form.photos.find((p) => p !== null) ?? null;

  const value = useMemo(
    () => ({ form, updateForm, resetForm, primaryPhoto, hydrated }),
    [form, updateForm, resetForm, primaryPhoto, hydrated],
  );

  return <ListingFormContext.Provider value={value}>{children}</ListingFormContext.Provider>;
}

export function useListingForm() {
  const ctx = useContext(ListingFormContext);
  if (!ctx) throw new Error('useListingForm must be used within ListingFormProvider');
  return ctx;
}
