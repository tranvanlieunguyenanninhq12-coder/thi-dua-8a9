'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ShieldAlert, Users, Calendar, Award, BarChart3, Settings, LogOut, Trash2, FileSpreadsheet, ExternalLink, ImageIcon, BookOpen, Home, RefreshCw, Plus, CheckCircle2, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function AdminDashboard() {
  const TEN_LOP_CO_DINH = '8A9'

  const [currentTab, setCurrentTab] = useState('home')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [usersList, setUsersList] = useState<any[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState('hoc_sinh')

  const [selectedClass, setSelectedClass] = useState(TEN_LOP_CO_DINH)
  const [studentsList, setStudentsList] = useState<any[]>([])
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentTeam, setNewStudentTeam] = useState(1)

  const [weeksList, setWeeksList] = useState<any[]>([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [scoresList, setScoresList] = useState<any[]>([])
  const [teamImages, setTeamImages] = useState<any[]>([])
  const [newWeekName, setNewWeekName] = useState('')
  const [newWeekSemester, setNewWeekSemester] = useState('HK1')
  const [newWeekPeriod, setNewWeekPeriod] = useState('GIỮA HỌC KỲ 1')

  const [selectedPeriod, setSelectedPeriod] = useState('GIỮA HỌC KỲ 1')
  const [disciplinaryList, setDisciplinaryList] = useState<any[]>([])
  const [resetPasswordInput, setResetPasswordInput] = useState('')
  
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) { router.push('/login'); return; }
    const user = JSON.parse(userStr)
    if (user.role !== 'admin' && user.role !== 'hoc_sinh') { router.push('/login'); return; }
    setCurrentUser(user)

    setSelectedClass(TEN_LOP_CO_DINH)
    fetchAllData(TEN_LOP_CO_DINH)
  }, [selectedWeek])

  const fetchAllData = async (className?: string) => {
    setLoading(true)
    const clsToFetch = className || TEN_LOP_CO_DINH
    
    const { data: users } = await supabase.from('users').select('*')
    if (users) setUsersList(users)

    const { data: students } = await supabase.from('students').select('*').eq('class_name', clsToFetch).order('full_name', { ascending: true })
    if (students) setStudentsList(students)

    const { data: weeks } = await supabase.from('weeks').select('*')
    if (weeks) {
      setWeeksList(weeks)
      if (weeks.length > 0 && !selectedWeek) setSelectedWeek(weeks[0].id)
    }

    const { data: allScores } = await supabase.from('emulation_scores').select('*')
    if (allScores) setScoresList(allScores)

    const currentWId = selectedWeek || (weeks && weeks.length > 0 ? weeks[0].id : '')
    if (currentWId) {
      const { data: imgData, error } = await supabase.from('team_weekly_images').select('*').eq('week_id', currentWId)
      if (imgData && imgData.length > 0) setTeamImages(imgData)
      else setTeamImages([])
    }

    const { data: disc } = await supabase.from('disciplinary_records').select('*').order('created_at', { ascending: false })
    if (disc) setDisciplinaryList(disc)
    
    setLoading(false)
  }

  const handleLogout = () => { localStorage.removeItem('currentUser'); router.push('/login'); }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const teamNum = newRole.startsWith('to_truong') ? parseInt(newRole.replace('to_truong_', '')) : 0
    const { error } = await supabase.from('users').insert([{
      username: newUsername.trim().toUpperCase(), password: newPassword, full_name: newFullName, role: newRole, team_number: teamNum
    }])
    if (error) alert('Lỗi: Trùng tên tài khoản!')
    else { alert('Tạo thành công!'); setNewUsername(''); setNewPassword(''); setNewFullName(''); fetchAllData(); }
  }

  const handleDeleteUser = async (id: string) => {
    if (confirm('Xóa tài khoản này?')) { await supabase.from('users').delete().eq('id', id); fetchAllData(); }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('students').insert([{ 
      student_code: `HS_${Date.now()}`, full_name: newStudentName, class_name: TEN_LOP_CO_DINH, team_number: newStudentTeam 
    }])
    if (error) alert('Lỗi thêm học sinh!'); else { alert('Thêm thành công!'); setNewStudentName(''); fetchAllData(); }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result
        const wb = XLSX.read(buffer, { type: 'array' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
        
        // Bỏ qua dòng tiêu đề (dòng 1), chỉ lấy dữ liệu
        const rows = data.slice(1).filter((row: any) => row[1]) // row[1] là Họ Tên
        const newStudents = rows.map((row: any, index) => {
          const teamStr = String(row[2] || '1').replace(/\D/g, '') // Tách số từ chữ "Tổ 1"
          const teamNum = parseInt(teamStr) || 1
          return {
            full_name: String(row[1]).trim(),
            team_number: teamNum,
            class_name: TEN_LOP_CO_DINH,
            student_code: `HS_${Date.now()}_${index}`
          }
        })
        if (newStudents.length > 0) {
          const { error } = await supabase.from('students').insert(newStudents)
          if (error) alert('Lỗi cơ sở dữ liệu: ' + error.message)
          else { alert(`Đã nhập thành công ${newStudents.length} học sinh từ Excel!`); fetchAllData(); }
        } else { alert('Không tìm thấy dữ liệu hợp lệ trong file Excel!') }
      } catch (error) { alert('Đã xảy ra lỗi khi đọc file Excel!') }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = '' // Reset input
  }

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Xóa học sinh này?')) { await supabase.from('students').delete().eq('id', id); fetchAllData(); }
  }

  const handleAddWeek = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('weeks').insert([{ week_name: newWeekName, semester: newWeekSemester, period: newWeekPeriod }])
    if (error) alert('Lỗi thêm tuần!'); else { alert('Thêm tuần thành công!'); setNewWeekName(''); fetchAllData(); }
  }

  const getEvaluation = (score: number) => {
    if (score < 50) return 'Y'; if (score <= 64) return 'TB'; if (score <= 79) return 'K'; return 'T';
  }
