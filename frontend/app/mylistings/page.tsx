"use client";

import React, { useEffect } from 'react';
import StatCard from '@/components/StatCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ItemCard from '@/components/Card';
import CreateListingCard from '@/components/CreateListingCard';
import NoCard from "../images/undraw_not-found_6bgl.svg"
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMyProducts } from '../../customHooks/useGetProducts';

export default function MyListingsDashboard() {
const router = useRouter();
  const { products: userListings, loading, error } = useMyProducts();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div>
      <Navbar />
      <div className="p-6 bg-[#f8fafc] space-y-6 min-h-[80vh]">
        
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
            <div className="sm:col-span-1 md:col-span-2 lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
              <p className="text-sm text-text-muted">Loading your listings...</p>
            </div>
          ) : error ? (
            <div className="sm:col-span-1 md:col-span-2 lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) :
          userListings.length > 0 ? (
            userListings.map((listing) => (
          
              <ItemCard key={listing.id} item={listing} />
            ))
          ) : (
            <div className="sm:col-span-1 md:col-span-2 lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-8 flex flex-col justify-center h-full min-h-[280px] shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">No items listed yet</h3>
           
              <p className="text-sm text-slate-400 mt-1 max-w-sm leading-relaxed">
               
                You haven't uploaded any products to the campus marketplace. Use the action card to create your first listing.
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