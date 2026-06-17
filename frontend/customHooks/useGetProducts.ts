"use client";

import { useEffect, useState, useCallback } from "react";
import type { ProductCard } from "../app/types";
import { fetchProducts, fetchMyProducts } from "../app/utils/productApi";

export function useProducts() {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchProducts();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return { products, loading, error, refresh: loadProducts };
}

export function useMyProducts() {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMyProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchMyProducts();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyProducts();
  }, [loadMyProducts]);

  return { products, loading, error, refresh: loadMyProducts };
}