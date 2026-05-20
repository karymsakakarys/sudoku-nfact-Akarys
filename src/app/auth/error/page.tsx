import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="app-surface rounded-[36px] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">Auth Error</p>
        <h1 className="mt-2 text-3xl font-semibold">Не удалось завершить авторизацию</h1>
        <p className="mt-3 text-soft">
          Проверь настройки Redirect URL, шаблон письма в Supabase и попробуй войти или зарегистрироваться заново.
        </p>
        <Link href="/login" className="primary-button mt-6 inline-flex rounded-full px-6 py-3 text-sm font-medium">
          Перейти ко входу
        </Link>
      </div>
    </div>
  )
}
