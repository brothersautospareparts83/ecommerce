const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Dar_es_Salaam",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatDate = (d: Date | string) => dateFmt.format(new Date(d));

export const orderStatusLabel: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_for_pickup: "Ready for pickup",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const roleLabel: Record<string, string> = {
  customer: "Customer",
  staff: "Staff",
  admin: "Admin",
  owner: "Owner",
};
