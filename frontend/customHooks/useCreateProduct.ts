import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "../app/utils/productApi";

export function useCreateProduct() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [condition, setCondition] = useState<"brand_new"|"like_new"|"good"|"fair">("good");
  const [images, setImages] = useState<(File | null)[]>([null, null, null, null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setImageAt = (index: number, file: File | null) => {
    setImages(prev => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  const validate = (): boolean => {
    if (!title.trim() || !description.trim() || !price.trim() || !categoryId) {
      setError("Please fill title, description, price and category");
      return false;
    }
    if (!images[0]) {
      setError("At least one image is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError(null);
    if (!validate()) return;

    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("price", String(price));
    fd.append("category_id", String(categoryId));
    fd.append("condition", condition);
    if (images[0]) fd.append("image_1", images[0] as File);
    if (images[1]) fd.append("image_2", images[1] as File);
    if (images[2]) fd.append("image_3", images[2] as File);
    if (images[3]) fd.append("image_4", images[3] as File);

    setLoading(true);
    try {
      const res: any = await createProduct(fd);
      // backend returns created product under res.product
      if (res && res.product && res.product.id) {
        router.push(`/details/${res.product.id}`);
      } else {
        setError("Unexpected server response");
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return {
    title, setTitle,
    description, setDescription,
    price, setPrice,
    categoryId, setCategoryId,
    condition, setCondition,
    images, setImageAt,
    loading, error,
    handleSubmit,
  };
}