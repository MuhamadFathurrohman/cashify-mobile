import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "cashify_access_token";
const REFRESH_TOKEN_KEY = "cashify_refresh_token";

export interface StoredTokens {
    accessToken: string;
    refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function getTokens(): Promise<StoredTokens | null> {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

    if (!accessToken || !refreshToken) return null;

    return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}