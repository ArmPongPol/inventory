export type ApiResponse<T> = {
  success: boolean;
  status: number;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
  status: number;
  message: string;
  data: null;
  requestId?: string;
  timestamp?: string;
  path?: string;
};

export type Category = {
  id: number;
  name: string;
  parentId: number | null;
  parent?: Category | null;
  children?: Category[];
};

export type Supplier = {
  id: number;
  name: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: string | null;
  isActive: boolean;
};

export type Customer = {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  points: number;
  memberSince: string | null;
  isActive: boolean;
};

export type Employee = {
  id: number;
  fullName: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  startDate: string | null;
  isActive: boolean;
};

export type Location = {
  id: number;
  name: string;
  type: string | null;
  capacity: number | null;
  zone: string | null;
  status: string | null;
  isActive: boolean;
};

export type Inventory = {
  id: number;
  productId: number;
  currentStock: number;
  minStock: number | null;
  maxStock: number | null;
  lastUpdated: string;
  product?: Product;
};

export type Product = {
  id: number;
  categoryId: number | null;
  name: string;
  sku: string | null;
  unit: string | null;
  salePrice: number;
  costPrice: number | null;
  isActive: boolean;
  category?: Category | null;
  inventory?: Inventory | null;
};

export type SoItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number | null;
  note: string | null;
  product?: Product;
};

export type SaleOrder = {
  id: number;
  locationId: number | null;
  customerId: number | null;
  employeeId: number | null;
  orderTime: string;
  closeTime: string | null;
  subtotal: number | null;
  discount: number;
  tax: number;
  totalAmount: number | null;
  paymentMethod: string | null;
  status: string | null;
  customer?: Customer | null;
  employee?: Employee | null;
  location?: Location | null;
  items?: SoItem[];
};

export type PurchaseOrder = {
  id: number;
  supplierId: number;
  orderDate: string;
  receivedDate: string | null;
  totalAmount: number | null;
  status: string | null;
  note: string | null;
  supplier?: Supplier;
};

export type CreateProductDto = {
  categoryId?: number;
  name: string;
  sku?: string;
  unit?: string;
  salePrice: number;
  costPrice?: number;
  isActive?: boolean;
};

export type UpdateProductDto = Partial<CreateProductDto>;

export type CreateCategoryDto = { name: string; parentId?: number };
export type CreateCustomerDto = {
  name?: string;
  phone?: string;
  email?: string;
  points?: number;
  memberSince?: string;
  isActive?: boolean;
};
export type CreateSupplierDto = {
  name: string;
  contactName?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  isActive?: boolean;
};

export type CreateSaleOrderDto = {
  locationId?: number;
  customerId?: number;
  employeeId?: number;
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  status?: string;
};

export type CreateSoItemDto = {
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  note?: string;
};

export type CreateInventoryDto = {
  productId: number;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
};

export type UpdateInventoryDto = Partial<CreateInventoryDto>;
