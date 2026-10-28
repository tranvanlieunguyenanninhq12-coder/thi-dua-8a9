'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ShieldCheck, LogOut, Upload, ImageIcon, Plus, Trash2 } from 'lucide-react'

export default function PhoKyLuatDashboard() {
  const TEN_LOP_CO_DINH = '8A9'

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
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
    if (user.role !== 'pho_ky_luat') { router.push('/login'); return; }
    setCurrentUser(user)
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    const { data } = await supabase.from('disciplinary_records').select('*').order('created_at', { ascending: false })
    if (data) setRecords(data)
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressedBlob = await compressImage(file)
      const fileName = `kl_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('thi-dua').upload(fileName, compressedBlob, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data: publicUrlData } = supabase.storage.from('thi-dua').getPublicUrl(fileName)
      setImageUrl(publicUrlData.publicUrl)
      alert('Tải và nén ảnh đính kèm thành công! Vui lòng bấm Nút Lưu ở dưới.')
    } catch (err: any) { alert('Lỗi tải ảnh: ' + err.message) } 
    finally { setUploading(false) }
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('disciplinary_records').insert([
      { content: content, teacher_name: teacherName, image_url: imageUrl, creator_name: currentUser.full_name }
    ]).select()
    if (error) { 
      alert('Lỗi CSDL Supabase: ' + error.message)
      console.error(error)
    } else { 
      alert('Đã LƯU HOÀN TẤT bản ghi kỷ luật vào hệ thống!')
      setContent(''); setTeacherName(''); setImageUrl(''); fetchRecords() 
    }
    setLoading(false)
  }

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Thầy/Cô có chắc chắn muốn thu hồi/xóa bản ghi kỷ luật này không?')) {
      await supabase.from('disciplinary_records').delete().eq('id', id)
      fetchRecords()
    }
  }
return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col font-sans selection:bg-pink-200">
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.03)] sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="bg-gradient-to-tr from-purple-500 to-pink-400 text-white p-2.5 rounded-[1.25rem] shadow-lg shadow-pink-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600 tracking-tight">Khu Vực Phó Kỷ Luật</h1>
            <p className="text-[11px] text-purple-500 font-bold uppercase tracking-wider">Lớp {TEN_LOP_CO_DINH} — Xin chào, {currentUser?.full_name}</p>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem('currentUser'); router.push('/login'); }} className="bg-red-50 hover:bg-red-500 hover:text-white text-red-500 px-4 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center border border-red-100">
          <LogOut className="h-4 w-4 mr-1.5" />Đăng xuất
        </button>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-8">
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-6">
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Đăng Sổ Kỷ Luật Giáo Viên Bộ Môn</h3>
          <form onSubmit={handleAddRecord} className="space-y-5">
            <textarea placeholder="Nội dung vi phạm của học sinh ghi nhận từ giáo viên bộ môn..." value={content} onChange={(e) => setContent(e.target.value)} required className="w-full p-5 bg-white/80 border border-purple-100 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner resize-none" rows={3} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Tên giáo viên bộ môn ghi nhận" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="px-5 py-4 bg-white/80 border border-purple-100 rounded-full text-xs font-bold outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner text-slate-700" />
              <div className="flex items-center space-x-2">
                <label className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white px-5 py-4 rounded-full cursor-pointer font-extrabold text-xs transition-all shadow-lg shadow-blue-200 transform hover:-translate-y-1">
                  <Upload className="h-4 w-4" /><span>{uploading ? 'Đang nén...' : imageUrl ? '✓ Đã đính kèm ảnh (Đổi)' : 'Đính kèm ảnh kỷ luật'}</span><input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
                {imageUrl && (<button type="button" onClick={() => setImageUrl('')} className="bg-rose-50 text-rose-500 hover:text-white hover:bg-rose-500 p-4 rounded-full text-xs font-bold transition-all shadow-sm"><Trash2 className="h-4 w-4 mx-auto"/></button>)}
              </div>
            </div>
            <button type="submit" disabled={loading || uploading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-extrabold py-4 rounded-full shadow-lg shadow-pink-200 transition transform hover:-translate-y-1 cursor-pointer flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="h-5 w-5 mr-2" /><span>{loading ? 'Đang xử lý...' : 'Lưu bản ghi kỷ luật'}</span>
            </button>
          </form>
        </div>
<div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-6">
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">Danh Sách Sổ Kỷ Luật Đã Ghi Nhận</h3>
          <div className="space-y-4">
            {records.map((r) => (
              <div key={r.id} className="p-6 bg-white/80 border border-purple-50 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">{r.content}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Giáo viên: <b className="text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full">{r.teacher_name || 'Không rõ'}</b> | Người đăng: {r.creator_name || 'PKL'}</p>
                </div>
                <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                  {r.image_url && (
                    <button onClick={() => { setZoom(1); setRotation(0); setPreviewImage(r.image_url); }} className="text-pink-600 text-xs bg-pink-50 hover:bg-pink-500 hover:text-white px-5 py-3 rounded-full font-bold cursor-pointer transition-all flex items-center shadow-sm"><ImageIcon className="h-4 w-4 mr-2"/>Xem ảnh</button>
                  )}
                  <button onClick={() => handleDeleteRecord(r.id)} className="bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 p-3 rounded-full cursor-pointer transition-all shadow-sm" title="Thu hồi/Xóa"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <div className="text-center py-14 border-2 border-dashed border-purple-100 rounded-[2rem] bg-white/50">
                <p className="text-sm font-bold text-slate-400">Chưa có bản ghi kỷ luật nào.</p>
              </div>
            )}
          </div>
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
            <img src={previewImage} alt="Kỷ luật" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} className="max-h-[75vh] object-contain rounded-[2rem] shadow-2xl ring-8 ring-white/20" />
          </div>
        </div>
      )}
    </div>
  )
}