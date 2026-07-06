import { Suspense } from "react";
import CardGrid from "../../components/CardGrid";
import Footer from "../../components/Footer";
import Hero from "../../../app/components/Hero";
import ItemCategory from "../../../app/components/ItemCategory";
import Navbar from "../../components/Navbar";
import Toolbar from "../../components/Toolbar";
import { getProductsByCategory } from "../../utils/productApi";

const PAGE_SIZE = 24;

type CategoryPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    sort?: string;
    condition?: string;
    min_price?: string;
    max_price?: string;
  }>;
};

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { id } = await params;
  const filters = await searchParams;
  const opts = {
    sort: filters?.sort,
    condition: filters?.condition,
    minPrice: filters?.min_price,
    maxPrice: filters?.max_price,
  };
  let initial;
  try {
    const res = await getProductsByCategory(id, PAGE_SIZE, 0, opts, { next: { revalidate: 30 } });
    const list = res?.products ?? [];
    initial = { products: list, hasMore: list.length === PAGE_SIZE };
  } catch {
    initial = undefined; // cold backend — CardGrid falls back to a client fetch
  }
  const gridKey = `${id}|${opts.sort ?? ""}|${opts.condition ?? ""}|${opts.minPrice ?? ""}|${opts.maxPrice ?? ""}`;

  return (
    <div>
      <Navbar />
         <Hero />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4 pb-12">
     
        <Toolbar />
        <ItemCategory />

        <Suspense
          fallback={
            <div className="p-8 text-sm text-gray-500">
              Loading products...
            </div>
          }
        >
          <CardGrid
            key={gridKey}
            categoryId={id}
            sort={filters?.sort}
            condition={filters?.condition}
            minPrice={filters?.min_price}
            maxPrice={filters?.max_price}
            initialProducts={initial?.products}
            initialHasMore={initial?.hasMore}
          />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}