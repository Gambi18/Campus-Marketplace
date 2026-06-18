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

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

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
          // Fallback to response itself if API returns the raw array directly
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

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ItemCard key={product.id} item={product} />
      ))}
    </div>
  );
}