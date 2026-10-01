import { z } from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(250, "Title cannot exceed 250 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  excerpt: z
    .string()
    .max(500, "Excerpt cannot exceed 500 characters")
    .nullable()
    .optional(),
  coverImage: z
    .string()
    .url("Cover image must be a valid URL")
    .or(z.literal(""))
    .nullable()
    .optional(),
  content: z.any().refine((val) => val && typeof val === "object", {
    message: "Content must be a valid Tiptap JSON object",
  }),
  contentHtml: z.string().default(""),
  language: z.enum(["EN", "AS"]).default("EN"),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  publishedAt: z
    .union([z.string().datetime(), z.date()])
    .nullable()
    .optional(),
  tags: z.array(z.string().trim().min(1).max(50)).default([]),
});

export type PostInput = z.infer<typeof postSchema>;

export const uploadImageQuerySchema = z.object({
  filename: z.string().min(1),
});
