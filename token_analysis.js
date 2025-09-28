// AI提示詞Token分析腳本

// 簡單的token估算函數（基於GPT-4的大致規則）
function estimateTokens(text) {
  // 移除多餘空白
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // 基本估算：1 token ≈ 4 個字符（英文）或 1.5-2 個中文字符
  const chineseChars = (cleanText.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishChars = cleanText.length - chineseChars;
  
  // 中文字符按1.5個字符=1token計算，英文按4個字符=1token計算
  const estimatedTokens = Math.ceil(chineseChars / 1.5) + Math.ceil(englishChars / 4);
  
  return {
    totalChars: cleanText.length,
    chineseChars,
    englishChars,
    estimatedTokens
  };
}

// 耶穌的信提示詞
const jesusLetterPrompt = `你是耶穌基督，以充滿愛和智慧的方式回應信徒的困擾。

用戶信息：
- 暱稱：{nickname}
- 困擾類別：{topic}
- 具體情況：{situation}

請以JSON格式回應，包含以下四個部分：

{
  "jesusLetter": "以耶穌的身份寫給{nickname}的信，表達理解、愛和指導，至少500字",
  "guidedPrayer": "為{nickname}的{topic}困擾撰寫的引導式禱告，至少500字，以'奉耶穌的名禱告，阿們'結尾",
  "biblicalReferences": ["相關聖經經文引用，包含經文內容"],
  "coreMessage": "核心信息摘要"
}

要求：
1. 語言溫暖、充滿愛
2. 內容具體針對用戶困擾
3. 禱告文要完整且具引導性
4. 聖經經文要準確相關
5. 回應要有實際幫助`;

// 禱告提示詞（從備用回應中提取的禱告模板）
const prayerPrompt = `親愛的天父，

我們來到你的面前，為{nickname}在{topic}方面的需要向你祈求。

感謝你賜給我們耶穌基督，讓我們可以透過祂來到你的面前。感謝你的愛從不改變，感謝你的恩典夠我們用。

主啊，我們為{nickname}祈求，求你賜給他/她智慧和力量，讓他/她能夠在困難中看見你的作為。求你安慰他/她的心，除去一切的憂慮和恐懼。

天父，你知道我們內心深處的需要，即使我們沒有說出口的重擔，你都看見了。求你親自背負我們的憂慮，讓我們知道不需要獨自承擔。

求你的平安如江河一般流淌在我們心中，讓我們在風暴中仍能經歷你的同在。求你按著你在耶穌裡的應許，成就在我們身上。

主啊，我們將這一切都交託在你的手中，相信你必有最好的安排。求你繼續引導和保守我們，讓我們在每一天都能感受到你的愛。

奉耶穌的名禱告，阿們。`;

console.log('=== AI提示詞Token分析報告 ===\n');

console.log('1. 「耶穌的信」AI回應提示詞：');
const jesusResult = estimateTokens(jesusLetterPrompt);
console.log(`   總字符數: ${jesusResult.totalChars}`);
console.log(`   中文字符: ${jesusResult.chineseChars}`);
console.log(`   英文字符: ${jesusResult.englishChars}`);
console.log(`   估算Token數: ${jesusResult.estimatedTokens}`);
console.log('');

console.log('2. 「我來為你禱告」禱告內容：');
const prayerResult = estimateTokens(prayerPrompt);
console.log(`   總字符數: ${prayerResult.totalChars}`);
console.log(`   中文字符: ${prayerResult.chineseChars}`);
console.log(`   英文字符: ${prayerResult.englishChars}`);
console.log(`   估算Token數: ${prayerResult.estimatedTokens}`);
console.log('');

console.log('=== 總結 ===');
console.log(`總計Token數: ${jesusResult.estimatedTokens + prayerResult.estimatedTokens}`);
console.log('');
console.log('註：此為估算值，實際Token數可能因AI模型的tokenizer而有所差異');
console.log('');
console.log('=== 詳細分析 ===');
console.log('• 耶穌的信提示詞包含完整的角色設定、輸出格式要求和品質標準');
console.log('• 禱告內容為標準的代禱模板，包含感謝、祈求和交託等完整結構');
console.log('• 兩個提示詞都使用繁體中文，符合台灣用戶的語言習慣');
console.log('• Token數量在合理範圍內，不會造成過高的API成本');