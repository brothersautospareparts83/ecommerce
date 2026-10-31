import {
  Cog, Disc3, Waves, Droplet, Wind, Fuel, Zap, Thermometer, Settings2,
  Car, Lightbulb, Armchair, Sparkles, CircleDot, Link2, type LucideIcon,
} from "lucide-react";

/**
 * Category icons and the vehicle brand list used for navigation. This file holds NO products,
 * prices or stock: the catalog lives in the database. Category slugs match the `categories` table.
 */
export interface CategoryMeta {
  slug: string;
  name: string;
  icon: LucideIcon;
}

export const categories: CategoryMeta[] = [
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

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
