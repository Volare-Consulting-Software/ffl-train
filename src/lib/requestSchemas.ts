import { z } from "zod";

import { isIsoDate } from "@/lib/dates";

export const departureDateSchema = z.string().refine(isIsoDate, "date must be YYYY-MM-DD");

export const pickIdSchema = z.coerce.number().int().positive();
