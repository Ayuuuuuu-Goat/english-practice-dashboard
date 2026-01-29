"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MonsterBattleProps {
  damage: number // 当前造成的伤害
  onDamageComplete?: () => void // 伤害动画完成回调
}

export function MonsterBattle({ damage, onDamageComplete }: MonsterBattleProps) {
  const [currentHP, setCurrentHP] = useState(1000)
  const [maxHP] = useState(1000)
  const [isShaking, setIsShaking] = useState(false)
  const [showDamage, setShowDamage] = useState(false)
  const [damageAmount, setDamageAmount] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // 根据血量计算小怪兽状态 (0-10, 共11个状态)
  const getMonsterState = (hp: number): number => {
    const percentage = hp / maxHP
    if (percentage >= 0.95) return 0 // 满血，开心
    if (percentage >= 0.85) return 1 // 轻伤
    if (percentage >= 0.75) return 2 // 轻伤+
    if (percentage >= 0.65) return 3 // 中伤
    if (percentage >= 0.55) return 4 // 中伤+
    if (percentage >= 0.45) return 5 // 重伤
    if (percentage >= 0.35) return 6 // 重伤+
    if (percentage >= 0.25) return 7 // 濒死
    if (percentage >= 0.15) return 8 // 濒死+
    if (percentage >= 0.05) return 9 // 即将倒下
    return 10 // 倒下
  }

  const monsterState = getMonsterState(currentHP)

  // 获取小怪兽图片位置 (3列4行的精灵图)
  const getMonsterSpritePosition = (state: number) => {
    const positions = [
      { x: 0, y: 0 },    // 0: 左上 - 满血开心
      { x: 1, y: 0 },    // 1: 中上 - 轻伤
      { x: 2, y: 0 },    // 2: 右上 - 轻伤+
      { x: 0, y: 1 },    // 3: 左中上 - 中伤
      { x: 1, y: 1 },    // 4: 中中上 - 中伤+
      { x: 2, y: 1 },    // 5: 右中上 - 重伤
      { x: 0, y: 2 },    // 6: 左中下 - 重伤+
      { x: 1, y: 2 },    // 7: 中中下 - 濒死
      { x: 2, y: 2 },    // 8: 右中下 - 濒死+
      { x: 0, y: 3 },    // 9: 左下 - 即将倒下
      { x: 1, y: 3 },    // 10: 中下 - 彻底倒下
    ]
    return positions[state] || positions[0]
  }

  const spritePosition = getMonsterSpritePosition(monsterState)

  // 受到伤害
  useEffect(() => {
    if (damage > 0) {
      setDamageAmount(damage)
      setShowDamage(true)
      setIsShaking(true)

      // 扣除血量
      setCurrentHP(prev => Math.max(0, prev - damage))

      // 抖动动画持续 500ms
      setTimeout(() => {
        setIsShaking(false)
      }, 500)

      // 伤害数字持续 1000ms
      setTimeout(() => {
        setShowDamage(false)
        onDamageComplete?.()
      }, 1000)
    }
  }, [damage, onDamageComplete])

  const hpPercentage = (currentHP / maxHP) * 100

  return (
    <motion.div
      className="flex flex-col items-center gap-3 relative cursor-move"
      drag
      dragMomentum={false}
      dragElastic={0}
      onDrag={(event, info) => {
        setPosition({ x: info.offset.x, y: info.offset.y })
      }}
      style={{ x: position.x, y: position.y }}
    >
      {/* 血条 */}
      <div className="w-[170px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-gray-700">胡萝卜小怪兽</span>
          <span className="text-[10px] font-bold text-gray-700">
            {currentHP}/{maxHP}
          </span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className={`absolute left-0 top-0 h-full rounded-full ${
              hpPercentage > 50
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : hpPercentage > 20
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}
            initial={{ width: '100%' }}
            animate={{ width: `${hpPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white drop-shadow-md">
              HP
            </span>
          </div>
        </div>
      </div>

      {/* 小怪兽和对话云朵容器 */}
      <div className="relative flex items-center justify-center w-full">
        {/* 小怪兽 - 使用裁剪方式显示精灵图中的一个格子 */}
        {/* 精灵图原始尺寸: 1024x1536, 3列4行, 每格约 341x384 */}
        <div
          className="relative overflow-hidden"
          style={{
            width: '170px',  // 512 / 3 ≈ 170.67
            height: '230px'  // 增加高度确保脚部显示
          }}
        >
          <motion.div
            className="absolute top-0 left-0"
            style={{
              backgroundImage: 'url(/monster-states.png)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '512px 768px', // 原图缩小一半: 1024/2 x 1536/2
              backgroundPosition: `${-spritePosition.x * 170.67}px ${-spritePosition.y * 192}px`,
              width: '512px',
              height: '768px',
            }}
            animate={
              isShaking
                ? {
                    x: [0, -6, 6, -6, 6, 0],
                    rotate: [0, -2, 2, -2, 2, 0],
                  }
                : {}
            }
            transition={{ duration: 0.5 }}
          />

          {/* 伤害数字 */}
          <AnimatePresence>
            {showDamage && (
              <motion.div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={{ y: -50, opacity: 0, scale: 1.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                <div className="text-4xl font-bold text-red-500 drop-shadow-lg">
                  -{damageAmount}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 受击特效 */}
          <AnimatePresence>
            {isShaking && (
              <motion.div
                className="absolute inset-0 bg-red-500 rounded-full opacity-30 blur-lg"
                initial={{ scale: 0.8, opacity: 0.3 }}
                animate={{ scale: 1.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* 对话云朵状态提示 - 放在右侧 */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full ml-2">
          {currentHP === 0 ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative bg-purple-100 px-4 py-2 rounded-2xl shadow-lg border-2 border-purple-300"
            >
              <div className="text-sm font-bold text-purple-600 whitespace-nowrap">
                🎉 击败！
              </div>
              {/* 云朵小尾巴指向左边 */}
              <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-purple-300 border-b-8 border-b-transparent"></div>
            </motion.div>
          ) : currentHP < 200 ? (
            <div className="relative bg-red-100 px-4 py-2 rounded-2xl shadow-lg border-2 border-red-300">
              <div className="text-sm font-bold text-red-500 whitespace-nowrap">快倒下了！</div>
              <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-red-300 border-b-8 border-b-transparent"></div>
            </div>
          ) : currentHP < 500 ? (
            <div className="relative bg-orange-100 px-4 py-2 rounded-2xl shadow-lg border-2 border-orange-300">
              <div className="text-sm font-bold text-orange-500 whitespace-nowrap">伤得不轻！</div>
              <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-orange-300 border-b-8 border-b-transparent"></div>
            </div>
          ) : currentHP < 800 ? (
            <div className="relative bg-yellow-100 px-4 py-2 rounded-2xl shadow-lg border-2 border-yellow-300">
              <div className="text-sm font-bold text-yellow-600 whitespace-nowrap">受伤了！</div>
              <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-yellow-300 border-b-8 border-b-transparent"></div>
            </div>
          ) : (
            <div className="relative bg-green-100 px-4 py-2 rounded-2xl shadow-lg border-2 border-green-300">
              <div className="text-sm font-bold text-green-600 whitespace-nowrap">元气满满！</div>
              <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-green-300 border-b-8 border-b-transparent"></div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
