"use client";

import { useCallback, useEffect, useState } from "react";
import ItemCard from "./Card";
import type { ProductCard } from "../types";
import {
  getAllProducts,
  searchProducts,
  getProductsByCategory,
} from "../utils/productApi";

interface CardGridProps {
  query?: string;
  categoryId?: string;
  sort?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
}

// Server default is 24 (max 100); each "Load More" pulls the next page.
const PAGE_SIZE = 24;

export default function CardGrid({
  query = "",
  categoryId,
  sort,
  condition,
  minPrice,
  maxPrice,
}: CardGridProps) {

  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Fetch a single server page starting at `offset`, honouring the active filter.
  const fetchPage = useCallback(
    async (offset: number) => {
      const cleanQuery = query?.trim();
      const cleanCategory = categoryId?.trim();
      const opts = { sort, condition, minPrice, maxPrice };
      let response;
      if (cleanQuery) {
        response = await searchProducts(cleanQuery, PAGE_SIZE, offset, opts);
      } else if (cleanCategory) {
        response = await getProductsByCategory(cleanCategory, PAGE_SIZE, offset, opts);
      } else {
        response = await getAllProducts(PAGE_SIZE, offset, opts);
      }
      return response?.products ?? [];
    },
    [query, categoryId, sort, condition, minPrice, maxPrice],
  );

  useEffect(() => {
    let ignore = false;

    const loadFirstPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const batch = await fetchPage(0);
        if (!ignore) {
          setProducts(batch);
          setHasMore(batch.length === PAGE_SIZE);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Could not load products");
          setProducts([]);
          setHasMore(false);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadFirstPage();

    return () => {
      ignore = true;
    };
  }, [fetchPage]); // Re-runs whenever the search string OR category changes

  const handleLoadMore = async () => {
    setIsBatchLoading(true);
    try {
      const batch = await fetchPage(products.length);
      setProducts((prev) => [...prev, ...batch]);
      setHasMore(batch.length === PAGE_SIZE);
    } catch {
      // Keep what we already have; the button stays available for a retry.
    } finally {
      setIsBatchLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 w-full"
        aria-busy="true"
        aria-label="Loading products"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-xs animate-pulse">
            <div className="w-full aspect-square bg-gray-100" />
            <div className="p-3 space-y-2">
              <div className="h-2 w-16 bg-gray-100 rounded" />
              <div className="h-3 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-1/3 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!products || !products.length) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        {query?.trim()
          ? `No results found for "${query.trim()}".`
          : categoryId?.trim()
            ? "No products found in this category."
            : "No products found."}
      </div>
    );
  }

  return (
  <div className="flex flex-col items-center gap-10 w-full">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 w-full">
        {products.map((product) => (
          <ItemCard key={product.id} item={product} />
        ))}
      </div>

      {hasMore && (
  <div className="flex flex-col items-center gap-2 mt-4 pb-8">
    <button
      onClick={handleLoadMore}
      disabled={isBatchLoading}
      className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed min-w-[150px] flex items-center justify-center gap-2"
    >
      {isBatchLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        "Load More Items"
      )}
    </button>
    <span className="text-xs text-text-muted">
      Showing {products.length} items
    </span>
  </div>
)}
    </div>
  );
}
