import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import type { RegisterResponse } from "@/types/api";

export interface RegisterAccountData {
  full_name: string;
  email: string;
}

interface RegisterFlowValue {
  // Data langkah 1; dipakai untuk mengisi ulang form bila pengguna kembali
  account: RegisterAccountData | null;
  setAccount: (data: RegisterAccountData) => void;
  // Error email dari server (mis. 409) yang ditampilkan di langkah 1
  emailError: string | null;
  setEmailError: (message: string | null) => void;
  // Hasil register; token hanya di memori sampai layar sukses mengomitnya
  result: RegisterResponse | null;
  setResult: (data: RegisterResponse) => void;
}

const RegisterContext = createContext<RegisterFlowValue | null>(null);

// Password sengaja tidak disimpan di sini; state hilang saat alur register ditinggalkan.
export function RegisterProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<RegisterAccountData | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterResponse | null>(null);

  const value = useMemo(
    () => ({
      account,
      setAccount,
      emailError,
      setEmailError,
      result,
      setResult,
    }),
    [account, emailError, result],
  );

  return (
    <RegisterContext.Provider value={value}>
      {children}
    </RegisterContext.Provider>
  );
}

export function useRegisterFlow(): RegisterFlowValue {
  const value = useContext(RegisterContext);
  if (!value) {
    throw new Error("useRegisterFlow harus dipakai di dalam RegisterProvider");
  }
  return value;
}
