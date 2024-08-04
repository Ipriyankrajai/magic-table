import { z } from "zod";

// https://github.com/colinhacks/zod/issues/2985#issue-2008642190
const stringToBoolean = z
  .string()
  .toLowerCase()
  .transform((val) => {
    try {
      return JSON.parse(val);
    } catch (e) {
      console.log(e);
      return false;
    }
  })
  .pipe(z.boolean());

export const schema = z.object({
  name: z.string().or(z.string().array()).optional(),
  public: stringToBoolean.or(stringToBoolean.array()).optional(),
  active: stringToBoolean.or(stringToBoolean.array()).optional(),
  regions: z
    .enum(["HS", "MS", "ES"])
    .or(z.enum(["HS", "MS", "ES"]).array())
    .optional(),
  tags: z
    .enum(["math", "science", "literature", "history"])
    .or(z.enum(["math", "science", "literature", "history"]).array())
    .optional(),
});

export type Schema = z.infer<typeof schema>;
