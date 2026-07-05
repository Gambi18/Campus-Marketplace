import { Suspense } from "react";
import CardGrid from "./components/CardGrid";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import ItemCategory from "./components/ItemCategory";
import Navbar from "./components/Navbar";
import SoldToast from "./components/SoldToast";
import Toolbar from "./components/Toolbar";

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
            query={query}
            sort={params?.sort}
            condition={params?.condition}
            minPrice={params?.min_price}
            maxPrice={params?.max_price}
          />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}