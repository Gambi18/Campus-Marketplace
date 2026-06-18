import { Suspense } from "react";
import CardGrid from "./components/CardGrid";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import ItemCategory from "./components/ItemCategory";
import Navbar from "./components/Navbar";
import Toolbar from "./components/Toolbar";

type HomeProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = params?.q ?? "";

  return (
    <div>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4 pb-12">
        <Hero />
        <Toolbar />
        <ItemCategory />
        <Suspense
          fallback={
            <div className="p-8 text-sm text-text-muted">
              Loading products...
            </div>
          }
        >
          <CardGrid query={query} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}