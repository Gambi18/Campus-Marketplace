"use client";

import { useEffect } from 'react';
import StatCard from '@/components/StatCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ItemCard from '@/components/Card';
import CreateListingCard from '@/components/CreateListingCard';
import NoCard from "../images/undraw_not-found_6bgl.svg"
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMyProducts } from '../../customHooks/useGetProducts';
import { API_URL } from '../utils/api';

export default function MyListingsDashboard() {
const router = useRouter();
  const { products: userListings, loading, error, refresh } = useMyProducts();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  const handleStatusChange = async (id: string, status: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) refresh();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing permanently?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) refresh();
    } catch { /* ignore */ }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 min-h-[80vh]">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard 
            label="Active Listings" 
          value={String(userListings.length)}
            iconName="Package" 
            iconColorClass="text-blue-600" 
            iconBgClass="bg-blue-50" 
          />
          <StatCard 
            label="Items Sold" 
            value="0" 
            iconName="TrendingUp" 
            iconColorClass="text-emerald-500" 
            iconBgClass="bg-emerald-50" 
          />
          <StatCard 
            label="Total Revenue" 
            value="FCFA 0.00" 
            iconName="Coins" 
            iconColorClass="text-amber-500" 
            iconBgClass="bg-amber-50" 
          />
        </div>
        
        {/* Workspace Display Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
        
          {
            loading ? (
            <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
              <p className="text-sm text-text-muted">Loading your listings...</p>
            </div>
          ) : error ? (
            <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) :
          userListings.length > 0 ? (
            userListings.map((listing) => (
              <div key={listing.id} className="flex flex-col gap-2">
                <ItemCard item={listing} />
                <div className="flex gap-2 px-1">
                  <button
                    onClick={() => router.push(`/edit/${listing.id}`)}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  {listing.status === 'available' && (
                    <button
                      onClick={() => handleStatusChange(listing.id, 'sold')}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      Mark Sold
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-8 flex flex-col justify-center h-full min-h-[280px] shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">No items listed yet</h3>
           
              <p className="text-sm text-slate-400 mt-1 max-w-sm leading-relaxed">
               
                You haven&apos;t uploaded any products to the campus marketplace. Use the action card to create your first listing.
              </p>
               <Image src={NoCard} alt="No listings found" className="w-48 h-48 mx-auto" />
            </div>
          )}
          
          <CreateListingCard />
          
        </div>
      </div>
      <Footer />
    </div>
  );
}
