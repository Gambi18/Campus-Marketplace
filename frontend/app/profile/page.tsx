'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatCard from '@/components/StatCard';
import { getProfile } from '../utils/authApi';
import { fetchMyProducts } from '../utils/productApi';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{
    username: string;
    email: string;
    full_name: string;
    phone_number: string;
    account_status: string;
    is_verified: boolean;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const [profileData, productsData] = await Promise.all([
          getProfile(),
          fetchMyProducts(),
        ]);
        setProfile(profileData);
        setListingCount(productsData.products?.length || 0);
      } catch {
        // profile load failed
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-text-muted">Loading profile...</main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-text-muted">Could not load profile.</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-brand-neutral mb-6">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <StatCard label="Active Listings" value={String(listingCount)} iconName="Package" iconColorClass="text-blue-600" iconBgClass="bg-blue-50" />
          <StatCard label="Account Status" value={profile.account_status} iconName="ShieldCheck" iconColorClass="text-emerald-500" iconBgClass="bg-emerald-50" />
          <StatCard label="Verified" value={profile.is_verified ? 'Yes' : 'No'} iconName="BadgeCheck" iconColorClass="text-amber-500" iconBgClass="bg-amber-50" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-brand-neutral">Account Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Username</label>
              <p className="text-sm font-medium text-brand-neutral mt-1">{profile.username}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Full Name</label>
              <p className="text-sm font-medium text-brand-neutral mt-1">{profile.full_name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email</label>
              <p className="text-sm font-medium text-brand-neutral mt-1">{profile.email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Phone</label>
              <p className="text-sm font-medium text-brand-neutral mt-1">{profile.phone_number || 'Not set'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Member Since</label>
              <p className="text-sm font-medium text-brand-neutral mt-1">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
