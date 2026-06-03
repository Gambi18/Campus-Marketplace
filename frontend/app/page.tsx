
import CardGrid from "./components/CardGrid";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import ItemCategory from "./components/ItemCategory";
import Navbar from "./components/Navbar";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between pb-12">
            <div className="text-center">
                <Navbar/>
                <Hero/>
                 <ItemCategory/>
                  <CardGrid/>
                 <Footer/>
            </div>
        </main>
    );
}
