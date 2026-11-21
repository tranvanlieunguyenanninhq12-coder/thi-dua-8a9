'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Award, BarChart3, ExternalLink, BookOpen, LogOut, Home, ImageIcon, RefreshCw } from 'lucide-react'

export default function StudentDashboard() {
  const TEN_LOP_CO_DINH = '8A9'

  const [currentTab, setCurrentTab] = useState('home')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [studentsList, setStudentsList] = useState<any[]>([])
  const [weeksList, setWeeksList] = useState<any[]>([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [scoresList, setScoresList] = useState<any[]>([])
  const [teamImages, setTeamImages] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('GIỮA HỌC KỲ 1')
  const [disciplinaryList, setDisciplinaryList] = useState<any[]>([])

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) { router.push('/login'); return; }
    const user = JSON.parse(userStr)
    if (user.role !== 'hoc_sinh') { router.push('/login'); return; }
    setCurrentUser(user)
    fetchAllData()
  }, [selectedWeek])

  const fetchAllData = async () => {
    setLoading(true)
    const { data: students } = await supabase.from('students').select('*').eq('class_name', TEN_LOP_CO_DINH).order('full_name', { ascending: true })
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
      const { data: imgData } = await supabase.from('team_weekly_images').select('*').eq('week_id', currentWId)
      if (imgData) setTeamImages(imgData)
      else setTeamImages([])
    }

    const { data: disc } = await supabase.from('disciplinary_records').select('*').order('created_at', { ascending: false })
    if (disc) setDisciplinaryList(disc)

    setLoading(false)
  }

  const getEvaluation = (score: number) => {
    if (score < 50) return 'Y'; if (score <= 64) return 'TB'; if (score <= 79) return 'K'; return 'T';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col font-sans selection:bg-pink-200">
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2 shadow-[0_4px_30px_rgba(0,0,0,0.03)] sticky top-0 z-40">
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          <div className="bg-gradient-to-tr from-purple-500 to-pink-400 text-white p-2 sm:p-2.5 rounded-[1.25rem] shadow-lg shadow-pink-200">
            <Award className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600 tracking-tight">
              Không Gian Học Sinh
            </h1>
            <p className="text-[10px] sm:text-[11px] text-purple-500 font-bold uppercase tracking-wider">Lớp {TEN_LOP_CO_DINH} — Xin chào, {currentUser?.full_name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {currentTab !== 'home' && (
            <button onClick={() => setCurrentTab('home')} className="bg-white/80 hover:bg-white text-purple-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-sm hover:shadow-md border border-purple-100 flex items-center">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />Trang chủ
            </button>
          )}
          <button onClick={() => { localStorage.removeItem('currentUser'); router.push('/login'); }} className="bg-red-50 hover:bg-red-500 hover:text-white text-red-500 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center border border-red-100">
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />Đăng xuất
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-2.5 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        {currentTab === 'home' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { id: 'results', title: 'Kết quả Thi đua Tuần', icon: Award, desc: 'Xem điểm và thư viện ảnh.', color: 'from-pink-400 to-rose-400', shadow: 'shadow-pink-100' },
              { id: 'periods', title: 'Thống kê theo Đợt', icon: BarChart3, desc: 'Xem điểm trung bình cộng.', color: 'from-purple-400 to-indigo-400', shadow: 'shadow-purple-100' },
              { id: 'saodo', title: 'Tra cứu Sao Đỏ', icon: ExternalLink, desc: 'Liên kết tra cứu trường.', isLink: true, color: 'from-blue-400 to-cyan-400', shadow: 'shadow-blue-100' },
              { id: 'teachers', title: 'Sổ kỷ luật GVBM', icon: BookOpen, desc: 'Xem vi phạm bộ môn.', color: 'from-orange-400 to-amber-400', shadow: 'shadow-orange-100' },
            ].map(c => {
              const Icon = c.icon
              if (c.isLink) {
                return (
                  <a key={c.id} href="https://thiduanamhoc2627.netlify.app/" target="_blank" rel="noopener noreferrer" className="bg-white/60 backdrop-blur-xl p-6 sm:p-7 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:bg-white/90 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 group relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${c.color} opacity-5 rounded-bl-full transition-transform group-hover:scale-110`} />
                    <div className={`bg-gradient-to-br ${c.color} text-white p-3.5 rounded-2xl w-fit shadow-lg ${c.shadow} transform group-hover:rotate-6 transition-transform`}><Icon className="h-6 w-6" /></div>
                    <div><h3 className="font-extrabold text-slate-800 text-lg tracking-tight">{c.title}</h3><p className="text-xs text-slate-500 font-medium mt-1.5">{c.desc}</p></div>
                  </a>
                )
              }
              return (
                <div key={c.id} onClick={() => setCurrentTab(c.id)} className="bg-white/60 backdrop-blur-xl p-6 sm:p-7 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:bg-white/90 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${c.color} opacity-5 rounded-bl-full transition-transform group-hover:scale-110`} />
                  <div className={`bg-gradient-to-br ${c.color} text-white p-3.5 rounded-2xl w-fit shadow-lg ${c.shadow} transform group-hover:rotate-6 transition-transform`}><Icon className="h-6 w-6" /></div>
                  <div><h3 className="font-extrabold text-slate-800 text-lg tracking-tight">{c.title}</h3><p className="text-xs text-slate-500 font-medium mt-1.5">{c.desc}</p></div>
                </div>
              )
            })}
          </div>
        )}

        {currentTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-xl p-4 sm:p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm font-extrabold text-slate-700 whitespace-nowrap">Chọn Tuần Xem:</span>
              <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-purple-100 rounded-full font-bold text-purple-800 text-xs cursor-pointer outline-none flex-1 md:w-auto shadow-sm focus:ring-4 focus:ring-purple-500/20 transition-all">
                {weeksList.map(w => (<option key={w.id} value={w.id}>{w.week_name} ({w.period})</option>))}
              </select>
              <button onClick={() => fetchAllData()} className="bg-white hover:bg-indigo-50 text-indigo-600 font-extrabold px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs transition cursor-pointer flex items-center border border-indigo-100 shadow-sm hover:shadow-md whitespace-nowrap">
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Tải lại
              </button>
            </div>

            <div className="bg-white/70 backdrop-blur-xl p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-4 sm:mb-6 tracking-tight">Thư viện ảnh minh chứng</h3>
              {teamImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                  {teamImages.map((img) => (
                    <div key={img.id || Math.random()} className="bg-white/80 p-2.5 sm:p-3 rounded-[1.5rem] border border-purple-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center group">
                      <div className="w-full h-32 sm:h-36 mb-3 sm:mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white relative">
                        <img src={img.image_url} alt="Minh chứng" className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition duration-500" onClick={() => { setZoom(1); setRotation(0); setPreviewImage(img.image_url); }} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                      </div>
                      <span className="text-xs font-extrabold text-purple-800 mb-2.5 sm:mb-3 bg-purple-50 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full">
                        Tổ {img.team_number || img.target_team || 'Không rõ'}
                      </span>
                      <button onClick={() => { setZoom(1); setRotation(0); setPreviewImage(img.image_url); }} className="w-full bg-indigo-50 hover:bg-indigo-500 hover:text-white text-indigo-600 font-bold py-2 sm:py-2.5 rounded-xl text-xs transition-all cursor-pointer">Xem chi tiết</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 sm:py-14 bg-white/50 rounded-[2rem] border-2 border-dashed border-purple-100">
                  <p className="text-xs sm:text-sm font-bold text-slate-400">Chưa có ảnh minh chứng nào được tải lên trong tuần này.</p>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl sm:rounded-[2rem] border border-purple-200 bg-white/85 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 text-[11px] sm:text-xs font-extrabold tracking-tight">
                    <th className="w-[10%] sm:w-16 py-3 sm:py-4 px-1 sm:px-3 text-center border border-purple-200">STT</th>
                    <th className="w-[38%] sm:w-auto py-3 sm:py-4 px-2 sm:px-4 border border-purple-200">Họ tên</th>
                    <th className="w-[14%] sm:w-24 py-3 sm:py-4 px-1 sm:px-3 text-center border border-purple-200">Tổ</th>
                    <th className="w-[20%] sm:w-32 py-3 sm:py-4 px-1 sm:px-3 text-center border border-purple-200 leading-tight">Tổng điểm</th>
                    <th className="w-[18%] sm:w-28 py-3 sm:py-4 px-1 sm:px-3 text-center border border-purple-200 leading-tight">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] sm:text-xs font-medium text-slate-700">
                  {studentsList.map((st, i) => {
                    const sc = scoresList.find(s => s.student_id === st.id && s.week_id === selectedWeek) || { score: 100, evaluation: 'T' }
                    return (
                      <tr key={st.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center font-bold text-slate-500 border border-purple-200">{i+1}</td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-extrabold text-slate-800 border border-purple-200 break-words leading-snug">{st.full_name}</td>
                        <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center font-bold text-pink-600 border border-purple-200 whitespace-nowrap">Tổ {st.team_number}</td>
                        <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center font-extrabold text-indigo-700 text-xs sm:text-sm border border-purple-200">{sc.score}</td>
                        <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center font-extrabold border border-purple-200">
                          <span className={`inline-block px-2 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs shadow-sm ${sc.evaluation === 'T' ? 'bg-emerald-100 text-emerald-700' : sc.evaluation === 'K' ? 'bg-sky-100 text-sky-700' : sc.evaluation === 'TB' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{sc.evaluation}</span>
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
          <div className="bg-white/70 backdrop-blur-xl p-3 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-center gap-2 sm:space-x-4 w-full md:w-auto pb-2 sm:pb-4 px-1">
              <span className="text-xs sm:text-sm font-extrabold text-slate-700">Chọn Đợt Thống Kê:</span>
              <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-purple-100 rounded-full font-bold text-purple-800 text-xs outline-none cursor-pointer shadow-sm focus:ring-4 focus:ring-purple-500/20 transition-all">
                <option value="GIỮA HỌC KỲ 1">GIỮA HỌC KỲ 1</option><option value="HỌC KỲ 1">HỌC KỲ 1</option><option value="GIỮA HỌC KỲ 2">GIỮA HỌC KỲ 2</option><option value="HỌC KỲ 2">HỌC KỲ 2</option><option value="CẢ NĂM">CẢ NĂM</option>
              </select>
            </div>
            <div className="overflow-hidden rounded-2xl sm:rounded-[2rem] border border-purple-200 bg-white/85 backdrop-blur-sm shadow-sm">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 text-[11px] sm:text-xs font-extrabold tracking-tight">
                    <th className="w-[10%] sm:w-16 py-3 sm:py-4 px-1 sm:px-3 text-center border border-purple-200">STT</th>
                    <th className="w-[40%] sm:w-auto py-3 sm:py-4 px-2 sm:px-4 border border-purple-200">Họ tên</th>
                    <th className="w-[14%] sm:w-24 py-3 sm:py-4 px-1 sm:px-3 text-center border border-purple-200">Tổ</th>
                    <th className="hidden py-3 sm:py-4 px-3 border border-purple-200">Chi tiết điểm</th>
                    <th className="w-[18%] sm:w-28 py-3 sm:py-4 px-1 sm:px-3 text-center border border-purple-200 leading-tight">Điểm TB</th>
                    <th className="w-[18%] sm:w-28 py-3 sm:py-4 px-1 sm:px-3 text-center border border-purple-200 leading-tight">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] sm:text-xs font-medium text-slate-700">
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
                      <tr key={st.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center font-bold text-slate-500 border border-purple-200">{i+1}</td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-extrabold text-slate-800 border border-purple-200 break-words leading-snug">{st.full_name}</td>
                        <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center font-bold text-pink-600 border border-purple-200 whitespace-nowrap">Tổ {st.team_number}</td>
                        <td className="hidden py-3 px-4 text-slate-500 text-[11px] leading-relaxed border border-purple-200">{studentScoresInPeriod.map(item => `${item.weekName}: ${item.score}đ`).join(' | ')}</td>
                        <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center font-extrabold text-indigo-700 text-xs sm:text-sm border border-purple-200">{avgScore}</td>
                        <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center font-extrabold border border-purple-200"><span className={`inline-block px-2 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs shadow-sm ${badgeCls}`}>{evalPeriod}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'teachers' && (
          <div className="bg-white/70 backdrop-blur-xl p-5 sm:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-6">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Sổ Kỷ Luật Giáo Viên Bộ Môn</h3>
            <div className="space-y-4">
              {disciplinaryList.map(d => (
                <div key={d.id} className="p-5 sm:p-6 bg-white/80 border border-purple-50 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-800 leading-relaxed">{d.content}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Giáo viên ghi nhận: <b className="text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full">{d.teacher_name || 'Không rõ'}</b></p>
                  </div>
                  <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                    {d.image_url && (
                      <button onClick={() => { setZoom(1); setRotation(0); setPreviewImage(d.image_url); }} className="text-pink-600 text-xs bg-pink-50 hover:bg-pink-500 hover:text-white px-5 py-3 rounded-full font-bold cursor-pointer transition-all flex items-center shadow-sm"><ImageIcon className="h-4 w-4 mr-2"/>Xem ảnh minh chứng</button>
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
      </main>

      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-xl transition-opacity">
          <div className="absolute top-6 right-6 flex flex-wrap justify-end gap-2 sm:space-x-3 bg-white/10 p-2.5 rounded-3xl sm:rounded-full backdrop-blur-2xl border border-white/20 shadow-2xl">
            <button onClick={() => setZoom(z => z + 0.2)} className="hover:bg-white/20 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all">Phóng to (+)</button>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="hover:bg-white/20 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all">Thu nhỏ (-)</button>
            <button onClick={() => setRotation(r => (r + 90) % 360)} className="hover:bg-white/20 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all">Xoay 90°</button>
            <button onClick={() => setPreviewImage(null)} className="bg-rose-500 hover:bg-rose-600 text-white px-6 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs font-extrabold cursor-pointer transition-all shadow-lg ml-1 sm:ml-2">Đóng (X)</button>
          </div>
          <div className="overflow-auto max-w-full max-h-[85vh] flex items-center justify-center p-2 mt-20 sm:mt-16">
            <img src={previewImage} alt="Xem chi tiết" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} className="max-h-[75vh] object-contain rounded-[2rem] shadow-2xl ring-8 ring-white/20" />
          </div>
        </div>
      )}
    </div>
  )
}