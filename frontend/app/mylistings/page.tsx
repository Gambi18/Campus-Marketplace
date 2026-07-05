"use client";

import StatCard from '@/components/StatCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ItemCard from '@/components/Card';
import CreateListingCard from '@/components/CreateListingCard';
import NoCard from "../images/undraw_not-found_6bgl.svg"
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMyProducts } from '../../customHooks/useGetProducts';
import { patchAPI, deleteAPI } from '../utils/api';

export default function MyListingsDashboard() {
const router = useRouter();
  const { products: userListings, loading, error, refresh } = useMyProducts();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    if (pendingId) return;
    setActionError(null);
    setPendingId(id);
    try {
      await patchAPI(`/api/v1/products/${id}/status`, { status });
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update the listing');
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (pendingId) return;
    if (!confirm('Delete this listing permanently?')) return;
    setActionError(null);
    setPendingId(id);
    try {
      await deleteAPI(`/api/v1/products/${id}`);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the listing');
    } finally {
      setPendingId(null);
    }
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
        
        {actionError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{actionError}</p>
        )}

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
                    disabled={pendingId !== null}
                    className="flex-1 min-h-[40px] text-xs font-semibold px-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                  {listing.status === 'available' && (
                    <button
                      onClick={() => handleStatusChange(listing.id, 'sold')}
                      disabled={pendingId !== null}
                      className="flex-1 min-h-[40px] text-xs font-semibold px-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pendingId === listing.id ? 'Working…' : 'Mark Sold'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(listing.id)}
                    disabled={pendingId !== null}
                    className="flex-1 min-h-[40px] text-xs font-semibold px-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-8 flex flex-col justify-center h-full min-h-[280px] shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">No items listed yet</h3>
           
              <p className="text-sm text-slate-500 mt-1 max-w-sm leading-relaxed">
               
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
