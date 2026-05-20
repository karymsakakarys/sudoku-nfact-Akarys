import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="app-surface rounded-[36px] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-soft">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Такой страницы нет</h1>
        <p className="mt-3 text-soft">Но новая сетка точно ждет тебя на главной.</p>
        <Link href="/" className="primary-button mt-6 inline-flex rounded-full px-6 py-3 text-sm font-medium">
          Вернуться домой
        </Link>
      </div>
    </div>
  )
}
