'use client'

import { useRouter } from 'next/navigation'
import { Award, LogIn, Sparkles, CheckCircle2, Heart, Star } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  
  // Khai báo cố định duy nhất một lớp
  const TEN_LOP_CO_DINH = '8A9'

  const handleEnterClass = () => {
    // Đồng bộ cứng dữ liệu Lớp 8A9 vào hệ thống khi click
    localStorage.setItem('adminSelectedClass', TEN_LOP_CO_DINH)
    localStorage.setItem('selectedClass', TEN_LOP_CO_DINH)
    localStorage.setItem('currentClass', TEN_LOP_CO_DINH)
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col justify-between p-6 relative overflow-hidden font-sans selection:bg-pink-200">
      
      {/* Trang trí Background (Bóng mờ lơ lửng) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-pink-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex justify-between items-center py-4 relative z-10">
        <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-sm border border-white">
          <div className="bg-gradient-to-tr from-purple-500 to-pink-400 text-white p-1.5 rounded-full shadow-md">
            <Award className="h-5 w-5" />
          </div>
          <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600 tracking-wide text-sm md:text-base">
            THI ĐUA TÍCH CỰC
          </span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="flex items-center space-x-2 bg-white/80 hover:bg-white text-purple-600 px-6 py-3 rounded-full shadow-sm hover:shadow-md border border-purple-100 transition-all font-bold text-sm cursor-pointer transform hover:-translate-y-0.5"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden md:inline">Đăng nhập hệ thống</span>
          <span className="md:hidden">Đăng nhập</span>
        </button>
      </header>

      {/* Main Banner */}
      <main className="flex-1 flex flex-col justify-center items-center relative z-10 my-10">
        <div className="max-w-3xl w-full bg-white/60 backdrop-blur-2xl rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-10 md:p-16 text-center space-y-8 relative overflow-hidden group">
          
          {/* Họa tiết trang trí dễ thương góc thẻ */}
          <Star className="absolute top-10 left-10 h-8 w-8 text-yellow-300 opacity-50 transform -rotate-12 group-hover:rotate-12 transition-transform duration-500" />
          <Heart className="absolute bottom-12 right-10 h-10 w-10 text-pink-300 opacity-40 transform rotate-12 group-hover:-rotate-12 transition-transform duration-500" />

          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-6 py-2 rounded-full text-xs font-extrabold shadow-sm border border-white">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <span>NĂM HỌC 2026 - 2027</span>
          </div>

          <div className="space-y-4 relative z-10">
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight">
              QUẢN LÝ THI ĐUA
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mt-2 inline-block drop-shadow-sm">
                LỚP {TEN_LOP_CO_DINH}
              </span>
            </h1>
            <p className="text-lg md:text-xl font-extrabold text-pink-500 tracking-wide">
              GVCN: TRẦN VĂN LIỆU
            </p>
          </div>

          <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto font-medium leading-relaxed relative z-10">
            Hệ thống theo dõi nề nếp, chấm điểm thi đua các tổ, tổng hợp xếp loại hạnh kiểm tuần và đợt một cách minh bạch, trực quan và vô cùng dễ thương! ✨
          </p>

          <div className="pt-4 flex flex-col items-center justify-center max-w-xs mx-auto relative z-10">
            <button
              onClick={handleEnterClass}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-extrabold px-8 py-4.5 rounded-full shadow-lg shadow-pink-200 transition-all transform hover:-translate-y-1 hover:shadow-xl cursor-pointer flex items-center justify-center space-x-2 text-base md:text-lg group/btn"
            >
              <CheckCircle2 className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
              <span>Vào Không Gian Lớp</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-6 font-medium relative z-10">
        © 2026 Lớp {TEN_LOP_CO_DINH} - Giáo viên Trần Văn Liệu. Thiết kế với <Heart className="h-3 w-3 inline text-pink-400 mx-0.5" />
      </footer>
    </div>
  )
}