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
};

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { id } = await params;

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
          <CardGrid categoryId={id} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}