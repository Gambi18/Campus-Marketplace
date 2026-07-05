import { Suspense } from "react";
import CardGrid from "../../components/CardGrid";
import Footer from "../../components/Footer";
import Hero from "../../../app/components/Hero";
import ItemCategory from "../../../app/components/ItemCategory";
import Navbar from "../../components/Navbar";
import Toolbar from "../../components/Toolbar";

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
            categoryId={id}
            sort={filters?.sort}
            condition={filters?.condition}
            minPrice={filters?.min_price}
            maxPrice={filters?.max_price}
          />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}