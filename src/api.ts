import axios from 'axios';

const API_URL = 'https://dummyjson.com';

export interface ProductSummary {
  id: number;
  title: string;
  images: string[];
  thumbnail: string;
}

export interface Product extends ProductSummary {
  description: string;
  price: number;
}

export const fetchProducts = async (category?: string | null) => {
  const url = category
    ? `${API_URL}/products/category/${encodeURIComponent(category)}?limit=3`
    : `${API_URL}/products?limit=3`;
  const res = await axios.get<{ products: ProductSummary[] }>(url);

  return res.data;
};

export const fetchProduct = async (id: number) => {
  try {
    const res = await axios.get<Product>(`${API_URL}/product/${id}`);

    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;

    throw err;
  }
};
