import { z } from "zod";
import { ORDER_STATUSES } from "./orders";
import { LANGS } from "./i18n";

export const categoryInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  sourceLang: z.enum(LANGS).optional().default("en"),
  sortOrder: z.number().int().optional(),
});

export const productInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().max(500).optional().default(""),
  sourceLang: z.enum(LANGS).optional().default("en"),
  price: z.number().int().min(0, "Price must be >= 0"),
  imageUrl: z.string().trim().max(1000).optional().default(""),
  available: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional(),
  categoryId: z.string().min(1, "Category is required"),
});

export const productUpdateInput = productInput.partial();

export const hotelInput = z.object({
  name: z.string().trim().min(1, "Hotel name is required").max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers and dashes")
    .max(60)
    .optional(),
  floors: z.number().int().min(1, "At least 1 floor").max(50),
  roomsPerFloor: z.number().int().min(1, "At least 1 room per floor").max(99),
});

export const hotelUpdateInput = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Invalid slug")
    .max(60)
    .optional(),
  active: z.boolean().optional(),
});

export const roomInput = z.object({
  hotelId: z.string().min(1, "Hotel is required"),
  number: z.string().trim().min(1, "Room number is required").max(20),
  name: z.string().max(80).optional().default(""),
  floor: z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const roomUpdateInput = z.object({
  number: z.string().trim().min(1).max(20).optional(),
  name: z.string().max(80).optional(),
  floor: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const orderItemInput = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const orderInput = z.object({
  hotelSlug: z.string().trim().min(1, "Hotel is required"),
  roomNumber: z.string().trim().min(1, "Room is required"),
  note: z.string().max(500).optional().default(""),
  items: z.array(orderItemInput).min(1, "Cart is empty"),
});

export const orderStatusInput = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const recommendationInput = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  productId: z.string().min(1, "Product is required"),
  sortOrder: z.number().int().optional(),
});

// Login accepts EITHER `{ role, password }` (web admin/POS forms) OR
// `{ email, password }` (native apps that sign in by email).
export const loginInput = z
  .object({
    role: z.enum(["admin", "pos"]).optional(),
    email: z.string().email().optional(),
    password: z.string().min(1),
  })
  .refine((v) => Boolean(v.role) || Boolean(v.email), {
    message: "role or email is required",
  });
