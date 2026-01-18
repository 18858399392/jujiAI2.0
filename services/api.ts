
import { Quote } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const HITOKOTO_API = 'https://v1.hitokoto.cn/?c=d&c=i&c=k&c=j&c=l';

// 记录本次会话已展示过的语录，防止重复
const seenTexts = new Set<string>();

// 精选本地备份语录，用于完全离线或所有 API 均不可用时
const FALLBACK_QUOTES = [
  { text: "万物皆有裂痕，那是光照进来的地方。", author: "莱昂纳德·科恩", from: "颂歌" },
  { text: "人类的全部智慧都包含在两个词中：等待和希望。", author: "大仲马", from: "基督山伯爵" },
  { text: "你所热爱的，就是你的生活。", author: "村上春树", from: "海边的卡夫卡" },
  { text: "生活不是你活过的样子，而是你记住的样子。", author: "马尔克斯", from: "百年孤独" },
  { text: "星星之火，可以燎原。", author: "毛泽东", from: "书信" },
  { text: "所有的迷途都是为了相遇。", author: "加西亚·马尔克斯", from: "霍乱时期的爱情" },
  { text: "在这个世界上，只有一种真正的英雄主义，那就是认清生活的真相，并仍然热爱它。", author: "罗曼·罗兰", from: "米开朗琪罗传" },
  { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原", from: "离骚" },
  { text: "与其感慨路难行，不如马上出发。", author: "佚名", from: "灵感" },
  { text: "世界这么大，我想去看看。", author: "顾少强", from: "辞职信" }
];

/**
 * 带有指数退避的 fetch 封装，优化重试参数以提升首屏速度
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 1, backoff = 500): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok && retries > 0) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

/**
 * 使用 Gemini AI 生成高品质语录
 */
async function generateQuoteWithAI(): Promise<Partial<Quote> | null> {
  if (!process.env.API_KEY || process.env.API_KEY === 'undefined') return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "请提供一句富有哲理、极具电影感的简短中文名言（30字以内），并告知作者及出处。返回 JSON 格式：{ 'text': '', 'author': '', 'from': '' }",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            author: { type: Type.STRING },
            from: { type: Type.STRING }
          },
          required: ["text", "author"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    if (result.text) return result;
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * 核心抓取逻辑
 */
export async function fetchRandomQuote(): Promise<Quote> {
  // 使用高熵随机字符串作为种子，确保每次图片绝对不同
  const uniqueSeed = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  const imageUrl = `https://picsum.photos/seed/${uniqueSeed}/1920/1080`;
  
  let quoteData: { text: string; author: string; from?: string; id?: string | number } | null = null;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  // 尝试获取不重复的语录
  while (attempts < MAX_ATTEMPTS) {
    try {
        if (!navigator.onLine) throw new Error('Offline');

        // 增加时间戳参数防止 API 缓存
        const response = await fetchWithRetry(`${HITOKOTO_API}&_t=${Date.now()}-${Math.random()}`, { 
          mode: 'cors',
          credentials: 'omit'
        });
        
        const data = await response.json();
        
        // 检查是否重复
        if (!seenTexts.has(data.hitokoto)) {
          seenTexts.add(data.hitokoto);
          quoteData = {
            id: data.id || `hit-${Date.now()}-${Math.random()}`,
            text: data.hitokoto,
            author: data.from_who || '佚名',
            from: data.from
          };
          break; // 成功获取唯一语录，跳出循环
        }
    } catch (error) {
       // 忽略错误，继续重试或降级
    }
    attempts++;
  }

  // 如果多次重试后仍未获取到（或 API 失败），尝试 AI
  if (!quoteData && navigator.onLine) {
    const aiQuote = await generateQuoteWithAI();
    if (aiQuote && aiQuote.text && !seenTexts.has(aiQuote.text)) {
      seenTexts.add(aiQuote.text);
      quoteData = {
        id: `ai-${Date.now()}-${Math.random()}`,
        text: aiQuote.text,
        author: aiQuote.author || 'AI',
        from: aiQuote.from || '灵感'
      };
    }
  }

  // 如果依然没有数据（离线或全失败），使用本地数据
  if (!quoteData) {
    const availableLocal = FALLBACK_QUOTES.filter(q => !seenTexts.has(q.text));
    const source = availableLocal.length > 0 ? availableLocal : FALLBACK_QUOTES;
    const local = source[Math.floor(Math.random() * source.length)];
    // 本地数据允许重复（如果已经循环一圈），但尽量避免
    if (!seenTexts.has(local.text)) seenTexts.add(local.text);
    
    quoteData = {
      id: `local-${Date.now()}-${Math.random()}`,
      text: local.text,
      author: local.author,
      from: local.from
    };
  }

  return {
    id: quoteData.id!,
    text: quoteData.text,
    author: quoteData.author,
    from: quoteData.from,
    imageUrl: imageUrl,
    timestamp: Date.now()
  };
}
