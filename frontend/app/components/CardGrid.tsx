"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ItemCard from "./Card";
import { fetchAPI } from '../utils/api';
import type { ProductCard } from '../types';

export default function CardGrid() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = query
          ? `/api/v1/products/search?q=${encodeURIComponent(query)}`
          : '/api/v1/products';
        const res = await fetchAPI<{ products: ProductCard[] }>(endpoint);
        setProducts(res.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-text-muted">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">{error}</div>
    );
  }

  if (!products.length) {
    return (
      <div className="p-8 text-center text-sm text-text-muted">
        {query ? `No results found for "${query}".` : 'No products found.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {products.map((product) => (
        <ItemCard key={product.id} item={product} />
      ))}
    </div>
  );
}
