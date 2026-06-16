
"use client";

import ItemCard from "./Card";
import { useProducts } from "../../customHooks/useGetProducts";

export default function CardGrid() {
  const { products, loading, error } = useProducts();

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
        No products found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4 justify-items-center">
      {products.map((product) => (
        <ItemCard key={product.id} item={product} />
      ))}
    </div>
  );
}