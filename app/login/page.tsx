'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Lock, User, LogIn, Award } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      alert('Vui lòng nhập đầy đủ mã định danh và mật khẩu!')
      return
    }

    setLoading(true)

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim().toUpperCase())
      .single()

    setLoading(false)

    if (error || !user) {
      alert('Tài khoản không tồn tại trên hệ thống!')
      return
    }

    if (user.password !== password) {
      alert('Mật khẩu không chính xác!')
      return
    }

    // Lưu thông tin người dùng vào localStorage
    localStorage.setItem('currentUser', JSON.stringify(user))

    // Điều hướng dựa theo phân quyền (role)
    if (user.role === 'admin') {
      router.push('/admin')
    } else if (user.role.startsWith('to_truong_')) {
      router.push('/to-truong')
    } else if (user.role === 'pho_ky_luat') {
      router.push('/pho-ky-luat')
    } else {
      router.push('/student')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-purple-100 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-1.5 text-gray-600 hover:text-purple-700 bg-gray-50 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Trang chủ</span>
          </button>
          <div className="flex items-center space-x-1 text-purple-600 font-extrabold text-sm">
            <Award className="h-5 w-5" />
            <span>HỆ THỐNG THI ĐUA</span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-gray-900">Đăng Nhập Hệ Thống</h2>
          <p className="text-xs text-gray-500 font-medium">Dành cho Admin, Tổ trưởng, Phó kỷ luật và Học sinh</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">Mã định danh / Tài khoản</label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: ADMIN, TT1, PKL, HS01..."
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold text-gray-800 uppercase"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">Mật khẩu</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn..."
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold text-gray-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}</span>
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-gray-400 font-medium">
            Tài khoản mặc định ban đầu: <b className="text-purple-600">ADMIN</b> / <b className="text-purple-600">admin123</b>
          </p>
        </div>
      </div>
    </div>
  )
}