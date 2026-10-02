// server/tests/test_deep_talk.js
import { generateDeepSeekRandomScenario, generateDeepSeekFastNextTurn } from '../services/deepseekService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testDeepTalk() {
  console.log('=== TEST 1: KHỞI TẠO TÌNH HUỐNG GIAO TIẾP SÂU (DEEP TALK) ===');
  const startResult = await generateDeepSeekRandomScenario({
    level: 'N4',
    topic: 'social',
    mode: 'deep_talk',
  });

  console.log('Scenario Title:', startResult.scenario.title);
  console.log('Mode:', startResult.scenario.mode);
  console.log('Topic:', startResult.scenario.topic);
  console.log('AI Role:', startResult.scenario.aiRole);
  console.log('User Role:', startResult.scenario.userRole);
  console.log('AI First Sentence:', startResult.firstTurn.aiSentence);
  console.log('Vietnamese:', startResult.firstTurn.vietnamese);
  console.log('Reply Idea (Trả lời + Hỏi ngược lại):', startResult.firstTurn.replyIdeas?.[0]);

  console.log('\n=== TEST 2: PHẢN XẠ NHANH HAI CHIỀU - HỌC VIÊN HỎI LẠI AI ===');
  const nextTurnResult = await generateDeepSeekFastNextTurn({
    spokenText: 'はじめまして！私はベトナムから来ました。日本のアニメが大好きです。AIさんは何が好きですか？',
    turnIndex: 2,
    totalTurns: 10,
    history: [
      { speaker: 'ai', text: startResult.firstTurn.aiSentence },
    ],
    scenario: startResult.scenario,
    mode: 'deep_talk',
  });

  console.log('AI Sentence:', nextTurnResult.nextTurn.aiSentence);
  console.log('AI Vietnamese:', nextTurnResult.nextTurn.vietnamese);
  console.log('AI IsCompleted:', nextTurnResult.nextTurn.isCompleted);
  console.log('Next Reply Idea:', nextTurnResult.nextTurn.replyIdeas?.[0]);
  console.log('\n✅ TEST DEEP TALK HOÀN TẤT THÀNH CÔNG!');
}

testDeepTalk().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
