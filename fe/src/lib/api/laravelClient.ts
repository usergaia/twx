// Laravel backend client. Stub for now
import { env } from "@/lib/env";

const base = env.NEXT_PUBLIC_LARAVEL_URL;

export const laravelClient = {
  baseUrl: base,
  // listDrivers(), createDriver(), ...
  // createOrder(), assignDriver(), ...
};
