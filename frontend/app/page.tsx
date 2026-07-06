import { Suspense } from "react";
import CardGrid from "./components/CardGrid";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import ItemCategory from "./components/ItemCategory";
import Navbar from "./components/Navbar";
import SoldToast from "./components/SoldToast";
import Toolbar from "./components/Toolbar";
import { getAllProducts, searchProducts } from "./utils/productApi";
import type { ProductCard } from "./types";

// First page rendered on the server so listings ship in the initial HTML.
const PAGE_SIZE = 24;

async function loadFirstPage(
  query: string,
  opts: { sort?: string; condition?: string; minPrice?: string; maxPrice?: string },
): Promise<{ products: ProductCard[]; hasMore: boolean } | undefined> {
  try {
    const res = query
      ? await searchProducts(query, PAGE_SIZE, 0, opts, { next: { revalidate: 30 } })
      : await getAllProducts(PAGE_SIZE, 0, opts, { next: { revalidate: 30 } });
    const list = res?.products ?? [];
    return { products: list, hasMore: list.length === PAGE_SIZE };
  } catch {
    // Backend cold/unavailable — let CardGrid fall back to a client fetch.
    return undefined;
  }
}

type HomeProps = {
  searchParams?: Promise<{
    q?: string;
    sort?: string;
    condition?: string;
    min_price?: string;
    max_price?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const opts = {
    sort: params?.sort,
    condition: params?.condition,
    minPrice: params?.min_price,
    maxPrice: params?.max_price,
  };
  const initial = await loadFirstPage(query, opts);
  const gridKey = `${query}|${opts.sort ?? ""}|${opts.condition ?? ""}|${opts.minPrice ?? ""}|${opts.maxPrice ?? ""}`;

  return (
    <div>
      <Navbar />

      <Suspense fallback={null}>
        <SoldToast />
      </Suspense>

 <Hero />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4 pb-12">
       
       <div id="product_listings">
         <Toolbar />
        <ItemCategory />
       </div>

        <Suspense
          fallback={
            <div className="p-8 text-sm text-gray-500">
              Loading products...
            </div>
          }
        >
          <CardGrid
            key={gridKey}
            query={query}
            sort={params?.sort}
            condition={params?.condition}
            minPrice={params?.min_price}
            maxPrice={params?.max_price}
            initialProducts={initial?.products}
            initialHasMore={initial?.hasMore}
          />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}