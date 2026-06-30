"use client";

import { useEffect, useState } from "react";
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
}


export default function CardGrid({
  query = "",
  categoryId,
}: CardGridProps) {

  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      setVisibleCount(5);

      try {
        const cleanQuery = query?.trim();
        const cleanCategory = categoryId?.trim();
        let response;
        if (cleanQuery) {
          response = await searchProducts(cleanQuery);
        } else if (cleanCategory) {
          response = await getProductsByCategory(cleanCategory);
        } else {
          response = await getAllProducts();
        }

        if (!ignore) {
          setProducts(response?.products ?? response ?? []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Could not load products");
          setProducts([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      ignore = true;
    };
  }, [query, categoryId]); // Re-runs data fetching whenever the search string OR category changes

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Loading products...
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

  const visibleProducts = products.slice(0, visibleCount);

  const handleLoadMore = () => {
    setIsBatchLoading(true);
    setVisibleCount((prev) => prev + 6);
    setIsBatchLoading(false);
  };

  return (
  <div className="flex flex-col items-center gap-10 w-full">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 w-full">
        {visibleProducts.map((product) => (
          <ItemCard key={product.id} item={product} />
        ))}
      </div>

      {products.length > visibleCount && (
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
    <span className="text-xs text-gray-400">
      Showing {visibleProducts.length} of {products.length} items
    </span>
  </div>
)}
    </div>
  );
}