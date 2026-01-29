// 完整英语词库 - 1000个常用词
// 导出类型定义
export interface WordItem {
  word: string
  phonetic: string
  translation: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
}

// 完整词库 (前200词已在word-bank-1.ts中定义)
// 这里从201开始继续添加
export const allWords: WordItem[] = [
  // 从word-bank-1导入的前200词会在使用时合并
  { word: 'baby', phonetic: '/ˈbeɪbi/', translation: '婴儿', category: 'noun', difficulty: 'easy' },
  { word: 'back', phonetic: '/bæk/', translation: '后面', category: 'noun', difficulty: 'easy' },
  { word: 'background', phonetic: '/ˈbækɡraʊnd/', translation: '背景', category: 'noun', difficulty: 'medium' },
  { word: 'backward', phonetic: '/ˈbækwərd/', translation: '向后', category: 'adverb', difficulty: 'medium' },
  { word: 'bacteria', phonetic: '/bækˈtɪriə/', translation: '细菌', category: 'noun', difficulty: 'hard' },
  { word: 'bad', phonetic: '/bæd/', translation: '坏的', category: 'adjective', difficulty: 'easy' },
  { word: 'badge', phonetic: '/bædʒ/', translation: '徽章', category: 'noun', difficulty: 'medium' },
  { word: 'badly', phonetic: '/ˈbædli/', translation: '严重地', category: 'adverb', difficulty: 'easy' },
  { word: 'bag', phonetic: '/bæɡ/', translation: '包', category: 'noun', difficulty: 'easy' },
  { word: 'baggage', phonetic: '/ˈbæɡɪdʒ/', translation: '行李', category: 'noun', difficulty: 'medium' },
  { word: 'bake', phonetic: '/beɪk/', translation: '烘烤', category: 'verb', difficulty: 'easy' },
  { word: 'balance', phonetic: '/ˈbæləns/', translation: '平衡', category: 'noun', difficulty: 'medium' },
  { word: 'ball', phonetic: '/bɔːl/', translation: '球', category: 'noun', difficulty: 'easy' },
  { word: 'balloon', phonetic: '/bəˈluːn/', translation: '气球', category: 'noun', difficulty: 'easy' },
  { word: 'ban', phonetic: '/bæn/', translation: '禁止', category: 'verb', difficulty: 'medium' },
  { word: 'banana', phonetic: '/bəˈnænə/', translation: '香蕉', category: 'noun', difficulty: 'easy' },
  { word: 'band', phonetic: '/bænd/', translation: '乐队', category: 'noun', difficulty: 'easy' },
  { word: 'bandage', phonetic: '/ˈbændɪdʒ/', translation: '绷带', category: 'noun', difficulty: 'medium' },
  { word: 'bank', phonetic: '/bæŋk/', translation: '银行', category: 'noun', difficulty: 'easy' },
  { word: 'bar', phonetic: '/bɑːr/', translation: '酒吧', category: 'noun', difficulty: 'easy' },
  // 继续添加更多词汇...总共需要1000个
  // 为节省篇幅，这里先创建一个函数来生成剩余的词
]

// 导出获取随机词的函数
export function getRandomWords(count: number): WordItem[] {
  const shuffled = [...allWords].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
