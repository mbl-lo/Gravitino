import { useState } from 'react'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt:', { email, password, rememberMe })
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      
      {/* Левая колонка - синий фон на всю высоту */}
      <div className="w-full md:w-1/2 bg-blue-700 flex flex-col justify-center items-center text-center p-8 lg:p-12">
        {/* Заглушка для картинки */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
          Автоматизация обработки <br /> путевых листов
        </h2>
        <p className="text-blue-100 text-base lg:text-lg">
          ИИ-распознавание, валидация данных и контроль аномалий <br /> для транспортных компаний
        </p>
      </div>

      {/* Правая колонка - серый фон с карточкой по центру */}
      <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-left mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Цифровой архив
            </h1>
            <p className="text-sm text-gray-600">
              ИИ-распознавание и контроль путевых листов
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Электронная почта
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="example@company.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-gray-700 select-none">Запомнить меня</span>
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700 transition duration-200">
                Забыли пароль?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition duration-200 cursor-pointer"
            >
              Войти в систему
            </button>
          </form>

          {/* Тонкая еле видимая линия */}
          <div className="border-t border-gray-200 my-6"></div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Доступ только для сотрудников организации
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login