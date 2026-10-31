import { ActionForm, Field, adminInput } from "@/components/admin/action-form";
import { saveProduct } from "./actions";

export interface ProductFormValues {
  id?: string;
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  brandId: string;
  classification: string;
  condition: string;
  priceTzs: number;
  costPriceTzs: number | null;
  weightKg: number | null;
  status: string;
}

export const emptyProduct: ProductFormValues = {
  name: "", sku: "", description: "", categoryId: "", brandId: "", classification: "unverified",
  condition: "new", priceTzs: 0, costPriceTzs: null, weightKg: null, status: "draft",
};

export function ProductForm({
  values,
  categories,
  brands,
}: {
  values: ProductFormValues;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}) {
  const v = values;
  return (
    <ActionForm action={saveProduct} submitLabel={v.id ? "Save changes" : "Create product"} className="space-y-4">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Product name" htmlFor="name"><input id="name" name="name" required minLength={2} maxLength={200} defaultValue={v.name} className={adminInput} /></Field>
        </div>
        <Field label="SKU" htmlFor="sku" hint={v.id ? "SKU cannot be changed." : "Leave empty to generate one (BAS-00001…)."}>
          <input id="sku" name="sku" defaultValue={v.sku} readOnly={!!v.id} maxLength={60} className={`${adminInput} ${v.id ? "opacity-70" : ""}`} />
        </Field>
        <Field label="Status" htmlFor="status" hint="Publishing needs a classification, a price and an approved real photo.">
          <select id="status" name="status" defaultValue={v.status} className={adminInput}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (visible to customers)</option>
            <option value="archived">Archived (hidden)</option>
            <option value="image_required">Image required (hidden)</option>
          </select>
        </Field>
        <Field label="Category" htmlFor="categoryId">
          <select id="categoryId" name="categoryId" defaultValue={v.categoryId} className={adminInput}>
            <option value="">No category</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </Field>
        <Field label="Brand" htmlFor="brandId">
          <select id="brandId" name="brandId" defaultValue={v.brandId} className={adminInput}>
            <option value="">No brand</option>
            {brands.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
        </Field>
        <Field label="Type" htmlFor="classification" hint="Never mark aftermarket parts as genuine.">
          <select id="classification" name="classification" defaultValue={v.classification} className={adminInput}>
            <option value="unverified">Not yet classified</option>
            <option value="genuine_oem">Genuine OEM</option>
            <option value="oem_equivalent">OEM equivalent</option>
            <option value="aftermarket">Aftermarket</option>
          </select>
        </Field>
        <Field label="Condition" htmlFor="condition">
          <select id="condition" name="condition" defaultValue={v.condition} className={adminInput}>
            <option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option>
          </select>
        </Field>
        <Field label="Selling price (TSh)" htmlFor="priceTzs" hint="Shown to customers.">
          <input id="priceTzs" name="priceTzs" type="number" inputMode="numeric" min={0} step={1} required defaultValue={v.priceTzs} className={adminInput} />
        </Field>
        <Field label="Buying price (TSh)" htmlFor="costPriceTzs" hint="Staff only. Never shown to customers.">
          <input id="costPriceTzs" name="costPriceTzs" type="number" inputMode="numeric" min={0} step={1} defaultValue={v.costPriceTzs ?? ""} className={adminInput} />
        </Field>
        <Field label="Weight (kg)" htmlFor="weightKg">
          <input id="weightKg" name="weightKg" type="number" min={0} step="0.001" defaultValue={v.weightKg ?? ""} className={adminInput} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" htmlFor="description">
            <textarea id="description" name="description" rows={4} maxLength={4000} defaultValue={v.description} className={`${adminInput} h-auto py-2`} />
          </Field>
        </div>
      </div>
    </ActionForm>
  );
}
