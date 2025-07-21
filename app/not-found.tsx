import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-xl mb-8">
                お探しのページは見つかりませんでした。
            </p>
            <Link href="/" className="text-primary underline">
                ホームに戻る
            </Link>
        </div>
    );
}
