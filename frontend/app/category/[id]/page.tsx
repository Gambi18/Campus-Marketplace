'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CardGrid from '../../components/CardGrid';

const CATEGORY_NAMES: Record<string, string> = {
  '1': 'Electronics',
  '2': 'Fashion & Accessories',
  '3': 'Academic Materials',
  '4': 'Furniture & Home',
  '5': 'Sports & Fitness',
  '6': 'Others',
};

export default function CategoryPage() {
  const params = useParams();
  const id = params.id as string;
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    setCategoryName(CATEGORY_NAMES[id] || 'Category');
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-brand-neutral mb-2">{categoryName}</h1>
        <p className="text-sm text-text-muted mb-6">Browse products in this category</p>
        <CardGrid />
      </main>
      <Footer />
    </div>
  );
}
