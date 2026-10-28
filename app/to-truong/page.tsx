'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Award, LogOut, Upload, CheckCircle2, ImageIcon, Trash2 } from 'lucide-react'

export default function ToTruongDashboard() {
  const TEN_LOP_CO_DINH = '8A9' 

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [targetTeam, setTargetTeam] = useState<number>(0)
  const [students, setStudents] = useState<any[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [scores, setScores] = useState<{ [key: string]: { score: number; eval: string } }>({})
  const [teamImage, setTeamImage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) { router.push('/login'); return; }
    const user = JSON.parse(userStr)
    if (!user.role.startsWith('to_truong_')) { router.push('/login'); return; }
    setCurrentUser(user)

    const tNum = user.team_number
    let mappedTarget = 1
    if (tNum === 1) mappedTarget = 2
    else if (tNum === 2) mappedTarget = 1
    else if (tNum === 3) mappedTarget = 4
    else if (tNum === 4) mappedTarget = 3

    setTargetTeam(mappedTarget)
    fetchInitialData(mappedTarget)
  }, [])

  const fetchInitialData = async (targetT: number) => {
    setLoading(true)
    const { data: weeksData } = await supabase.from('weeks').select('*')
    if (weeksData && weeksData.length > 0) {
      setWeeks(weeksData)
      setSelectedWeek(weeksData[0].id)
      fetchDataForWeek(targetT, weeksData[0].id)
    }
    setLoading(false)
  }

  const fetchDataForWeek = async (targetT: number, weekId: string) => {
    const { data: studentsData } = await supabase.from('students').select('*')
      .eq('class_name', TEN_LOP_CO_DINH).eq('team_number', targetT).order('full_name', { ascending: true })
    if (studentsData) setStudents(studentsData)

    const { data: scoresData } = await supabase.from('emulation_scores').select('*').eq('week_id', weekId)
    if (scoresData) {
      const scoreMap: any = {}
      scoresData.forEach((s: any) => { scoreMap[s.student_id] = { score: s.score, eval: s.evaluation } })
      setScores(scoreMap)
    }

    const { data: imgData } = await supabase.from('team_weekly_images').select('*').eq('week_id', weekId).eq('team_number', targetT)
    if (imgData && imgData.length > 0) {
        setTeamImage(imgData[0].image_url)
    } else {
        setTeamImage('')
    }
  }

  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId)
    fetchDataForWeek(targetTeam, weekId)
  }

  const calculateEvaluation = (score: number) => {
    if (score < 50) return 'Y'; if (score <= 64) return 'TB'; if (score <= 79) return 'K'; return 'T';
  }

  const handleScoreChange = (studentId: string, val: string) => {
    const num = parseFloat(val) || 0
    const ev = calculateEvaluation(num)
    setScores(prev => ({ ...prev, [studentId]: { score: num, eval: ev } }))
  }

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width; let height = img.height; const maxDimension = 1200
          if (width > height && width > maxDimension) { height = (height * maxDimension) / width; width = maxDimension } 
          else if (height > maxDimension) { width = (width * maxDimension) / height; height = maxDimension }
          canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Lỗi nén ảnh')) }, 'image/jpeg', 0.8)
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedWeek) return
    setUploading(true)
    try {
      const compressedBlob = await compressImage(file)
      const fileName = `to_${targetTeam}_w_${selectedWeek}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage.from('thi-dua').upload(fileName, compressedBlob, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data: publicUrlData } = supabase.storage.from('thi-dua').getPublicUrl(fileName)
      const publicUrl = publicUrlData.publicUrl
      
      const { data: existing } = await supabase.from('team_weekly_images').select('id').eq('week_id', selectedWeek).eq('team_number', targetTeam).maybeSingle()
      
      if (existing) {
        const { error: updateError } = await supabase.from('team_weekly_images').update({ image_url: publicUrl }).eq('id', existing.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('team_weekly_images').insert([{ week_id: selectedWeek, team_number: targetTeam, image_url: publicUrl }])
        if (insertError) throw insertError
      }
      
      setTeamImage(publicUrl)
      alert(`Đã tải và nén ảnh minh chứng cho Tổ ${targetTeam} thành công!`)
    } catch (err: any) { alert('Lỗi tải ảnh tổ lên: ' + err.message) } 
    finally { setUploading(false) }
  }

  const handleDeleteTeamImage = async () => {
    if (!confirm(`Thầy/Cô có chắc chắn muốn thu hồi/xóa ảnh minh chứng của Tổ ${targetTeam} không?`)) return
    await supabase.from('team_weekly_images').delete().eq('week_id', selectedWeek).eq('team_number', targetTeam)
    setTeamImage('')
    alert('Đã thu hồi ảnh thành công!')
  }

  const handleSaveAll = async () => {
    if (!selectedWeek) return
    setLoading(true)
    for (const student of students) {
      const studentScore = scores[student.id] || { score: 100, eval: 'T' }
      const { data: existing } = await supabase.from('emulation_scores').select('id').eq('student_id', student.id).eq('week_id', selectedWeek).maybeSingle()
      if (existing) { 
        await supabase.from('emulation_scores').update({ score: studentScore.score, evaluation: studentScore.eval, updated_by: currentUser.username }).eq('id', existing.id) 
      } else { 
        await supabase.from('emulation_scores').insert([{ student_id: student.id, week_id: selectedWeek, score: studentScore.score, evaluation: studentScore.eval, updated_by: currentUser.username }]) 
      }
    }
    setLoading(false)
    alert('Đã lưu điểm và thông tin tổ thành công!')
  }
return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col font-sans selection:bg-pink-200">
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.03)] sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="bg-gradient-to-tr from-purple-500 to-pink-400 text-white p-2.5 rounded-[1.25rem] shadow-lg shadow-pink-200">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600 tracking-tight">Khu vực Chấm điểm - {TEN_LOP_CO_DINH}</h1>
            <p className="text-[11px] text-purple-500 font-bold tracking-wider">{currentUser?.full_name} — Đang chấm cho <span className="text-rose-500 uppercase font-black">Tổ {targetTeam}</span></p>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem('currentUser'); router.push('/login'); }} className="bg-red-50 hover:bg-red-500 hover:text-white text-red-500 px-4 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center border border-red-100"><LogOut className="h-4 w-4 mr-1.5" />Đăng xuất</button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <span className="text-sm font-extrabold text-slate-700">Chọn Tuần:</span>
            <select value={selectedWeek} onChange={(e) => handleWeekChange(e.target.value)} className="px-5 py-3.5 bg-white border border-purple-100 rounded-full font-bold text-purple-800 text-xs cursor-pointer outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-sm">
              {weeks.map((w) => <option key={w.id} value={w.id}>{w.week_name} ({w.period})</option>)}
            </select>
          </div>
          <button onClick={handleSaveAll} disabled={loading} className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-extrabold px-10 py-4 rounded-full shadow-lg shadow-pink-200 transition transform hover:-translate-y-1 cursor-pointer flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <CheckCircle2 className="h-5 w-5 mr-2" /><span>{loading ? 'Đang lưu hệ thống...' : 'Lưu tất cả điểm'}</span>
          </button>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Ảnh minh chứng vi phạm của Tổ {targetTeam}</h3>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Tải lên ảnh sổ hoặc phiếu tổng hợp lỗi (Ảnh được hệ thống tự động nén siêu tốc).</p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            {teamImage ? (
              <div className="flex items-center space-x-2">
                <button onClick={() => { setZoom(1); setRotation(0); setPreviewImage(teamImage); }} className="text-indigo-600 font-bold text-xs bg-indigo-50 hover:bg-indigo-500 hover:text-white px-5 py-3.5 rounded-full flex items-center transition-all cursor-pointer shadow-sm border border-indigo-100"><ImageIcon className="h-4 w-4 mr-1.5" />Xem trực tiếp</button>
                <button onClick={handleDeleteTeamImage} className="bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 font-bold p-3.5 rounded-full flex items-center transition-all cursor-pointer shadow-sm border border-rose-100" title="Thu hồi ảnh"><Trash2 className="h-4 w-4" /></button>
                <label className="cursor-pointer bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white px-6 py-3.5 rounded-full font-extrabold text-xs flex items-center transition-all shadow-lg shadow-blue-200 transform hover:-translate-y-1"><Upload className="h-4 w-4 mr-2" /><span>{uploading ? 'Đang nén...' : 'Tải lại ảnh'}</span><input type="file" accept="image/*" onChange={handleTeamImageUpload} disabled={uploading} className="hidden" /></label>
              </div>
            ) : (
              <label className="cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-extrabold text-xs flex items-center transition-all shadow-lg shadow-pink-200 transform hover:-translate-y-1"><Upload className="h-5 w-5 mr-2" /><span>{uploading ? 'Đang xử lý ảnh...' : 'Tải ảnh tổ lên'}</span><input type="file" accept="image/*" onChange={handleTeamImageUpload} disabled={uploading} className="hidden" /></label>
            )}
          </div>
        </div>
<div className="overflow-hidden rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-100/80 to-pink-100/80 text-purple-900 text-xs font-extrabold tracking-wide">
                <th className="p-5 pl-8">STT</th><th className="p-5">Họ và Tên Học Sinh</th><th className="p-5">Tổ</th><th className="p-5">Tổng Điểm</th><th className="p-5 pr-8">Xếp Loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50 text-xs font-medium text-slate-700">
              {students.map((st, index) => {
                const sData = scores[st.id] || { score: 100, eval: 'T' }
                return (
                  <tr key={st.id} className="hover:bg-white/90 transition-colors">
                    <td className="p-5 pl-8 font-bold text-slate-400">{index + 1}</td>
                    <td className="p-5 font-extrabold text-slate-800">{st.full_name}</td>
                    <td className="p-5 font-bold text-pink-500">Tổ {st.team_number}</td>
                    <td className="p-5">
                      <input type="number" value={sData.score} onChange={(e) => handleScoreChange(st.id, e.target.value)} className="w-28 px-5 py-2.5 bg-white border border-purple-100 rounded-full font-extrabold text-center text-indigo-700 outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner" />
                    </td>
                    <td className="p-5 pr-8 font-extrabold">
                      <span className={`px-4 py-2 rounded-full text-xs shadow-sm ${sData.eval === 'T' ? 'bg-emerald-100 text-emerald-700' : sData.eval === 'K' ? 'bg-sky-100 text-sky-700' : sData.eval === 'TB' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{sData.eval}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
            <img src={previewImage} alt="Minh chứng" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} className="max-h-[75vh] object-contain rounded-[2rem] shadow-2xl ring-8 ring-white/20" />
          </div>
        </div>
      )}
    </div>
  )
}