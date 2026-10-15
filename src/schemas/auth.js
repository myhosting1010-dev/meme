import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
export const usernameSchema = z.string().trim().min(3, "Username must have at least 3 characters.").max(30).regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores for your username.");
export const signupSchema = z.object({
  username: usernameSchema,
  twitterUsername: z.string().trim().transform((value) => value.replace(/^@/, "")).pipe(z.string().max(15).regex(/^[a-zA-Z0-9_]*$/, "Enter a valid X username.")).optional().default(""),
  email: emailSchema,
  password: z.string().min(12, "Password must have at least 12 characters.").max(128),
});
export const signinSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.").max(128), remember: z.boolean().optional().default(false) });
