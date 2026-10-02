import { generateDeepSeekSessionReview, callDeepSeek, safeJsonParse } from '../services/deepseekService.js';

async function run() {
  const scenario = {
    title: 'バスで席を譲る (Nhường ghế trên xe buýt)',
    level: 'N5',
    topic: 'daily',
    aiRole: 'お年寄り (Người lớn tuổi)',
    userRole: '乗客 (Hành khách)',
    description: 'Bạn đang đi xe buýt và thấy một người lớn tuổi đứng gần đó. Bạn muốn nhường ghế của mình.'
  };

  const sessionHistory = [
    { speaker: 'ai', text: 'あ、どうもありがとう。', vietnamese: 'À, cảm ơn bạn nhiều.' },
    { speaker: 'user', text: 'どういたしまして。' },
    { speaker: 'ai', text: 'いやあ、助かりました。最近は席を譲ってくれる人が少なくてねえ。', vietnamese: 'Ôi, may quá. Dạo này ít người nhường ghế quá.' },
    { speaker: 'user', text: 'えっと確か。皆さんが。見えないですが。' },
    { speaker: 'ai', text: 'そうですか。でも、あなたのように親切な方もいらっしゃるんですよ。本当にありがとう。', vietnamese: 'Vậy à. Nhưng mà cũng có những người tốt bụng như cháu đấy. Cảm ơn cháu thật nhiều.' },
    { speaker: 'user', text: 'いえ、とんでもないです。お気をつけて。' },
    { speaker: 'ai', text: 'はい、ありがとう。あなたもお気をつけてね。', vietnamese: 'Vâng, cảm ơn bạn. Bạn cũng đi cẩn thận nhé.' }
  ];

  console.log('--- Calling generateDeepSeekSessionReview ---');
  const res = await generateDeepSeekSessionReview({ scenario, sessionHistory });
  console.log('Result:', JSON.stringify(res, null, 2));
}

run().catch(console.error);
