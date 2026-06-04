import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { ListingFormProvider } from '../context/ListingFormContext';

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <ListingFormProvider>
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        <Footer />
      </div>
    </ListingFormProvider>
  );
}
