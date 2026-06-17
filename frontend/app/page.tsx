import { Suspense } from 'react';
import CardGrid from "./components/CardGrid";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import ItemCategory from "./components/ItemCategory";
import Navbar from "./components/Navbar";
import Toolbar from "./components/Toolbar";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between pb-12">
            <div className="text-center">
                <Navbar/>
                <Hero/>
                <Toolbar/>
                 <ItemCategory/>
                 <Suspense fallback={<div className="p-8 text-sm text-text-muted">Loading products...</div>}>
                  <CardGrid/>
                 </Suspense>
                 <Footer/>
            </div>
        </main>
    );
}
