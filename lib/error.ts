// utils/error.ts

/**
 * Errorオブジェクトかどうか判定
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

/**
 * Errorオブジェクトで、メッセージに特定の文字列が含まれるか判定
 */
export function isErrorWithMessage(
    error: unknown,
    message: string,
): error is Error {
    return error instanceof Error && error.message.includes(message);
}

/**
 * Errorオブジェクトのメッセージを取得（なければデフォルト）
 */
export function getErrorMessage(
    error: unknown,
    fallback = "Unknown error",
): string {
    return error instanceof Error ? error.message : fallback;
}
