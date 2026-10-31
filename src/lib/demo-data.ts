import {
  Cog, Disc3, Waves, Droplet, Wind, Fuel, Zap, Thermometer, Settings2,
  Car, Lightbulb, Armchair, Sparkles, CircleDot, Link2, type LucideIcon,
} from "lucide-react";

export type Classification = "Genuine OEM" | "OEM equivalent" | "Aftermarket";
export type Condition = "New" | "Used" | "Refurbished";

export interface Category {
  slug: string;
  name: string;
  icon: LucideIcon;
}

export interface Product {
  slug: string;
  name: string;
  sku: string;
  brand: string;
  categorySlug: string;
  classification: Classification;
  condition: Condition;
  price: number; // integer TZS
  stock: number;
  minStock: number;
  description: string;
  /** Always true for this file: placeholder records until the real catalog is imported. */
  isDemo: true;
}

export const categories: Category[] = [
  { slug: "engine-components", name: "Engine Components", icon: Cog },
  { slug: "brake-systems", name: "Brake Systems", icon: Disc3 },
  { slug: "suspension-steering", name: "Suspension & Steering", icon: Waves },
  { slug: "oil-filters", name: "Oil Filters", icon: Droplet },
  { slug: "air-filters", name: "Air Filters", icon: Wind },
  { slug: "fuel-systems", name: "Fuel Systems", icon: Fuel },
  { slug: "electrical-components", name: "Electrical Components", icon: Zap },
  { slug: "cooling-systems", name: "Cooling Systems", icon: Thermometer },
  { slug: "transmission-components", name: "Transmission Components", icon: Settings2 },
  { slug: "body-parts", name: "Body Parts", icon: Car },
  { slug: "lighting-systems", name: "Lighting Systems", icon: Lightbulb },
  { slug: "interior-accessories", name: "Interior Accessories", icon: Armchair },
  { slug: "exterior-accessories", name: "Exterior Accessories", icon: Sparkles },
  { slug: "bearings-seals", name: "Bearings & Seals", icon: CircleDot },
  { slug: "belts-hoses", name: "Belts & Hoses", icon: Link2 },
];

export const vehicleBrands = [
  "Toyota", "Nissan", "Honda", "Subaru", "Mitsubishi", "Mazda", "Suzuki",
  "Isuzu", "Mercedes-Benz", "BMW", "Volkswagen", "Hyundai", "Kia", "Ford",
];

// DEMO RECORDS — names, SKUs, prices and stock are placeholders for layout
// development only. Replaced by real data from Supabase (Phase 2/4) and the
// bulk import (Phase 5).
const demo = (
  n: number, name: string, categorySlug: string,
  classification: Classification, price: number, stock: number, description: string,
): Product => ({
  slug: `demo-${n}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
  name, sku: `DEMO-${String(n).padStart(4, "0")}`, brand: "Demo Brand",
  categorySlug, classification, condition: "New", price, stock, minStock: 5,
  description, isDemo: true,
});

export const products: Product[] = [
  demo(1, "Front Brake Pad Set", "brake-systems", "Aftermarket", 65000, 24, "Demo record. Replace with imported catalog data."),
  demo(2, "Engine Oil Filter", "oil-filters", "OEM equivalent", 18000, 60, "Demo record. Replace with imported catalog data."),
  demo(3, "Cabin Air Filter", "air-filters", "Aftermarket", 22000, 35, "Demo record. Replace with imported catalog data."),
  demo(4, "Front Shock Absorber", "suspension-steering", "Aftermarket", 120000, 8, "Demo record. Replace with imported catalog data."),
  demo(5, "Spark Plug Set", "engine-components", "Genuine OEM", 48000, 40, "Demo record. Replace with imported catalog data."),
  demo(6, "Radiator Hose", "belts-hoses", "Aftermarket", 27000, 3, "Demo record. Replace with imported catalog data."),
  demo(7, "Fuel Pump Assembly", "fuel-systems", "OEM equivalent", 135000, 0, "Demo record. Replace with imported catalog data."),
  demo(8, "Headlight Assembly", "lighting-systems", "Aftermarket", 175000, 6, "Demo record. Replace with imported catalog data."),
  demo(9, "Wheel Bearing", "bearings-seals", "Genuine OEM", 58000, 14, "Demo record. Replace with imported catalog data."),
  demo(10, "Alternator Belt", "belts-hoses", "OEM equivalent", 21000, 30, "Demo record. Replace with imported catalog data."),
  demo(11, "Radiator Cap", "cooling-systems", "Aftermarket", 9000, 50, "Demo record. Replace with imported catalog data."),
  demo(12, "Clutch Disc", "transmission-components", "OEM equivalent", 145000, 5, "Demo record. Replace with imported catalog data."),
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const productsInCategory = (slug: string) => products.filter((p) => p.categorySlug === slug);
