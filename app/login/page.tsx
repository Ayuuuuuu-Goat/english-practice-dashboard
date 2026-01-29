"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

const DEFAULT_ROLES = [
  { name: 'Viewer', email: 'viewer@example.com', color: 'blue', icon: '👀' },
]

const AVAILABLE_ICONS = ['👨', '👩', '👦', '👧', '🧑', '👶', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦄', '🐴', '🦋', '🐝', '🐛', '🦖', '🎯', '🎮', '🎨', '🎭', '🎪', '🎸', '🎹', '🎺', '🎻', '🎲', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🎿']

const AVAILABLE_COLORS = [
  { name: 'blue', bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
  { name: 'purple', bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600' },
  { name: 'pink', bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600' },
  { name: 'green', bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600' },
  { name: 'orange', bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' },
  { name: 'yellow', bg: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-600' },
  { name: 'cyan', bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600' },
  { name: 'red', bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-600' },
  { name: 'indigo', bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-600' },
  { name: 'teal', bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600' },
]

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [roles, setRoles] = useState(DEFAULT_ROLES)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('👤')
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0].name)
  const router = useRouter()

  useEffect(() => {
    // Load custom roles from database
    fetchCustomRoles()
  }, [])

  const fetchCustomRoles = async () => {
    try {
      const res = await fetch('/api/roles')
      const data = await res.json()

      if (data.success && data.roles) {
        setRoles([...DEFAULT_ROLES, ...data.roles])
      }
    } catch (error) {
      console.error('Error loading custom roles:', error)
    }
  }

  const handleRoleSelect = (role: typeof DEFAULT_ROLES[0]) => {
    setIsLoading(true)
    setSelectedRole(role.name)

    try {
      // Store selected role in localStorage
      localStorage.setItem('selectedRole', JSON.stringify({
        name: role.name,
        email: role.email,
        icon: role.icon,
        color: role.color
      }))

      toast.success(`欢迎，${role.name}！`)

      // Small delay to ensure localStorage is written
      setTimeout(() => {
        router.push("/")
      }, 100)
    } catch (error) {
      console.error("Login error:", error)
      toast.error("登录失败，请重试")
      setIsLoading(false)
      setSelectedRole(null)
    }
  }

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('请输入角色名称')
      return
    }

    // Check if name already exists
    if (roles.some(r => r.name.toLowerCase() === newRoleName.trim().toLowerCase())) {
      toast.error('该角色名称已存在')
      return
    }

    const newRole = {
      name: newRoleName.trim(),
      email: `${newRoleName.trim().toLowerCase()}@example.com`,
      color: selectedColor,
      icon: selectedIcon
    }

    try {
      // Save to database
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole)
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || '创建角色失败')
        return
      }

      // Refresh roles list
      await fetchCustomRoles()

      toast.success(`角色 ${newRoleName} 创建成功！`)

      // Reset form
      setNewRoleName('')
      setSelectedIcon('👤')
      setSelectedColor(AVAILABLE_COLORS[0].name)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error('创建角色失败，请重试')
    }
  }

  const handleDeleteRole = async (roleName: string, deleteData: boolean = true) => {
    // Can't delete default roles
    if (DEFAULT_ROLES.some(r => r.name === roleName)) {
      toast.error('无法删除默认角色')
      return
    }

    if (!confirm(`确定要删除角色 "${roleName}" 吗？\n\n⚠️ 将同时删除该角色的所有学习数据！`)) {
      return
    }

    try {
      const res = await fetch(`/api/roles?name=${encodeURIComponent(roleName)}&deleteData=${deleteData}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || '删除角色失败')
        return
      }

      // Refresh roles list
      await fetchCustomRoles()

      toast.success(`角色 ${roleName} 已删除（包括所有学习数据）`)
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('删除角色失败，请重试')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-4xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">英语练习平台</h1>
          <p className="text-muted-foreground">选择你的角色开始练习</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
          {roles.map((role) => {
            const colorObj = AVAILABLE_COLORS.find(c => c.name === role.color) || AVAILABLE_COLORS[0]
            return (
              <div key={role.name} className="relative">
                <button
                  onClick={() => handleRoleSelect(role)}
                  disabled={isLoading}
                  className={`
                    w-full p-6 rounded-xl transition-all duration-300
                    ${isLoading && selectedRole !== role.name ? 'opacity-50' : 'opacity-100'}
                    ${selectedRole === role.name ? 'ring-4 ring-blue-400' : 'hover:shadow-lg'}
                    disabled:cursor-not-allowed
                    bg-white border-2 border-gray-200 hover:border-gray-300
                  `}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`w-16 h-16 rounded-full ${colorObj.light} flex items-center justify-center text-3xl`}>
                      {role.icon}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`text-lg font-semibold ${colorObj.text}`}>{role.name}</span>
                      {selectedRole === role.name && (
                        <span className="text-xs text-gray-500 mt-1 animate-pulse">登录中...</span>
                      )}
                    </div>
                  </div>
                </button>
                {!DEFAULT_ROLES.some(r => r.name === role.name) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteRole(role.name, true)
                    }}
                    className="absolute -top-2 -right-2 bg-white border-2 border-red-200 text-red-500 rounded-full p-1 hover:bg-red-50 transition-colors shadow-md"
                    title="删除角色及所有数据"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}

          {/* 创建新角色按钮 */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-300 bg-white hover:bg-blue-50"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <span className="text-lg font-semibold text-gray-600">创建角色</span>
            </div>
          </button>
        </div>

        {/* 创建角色模态框 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">创建新角色</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 角色名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    角色名称
                  </label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="输入角色名称"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={20}
                  />
                </div>

                {/* 选择图标 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择图标
                  </label>
                  <div className="grid grid-cols-10 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setSelectedIcon(icon)}
                        className={`text-2xl p-2 rounded-lg transition-all ${
                          selectedIcon === icon
                            ? 'bg-blue-500 scale-110'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 选择颜色 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择颜色主题
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`h-16 rounded-lg ${color.bg} transition-all ${
                          selectedColor === color.name
                            ? 'ring-4 ring-blue-500 scale-105'
                            : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 预览 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预览
                  </label>
                  <div className="p-6 rounded-xl bg-white border-2 border-gray-200 inline-flex flex-col items-center space-y-3 shadow-lg">
                    <div className={`w-16 h-16 rounded-full ${AVAILABLE_COLORS.find(c => c.name === selectedColor)?.light || 'bg-gray-100'} flex items-center justify-center text-3xl`}>
                      {selectedIcon}
                    </div>
                    <span className={`text-lg font-semibold ${AVAILABLE_COLORS.find(c => c.name === selectedColor)?.text || 'text-gray-900'}`}>
                      {newRoleName || '角色名称'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateRole}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  创建角色
                </Button>
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="rounded-2xl bg-blue-50 p-4 space-y-2 text-sm mt-6">
          <p className="font-semibold text-blue-900">💡 使用说明</p>
          <ul className="space-y-1 text-blue-700">
            <li>• 点击任意角色卡片即可登录</li>
            <li>• 每个角色有独立的学习进度和数据</li>
            <li>• 点击"创建角色"可以添加新的自定义角色</li>
            <li>• 自定义角色可以选择图标和颜色主题</li>
            <li>• Viewer 角色专门用于查看所有数据和统计</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
