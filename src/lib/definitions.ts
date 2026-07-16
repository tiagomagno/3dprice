import * as z from "zod";

export const SignupFormSchema = z.object({
  companyName: z
    .string()
    .min(2, { error: "Nome da empresa deve ter pelo menos 2 caracteres." })
    .trim(),
  name: z
    .string()
    .min(2, { error: "Nome deve ter pelo menos 2 caracteres." })
    .trim(),
  email: z.email({ error: "Informe um e-mail válido." }).trim(),
  password: z
    .string()
    .min(8, { error: "A senha deve ter pelo menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { error: "A senha deve conter pelo menos uma letra." })
    .regex(/[0-9]/, { error: "A senha deve conter pelo menos um número." }),
});

export type SignupFormState =
  | {
      errors?: {
        companyName?: string[];
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const LoginFormSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }).trim(),
  password: z.string().min(1, { error: "Informe a senha." }),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