const handleScoreUpdate = async (studentId: string, scoreVal: number) => {
    const evalVal = getEvaluation(scoreVal)
    const existing = scoresList.find(s => s.student_id === studentId && s.week_id === selectedWeek)
    
    if (existing) {
      await supabase.from('emulation_scores').update({ score: scoreVal, evaluation: evalVal }).eq('id', existing.id)
    } else {
      await supabase.from('emulation_scores').insert([{ student_id: studentId, week_id: selectedWeek, score: scoreVal, evaluation: evalVal }])
    }
    fetchAllData()
  }

  const handleDeleteTeamImage = async (imageId: string) => {
    if (!confirm('Thầy/Cô có chắc chắn muốn xóa ảnh này?')) return
    await supabase.from('team_weekly_images').delete().eq('id', imageId)
    fetchAllData(); alert('Đã xóa ảnh!')
  }

  const handleDeleteDisciplinary = async (id: string) => {
    if (!confirm('Xóa kỷ luật này?')) return
    await supabase.from('disciplinary_records').delete().eq('id', id)
    fetchAllData()
  }

  const exportToExcel = () => {
    let csv = "STT,Họ và Tên,Tổ,Tổng Điểm,Xếp Loại\n"
    studentsList.forEach((st, idx) => {
      const sc = scoresList.find(s => s.student_id === st.id && s.week_id === selectedWeek) || { score: 100, evaluation: 'T' }
      csv += `${idx + 1},"${st.full_name}",Tổ ${st.team_number},${sc.score},${sc.evaluation}\n`
    })
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bao_cao_${TEN_LOP_CO_DINH}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleResetSystem = async () => {
    if (resetPasswordInput !== 'luuvanglien0410') { alert('Sai mật khẩu Admin!'); return; }
    if (confirm('Xóa sạch dữ liệu cũ?')) {
      await supabase.from('emulation_scores').delete().neq('score', -999)
      await supabase.from('disciplinary_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('team_weekly_images').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      alert('Đã làm mới hệ thống!')
      setResetPasswordInput('')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col font-sans selection:bg-pink-200">
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.03)] sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="bg-gradient-to-tr from-purple-500 to-pink-400 text-white p-2.5 rounded-[1.25rem] shadow-lg shadow-pink-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600 tracking-tight">
              {currentUser?.role === 'hoc_sinh' ? 'Tra Cứu Dữ Liệu' : 'Quản Trị Viên'}
            </h1>
            <p className="text-[11px] text-purple-500 font-bold uppercase tracking-wider">GVCN: TRẦN VĂN LIỆU</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {currentTab !== 'home' && (
            <button onClick={() => setCurrentTab('home')} className="bg-white/80 hover:bg-white text-purple-600 px-4 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-sm hover:shadow-md border border-purple-100 flex items-center">
              <Home className="h-4 w-4 mr-1.5" />Trang chủ
            </button>
          )}
          <div className="px-5 py-2.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full font-black text-purple-800 text-xs shadow-inner border border-white/60">
            Lớp: {TEN_LOP_CO_DINH}
          </div>
          <button onClick={handleLogout} className="bg-red-50 hover:bg-red-500 hover:text-white text-red-500 px-4 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center border border-red-100">
            <LogOut className="h-4 w-4 mr-1.5" />Đăng xuất
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {currentTab === 'home' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'results', title: 'Kết quả Thi đua Tuần', icon: Award, desc: 'Chấm điểm và xem ảnh.', isStudentOk: true, color: 'from-pink-400 to-rose-400', shadow: 'shadow-pink-100' },
              { id: 'periods', title: 'Thống kê theo Đợt', icon: BarChart3, desc: 'Tính điểm trung bình cộng.', isStudentOk: true, color: 'from-purple-400 to-indigo-400', shadow: 'shadow-purple-100' },
              { id: 'saodo', title: 'Tra cứu Sao Đỏ', icon: ExternalLink, desc: 'Liên kết tra cứu trường.', isStudentOk: true, color: 'from-blue-400 to-cyan-400', shadow: 'shadow-blue-100' },
              { id: 'teachers', title: 'Sổ kỷ luật GVBM', icon: BookOpen, desc: 'Xem vi phạm bộ môn.', isStudentOk: true, color: 'from-orange-400 to-amber-400', shadow: 'shadow-orange-100' },
              { id: 'accounts', title: 'Quản lý Tài khoản', icon: Users, desc: 'Thêm, sửa, xóa tài khoản.', isStudentOk: false, color: 'from-emerald-400 to-teal-400', shadow: 'shadow-emerald-100' },
              { id: 'students', title: `Danh sách Học sinh`, icon: Users, desc: 'Cập nhật danh sách tổ.', isStudentOk: false, color: 'from-sky-400 to-blue-500', shadow: 'shadow-sky-100' },
              { id: 'weeks', title: 'Thời gian & Tuần', icon: Calendar, desc: 'Thêm tuần và đợt đánh giá.', isStudentOk: false, color: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-100' },
              { id: 'settings', title: 'Cài đặt Dữ liệu', icon: Settings, desc: 'Làm mới dữ liệu hệ thống.', isStudentOk: false, color: 'from-slate-400 to-gray-500', shadow: 'shadow-slate-100' },
            ]
            .filter(c => currentUser?.role === 'admin' || c.isStudentOk)
            .map(c => {
              const Icon = c.icon
              return (
                <div key={c.id} onClick={() => setCurrentTab(c.id)} className="bg-white/60 backdrop-blur-xl p-7 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:bg-white/90 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${c.color} opacity-5 rounded-bl-full transition-transform group-hover:scale-110`} />
                  <div className={`bg-gradient-to-br ${c.color} text-white p-3.5 rounded-2xl w-fit shadow-lg ${c.shadow} transform group-hover:rotate-6 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">{c.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1.5">{c.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {currentTab === 'accounts' && currentUser?.role === 'admin' && (
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-8">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Cấp tài khoản mới</h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input type="text" placeholder="Mã TK" value={newUsername} onChange={e => setNewUsername(e.target.value)} required className="px-5 py-3.5 bg-white/80 border border-purple-100 rounded-full text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner" />
              <input type="text" placeholder="Mật khẩu" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="px-5 py-3.5 bg-white/80 border border-purple-100 rounded-full text-xs font-bold outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner" />
              <input type="text" placeholder="Họ tên" value={newFullName} onChange={e => setNewFullName(e.target.value)} required className="px-5 py-3.5 bg-white/80 border border-purple-100 rounded-full text-xs font-bold outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner" />
              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="px-5 py-3.5 bg-white/80 border border-purple-100 rounded-full text-xs font-bold outline-none cursor-pointer focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner text-slate-700">
                <option value="hoc_sinh">Học sinh (Chỉ xem)</option>
                <option value="to_truong_1">Tổ trưởng 1</option>
                <option value="to_truong_2">Tổ trưởng 2</option>
                <option value="to_truong_3">Tổ trưởng 3</option>
                <option value="to_truong_4">Tổ trưởng 4</option>
                <option value="pho_ky_luat">Phó kỷ luật</option>
              </select>
              <button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-extrabold px-6 py-3.5 rounded-full shadow-lg shadow-pink-200 transition transform hover:-translate-y-1 cursor-pointer flex items-center justify-center">
                <Plus className="h-4 w-4 mr-1.5"/>Tạo mới
              </button>
            </form>
            <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white/50 backdrop-blur-sm shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-purple-100/50 text-purple-800 text-xs font-extrabold tracking-wide"><th className="p-5 pl-8">STT</th><th className="p-5">Mã TK</th><th className="p-5">Họ tên</th><th className="p-5">Quyền</th><th className="p-5 text-center pr-8">Xóa</th></tr></thead>
                <tbody className="divide-y divide-purple-50 text-xs font-medium text-slate-700">
                  {usersList.map((u, i) => (
                    <tr key={u.id} className="hover:bg-white/80 transition-colors"><td className="p-5 pl-8 font-bold text-slate-500">{i+1}</td><td className="p-5 font-extrabold text-pink-600">{u.username}</td><td className="p-5">{u.full_name}</td><td className="p-5 uppercase text-[11px] font-bold text-indigo-500">{u.role}</td><td className="p-5 text-center pr-8">{u.username !== 'ADMIN' && (<button onClick={() => handleDeleteUser(u.id)} className="text-rose-400 hover:text-white hover:bg-rose-500 p-2.5 rounded-full transition-all cursor-pointer shadow-sm"><Trash2 className="h-4 w-4 mx-auto" /></button>)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
{currentTab === 'students' && currentUser?.role === 'admin' && (
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-8">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Thêm học sinh lớp {TEN_LOP_CO_DINH}</h3>
            
            <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <input type="text" placeholder="Nhập Họ Tên HS thủ công..." value={newStudentName} onChange={e => setNewStudentName(e.target.value)} required className="md:col-span-6 px-5 py-3.5 bg-white/80 border border-purple-100 rounded-full text-xs font-bold outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner" />
              <select value={newStudentTeam} onChange={e => setNewStudentTeam(parseInt(e.target.value))} className="md:col-span-2 px-5 py-3.5 bg-white/80 border border-purple-100 rounded-full text-xs font-bold outline-none cursor-pointer focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner text-slate-700">
                <option value={1}>Tổ 1</option><option value={2}>Tổ 2</option><option value={3}>Tổ 3</option><option value={4}>Tổ 4</option>
              </select>
              <div className="md:col-span-4 flex space-x-2">
                <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-extrabold px-3 py-3.5 rounded-full shadow-lg shadow-indigo-200 transition transform hover:-translate-y-1 cursor-pointer flex items-center justify-center text-xs">
                  <Plus className="h-4 w-4 mr-1.5"/>Thêm
                </button>
                <label className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold px-3 py-3.5 rounded-full shadow-lg shadow-teal-200 transition transform hover:-translate-y-1 cursor-pointer flex items-center justify-center text-xs text-center">
                  <Upload className="h-4 w-4 mr-1.5"/> Excel
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </form>
            
            <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white/50 backdrop-blur-sm shadow-sm mt-6">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-purple-100/50 text-purple-800 text-xs font-extrabold tracking-wide"><th className="p-5 pl-8 w-24">STT</th><th className="p-5">Họ tên</th><th className="p-5">Tổ</th><th className="p-5 text-center pr-8 w-24">Xóa</th></tr></thead>
                <tbody className="divide-y divide-purple-50 text-xs font-medium text-slate-700">
                  {studentsList.map((st, i) => (
                    <tr key={st.id} className="hover:bg-white/80 transition-colors">
                      <td className="p-5 pl-8 font-bold text-slate-500">{i+1}</td>
                      <td className="p-5 font-bold text-slate-800">{st.full_name}</td>
                      <td className="p-5 font-semibold text-pink-600">Tổ {st.team_number}</td>
                      <td className="p-5 text-center pr-8"><button onClick={() => handleDeleteStudent(st.id)} className="text-rose-400 hover:text-white hover:bg-rose-500 p-2.5 rounded-full transition-all cursor-pointer shadow-sm"><Trash2 className="h-4 w-4 mx-auto" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'weeks' && currentUser?.role === 'admin' && (
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-8">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Thêm Tuần & Thời Gian</h3>
            <form onSubmit={handleAddWeek} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="text" placeholder="VD: Tuần 1 - 07/09" value={newWeekName} onChange={e => setNewWeekName(e.target.value)} required className="px-5 py-3.5 bg-white/80 border border-purple-100 rounded-full text-xs font-bold outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner" />
              <select value={newWeekSemester} onChange={e => setNewWeekSemester(e.target.value)} className="px-5 py-3.5 bg-white/80 border border-purple-100 rounded-full text-xs font-bold outline-none cursor-pointer focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner text-slate-700">
                <option value="HK1">HK1</option><option value="HK2">HK2</option>
              </select>
              <select value={newWeekPeriod} onChange={e => setNewWeekPeriod(e.target.value)} className="px-5 py-3.5 bg-white/80 border border-purple-100 rounded-full text-xs font-bold outline-none cursor-pointer focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner text-slate-700">
                <option value="GIỮA HỌC KỲ 1">GIỮA HỌC KỲ 1</option><option value="HỌC KỲ 1">HỌC KỲ 1</option><option value="GIỮA HỌC KỲ 2">GIỮA HỌC KỲ 2</option><option value="HỌC KỲ 2">HỌC KỲ 2</option>
              </select>
              <button type="submit" className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold px-6 py-3.5 rounded-full shadow-lg shadow-emerald-200 transition transform hover:-translate-y-1 cursor-pointer flex items-center justify-center">
                <Plus className="h-4 w-4 mr-1.5"/>Tạo tuần
              </button>
            </form>
            <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white/50 backdrop-blur-sm shadow-sm mt-6">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-purple-100/50 text-purple-800 text-xs font-extrabold tracking-wide"><th className="p-5 pl-8">STT</th><th className="p-5">Tên Tuần</th><th className="p-5">Học Kỳ</th><th className="p-5">Đợt</th><th className="p-5 text-center pr-8">Xóa</th></tr></thead>
                <tbody className="divide-y divide-purple-50 text-xs font-medium text-slate-700">
                  {weeksList.map((w, i) => (
                    <tr key={w.id} className="hover:bg-white/80 transition-colors"><td className="p-5 pl-8 font-bold text-slate-500">{i+1}</td><td className="p-5 font-extrabold text-indigo-600">{w.week_name}</td><td className="p-5 font-bold">{w.semester}</td><td className="p-5 font-semibold text-pink-600">{w.period}</td><td className="p-5 text-center pr-8"><button onClick={async () => { if(confirm('Xóa tuần?')){ await supabase.from('weeks').delete().eq('id', w.id); fetchAllData(); } }} className="text-rose-400 hover:text-white hover:bg-rose-500 p-2.5 rounded-full transition-all cursor-pointer shadow-sm"><Trash2 className="h-4 w-4 mx-auto" /></button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <span className="text-sm font-extrabold text-slate-700">Chọn Tuần:</span>
                <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className="px-5 py-3 bg-white border border-purple-100 rounded-full font-bold text-purple-800 text-xs cursor-pointer outline-none w-full md:w-auto shadow-sm focus:ring-4 focus:ring-purple-500/20 transition-all">
                  {weeksList.map(w => (<option key={w.id} value={w.id}>{w.week_name} ({w.period})</option>))}
                </select>
                <button onClick={() => fetchAllData()} className="bg-white hover:bg-indigo-50 text-indigo-600 font-extrabold px-5 py-3 rounded-full text-xs transition cursor-pointer flex items-center border border-indigo-100 shadow-sm hover:shadow-md">
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Đồng bộ
                </button>
              </div>
              {currentUser?.role === 'admin' && (
                <button onClick={exportToExcel} className="w-full md:w-auto bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-extrabold px-7 py-3 rounded-full shadow-lg shadow-green-200 transition transform hover:-translate-y-1 cursor-pointer flex items-center justify-center text-xs">
                  <FileSpreadsheet className="h-4 w-4 mr-1.5 inline" />Xuất Excel Báo Cáo
                </button>
              )}
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
              <h3 className="text-xl font-extrabold text-slate-800 mb-6 tracking-tight">Thư viện ảnh minh chứng</h3>
              {teamImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {teamImages.map((img) => (
                    <div key={img.id || Math.random()} className="bg-white/80 p-3 rounded-[1.5rem] border border-purple-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center group">
                      <div className="w-full h-36 mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white relative">
                         <img src={img.image_url} alt="Minh chứng" className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition duration-500" onClick={() => { setZoom(1); setRotation(0); setPreviewImage(img.image_url); }} />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                      </div>
                      <span className="text-xs font-extrabold text-purple-800 mb-3 bg-purple-50 px-4 py-1.5 rounded-full">
                        Nguồn: Tổ {img.team_number || img.target_team || '?'}
                      </span>
                      <div className="flex w-full space-x-2">
                        <button onClick={() => { setZoom(1); setRotation(0); setPreviewImage(img.image_url); }} className="flex-1 bg-indigo-50 hover:bg-indigo-500 hover:text-white text-indigo-600 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer">Xem</button>
                        {currentUser?.role !== 'hoc_sinh' && (
                          <button onClick={() => handleDeleteTeamImage(img.id)} className="flex-1 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer">Xóa</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 bg-white/50 rounded-[2rem] border-2 border-dashed border-purple-100">
                  <p className="text-sm font-bold text-slate-400">Chưa có ảnh minh chứng nào trong tuần này.</p>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100/80 to-pink-100/80 text-purple-900 text-xs font-extrabold tracking-wide">
                    <th className="p-5 pl-8">STT</th><th className="p-5">Họ tên</th><th className="p-5">Tổ</th><th className="p-5">Điểm</th><th className="p-5 pr-8">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 text-xs font-medium text-slate-700">
                  {studentsList.map((st, i) => {
                    const sc = scoresList.find(s => s.student_id === st.id && s.week_id === selectedWeek) || { score: 100, evaluation: 'T' }
                    return (
                      <tr key={st.id} className="hover:bg-white/90 transition-colors">
                        <td className="p-5 pl-8 font-bold text-slate-400">{i+1}</td>
                        <td className="p-5 font-extrabold text-slate-800">{st.full_name}</td>
                        <td className="p-5 font-bold text-pink-500">Tổ {st.team_number}</td>
                        <td className="p-5">
                          <input type="number" disabled={currentUser?.role === 'hoc_sinh'} value={sc.score} onChange={e => handleScoreUpdate(st.id, parseFloat(e.target.value) || 0)} className="w-24 px-4 py-2 bg-white border border-purple-100 rounded-full font-bold text-center text-indigo-700 outline-none focus:ring-4 focus:ring-purple-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 transition-all shadow-inner cursor-pointer disabled:cursor-not-allowed" />
                        </td>
                        <td className="p-5 pr-8 font-extrabold">
                          <span className={`px-4 py-2 rounded-full text-xs shadow-sm ${sc.evaluation === 'T' ? 'bg-emerald-100 text-emerald-700' : sc.evaluation === 'K' ? 'bg-sky-100 text-sky-700' : sc.evaluation === 'TB' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{sc.evaluation}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'periods' && (
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-6">
            <div className="flex items-center space-x-4 w-full md:w-auto pb-4">
              <span className="text-sm font-extrabold text-slate-700">Chọn Đợt Thống Kê:</span>
              <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="px-5 py-3 bg-white border border-purple-100 rounded-full font-bold text-purple-800 text-xs outline-none cursor-pointer shadow-sm focus:ring-4 focus:ring-purple-500/20 transition-all">
                <option value="GIỮA HỌC KỲ 1">GIỮA HỌC KỲ 1</option><option value="HỌC KỲ 1">HỌC KỲ 1</option><option value="GIỮA HỌC KỲ 2">GIỮA HỌC KỲ 2</option><option value="HỌC KỲ 2">HỌC KỲ 2</option><option value="CẢ NĂM">CẢ NĂM</option>
              </select>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white/50 backdrop-blur-sm shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-purple-100/50 text-purple-900 text-xs font-extrabold tracking-wide">
                    <th className="p-5 pl-8">STT</th><th className="p-5">Họ tên</th><th className="p-5">Tổ</th><th className="p-5">Chi tiết điểm</th><th className="p-5 text-center">Điểm TB</th><th className="p-5 text-center pr-8">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 text-xs font-medium text-slate-700">
                  {studentsList.map((st, i) => {
                    const filteredWeeks = weeksList.filter(w => {
                      const pUp = (w.period || '').toUpperCase(); const nUp = (w.week_name || '').toUpperCase();
                      if (selectedPeriod === 'GIỮA HỌC KỲ 1') return pUp.includes('GIỮA HỌC KỲ 1') || nUp.includes('GIỮA HỌC KỲ 1');
                      if (selectedPeriod === 'HỌC KỲ 1') return w.semester === 'HK1' || pUp.includes('HỌC KỲ 1') || nUp.includes('HỌC KỲ 1');
                      if (selectedPeriod === 'GIỮA HỌC KỲ 2') return pUp.includes('GIỮA HỌC KỲ 2') || nUp.includes('GIỮA HỌC KỲ 2');
                      if (selectedPeriod === 'HỌC KỲ 2') return w.semester === 'HK2' || pUp.includes('HỌC KỲ 2') || nUp.includes('HỌC KỲ 2');
                      if (selectedPeriod === 'CẢ NĂM') return true;
                      return false;
                    });
                    const weekIds = filteredWeeks.map(w => w.id)
                    const studentScoresInPeriod = weeksList.map(w => {
                      if (!weekIds.includes(w.id)) return null;
                      const found = scoresList.find(s => s.student_id === st.id && s.week_id === w.id);
                      return { weekName: w.week_name, score: found ? found.score : 100 };
                    }).filter(Boolean) as { weekName: string; score: number }[];

                    const avgScore = studentScoresInPeriod.length > 0 ? Math.round(studentScoresInPeriod.reduce((acc, curr) => acc + curr.score, 0) / studentScoresInPeriod.length) : 100
                    const evalPeriod = getEvaluation(avgScore)
                    const badgeCls = evalPeriod === 'T' ? 'bg-emerald-100 text-emerald-700' : evalPeriod === 'K' ? 'bg-sky-100 text-sky-700' : evalPeriod === 'TB' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'

                    return (
                      <tr key={st.id} className="hover:bg-white/80 transition-colors">
                        <td className="p-5 pl-8 font-bold text-slate-400">{i+1}</td>
                        <td className="p-5 font-extrabold text-slate-800">{st.full_name}</td>
                        <td className="p-5 font-bold text-pink-500">Tổ {st.team_number}</td>
                        <td className="p-5 text-slate-500 text-[11px] leading-relaxed">{studentScoresInPeriod.map(item => `${item.weekName}: ${item.score}đ`).join(' | ')}</td>
                        <td className="p-5 text-center font-extrabold text-indigo-700 text-sm">{avgScore}</td>
                        <td className="p-5 text-center pr-8 font-extrabold"><span className={`px-4 py-2 rounded-full text-xs shadow-sm ${badgeCls}`}>{evalPeriod}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'saodo' && (
          <div className="bg-white/70 backdrop-blur-xl p-14 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white text-center space-y-8 max-w-2xl mx-auto mt-10">
            <div className="bg-gradient-to-tr from-cyan-400 to-blue-400 text-white p-5 rounded-[2rem] w-fit mx-auto shadow-lg shadow-cyan-200 transform rotate-3"><ExternalLink className="h-12 w-12" /></div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Hệ Thống Tra Cứu</h3>
            <p className="text-sm font-medium text-slate-500 pb-2">Truy cập hệ thống tổng hợp vi phạm nề nếp của trường.</p>
            <a href="https://thiduanamhoc2627.netlify.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-extrabold px-10 py-4 rounded-full shadow-xl shadow-cyan-200 transition transform hover:-translate-y-1 text-sm"><span>Mở trang tra cứu</span><ExternalLink className="h-4 w-4" /></a>
          </div>
        )}

        {currentTab === 'teachers' && (
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-6">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Sổ Kỷ Luật Giáo Viên Bộ Môn</h3>
            <div className="space-y-4">
              {disciplinaryList.map(d => (
                <div key={d.id} className="p-6 bg-white/80 border border-purple-50 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-800 leading-relaxed">{d.content}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Giáo viên ghi nhận: <b className="text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full">{d.teacher_name || 'Không rõ'}</b></p>
                  </div>
                  <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                    {d.image_url && (
                      <button onClick={() => { setZoom(1); setRotation(0); setPreviewImage(d.image_url); }} className="text-pink-600 text-xs bg-pink-50 hover:bg-pink-500 hover:text-white px-5 py-3 rounded-full font-bold cursor-pointer transition-all flex items-center shadow-sm"><ImageIcon className="h-4 w-4 mr-2"/>Xem ảnh minh chứng</button>
                    )}
                    {currentUser?.role !== 'hoc_sinh' && (
                      <button onClick={() => handleDeleteDisciplinary(d.id)} className="bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 p-3 rounded-full cursor-pointer transition-all shadow-sm"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
              ))}
              {disciplinaryList.length === 0 && (
                <div className="text-center py-14 border-2 border-dashed border-purple-100 rounded-[2rem] bg-white/50">
                  <p className="text-sm font-bold text-slate-400">Chưa có bản ghi kỷ luật nào.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'settings' && currentUser?.role === 'admin' && (
          <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-6 max-w-xl mx-auto mt-10">
            <h3 className="text-xl font-black text-rose-500 flex items-center tracking-tight"><ShieldAlert className="h-6 w-6 mr-2.5"/>Làm mới Hệ thống</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">Hành động này sẽ xóa sạch toàn bộ điểm số, ảnh minh chứng và sổ kỷ luật hiện tại. Vui lòng nhập mật khẩu Admin để xác nhận thiết lập lại.</p>
            <input type="password" placeholder="Nhập mật khẩu Admin..." value={resetPasswordInput} onChange={e => setResetPasswordInput(e.target.value)} className="w-full px-5 py-4 bg-white/80 border border-rose-100 rounded-full text-xs font-bold outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/20 transition-all shadow-inner" />
            <button onClick={handleResetSystem} className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-extrabold py-4 rounded-full shadow-lg shadow-rose-200 transition transform hover:-translate-y-1 cursor-pointer flex items-center justify-center text-sm">
              <Trash2 className="h-4 w-4 mr-2"/>Xác Nhận Xóa Dữ Liệu
            </button>
          </div>
        )}
      </main>

      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-xl transition-opacity">
          <div className="absolute top-6 right-6 flex space-x-3 bg-white/10 p-2.5 rounded-full backdrop-blur-2xl border border-white/20 shadow-2xl">
            <button onClick={() => setZoom(z => z + 0.2)} className="hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all">Phóng to (+)</button>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all">Thu nhỏ (-)</button>
            <button onClick={() => setRotation(r => (r + 90) % 360)} className="hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all">Xoay 90°</button>
            <button onClick={() => setPreviewImage(null)} className="bg-rose-500 hover:bg-rose-600 text-white px-7 py-2.5 rounded-full text-xs font-extrabold cursor-pointer transition-all shadow-lg ml-2">Đóng (X)</button>
          </div>
          <div className="overflow-auto max-w-full max-h-[85vh] flex items-center justify-center p-2 mt-16">
            <img src={previewImage} alt="Xem chi tiết" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} className="max-h-[75vh] object-contain rounded-[2rem] shadow-2xl ring-8 ring-white/20" />
          </div>
        </div>
      )}
    </div>
  )
}