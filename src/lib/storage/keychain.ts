import * as Keychain from "react-native-keychain";

const TOKEN_KEY = "cashify_auth_token";

export interface StoredTokens {
    accessToken: string;
    refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
    await Keychain.setGenericPassword(
        TOKEN_KEY,
        JSON.stringify(tokens),
        {service: TOKEN_KEY}
    );
}

export async function getTokens(): Promise<StoredTokens | null> {
    const result = await Keychain.getGenericPassword({ service: TOKEN_KEY});
    if (!result) return null;
    return JSON.parse(result.password) as StoredTokens;
}

export async function clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({ service: TOKEN_KEY });
}