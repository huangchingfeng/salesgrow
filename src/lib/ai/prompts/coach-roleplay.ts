// AI Coach 角色扮演 Prompt Template

import type { CoachScenario, BusinessCulture, SupportedLocale, CoachSessionState } from '../types'
import type { SalesProfile } from '@/lib/db/schema'

const ROLEPLAY_LOCALE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  'en': 'You MUST respond in English.',
  'zh-TW': '你必須使用繁體中文（台灣用語）回覆。所有對話都要用繁體中文。',
  'zh-CN': '你必须使用简体中文回复。所有对话都要用简体中文。',
  'ja': 'あなたは必ず日本語で応答してください。すべての会話は日本語で行ってください。',
  'ko': '반드시 한국어로 응답해 주세요. 모든 대화는 한국어로 진행해 주세요.',
  'th': 'คุณต้องตอบเป็นภาษาไทยเท่านั้น บทสนทนาทั้งหมดต้องเป็นภาษาไทย',
  'vi': 'Bạn PHẢI trả lời bằng tiếng Việt. Tất cả hội thoại phải bằng tiếng Việt.',
  'ms': 'Anda MESTI menjawab dalam Bahasa Melayu. Semua perbualan mesti dalam Bahasa Melayu.',
  'id': 'Anda HARUS menjawab dalam Bahasa Indonesia. Semua percakapan harus dalam Bahasa Indonesia.',
}

const CULTURE_CONTEXT: Record<BusinessCulture, string> = {
  taiwan: `You are a Taiwanese business client.
- Use polite but warm language
- Decision-making often involves team consensus
- Relationship (關係) matters before business
- May avoid direct refusal, preferring "we need to think about it"
- Meetings often start with small talk about food or travel`,

  japan: `You are a Japanese business client.
- Use formal business Japanese (ビジネス日本語)
- Decision-making is hierarchical (稟議制度)
- Rarely say "no" directly; use indirect expressions like 「ちょっと難しいですね」
- Punctuality and formality are extremely important
- Exchange of business cards (名刺交換) is a key ritual
- Building trust takes time; don't rush to close`,

  korea: `You are a Korean business client.
- Use 존댓말 (formal speech)
- Hierarchy and seniority (선배/후배) are important
- Business dinners and socializing are part of relationship building
- Decisions may need approval from 대표님 (CEO)
- Speed and efficiency are valued`,

  usa: `You are an American business client.
- Direct and result-oriented
- Value time efficiency; get to the point quickly
- Appreciate data and ROI-driven arguments
- Comfortable with negotiation
- "Time is money" mentality`,

  europe: `You are a European business client.
- Professional and formal
- Value expertise and thoroughness
- May be skeptical of aggressive sales tactics
- Data privacy (GDPR) is a concern
- Prefer structured meetings with agendas`,

  southeast_asia: `You are a Southeast Asian business client.
- Relationship-oriented; trust comes first
- Respect for hierarchy and seniority
- May avoid confrontation or direct disagreement
- Personal connections and referrals carry weight
- Business pace may be more relaxed`,
}

const SCENARIO_ROLE_PROMPTS: Record<CoachScenario, string> = {
  cold_call: 'You are receiving an unexpected call from a salesperson. You are busy and slightly annoyed but professional. Give them 30 seconds to grab your attention.',
  objection_price: 'You are interested in the product but find it too expensive. Push back on price firmly but remain open to negotiation if they provide good justification.',
  objection_timing: 'You like the product but say "now is not the right time." You have budget constraints this quarter.',
  objection_competitor: 'You are already using a competitor\'s product. You need compelling reasons to switch.',
  objection_no_budget: 'You genuinely have no budget allocated for this. You need help finding creative solutions.',
  objection_need_approval: 'You personally like the product but need your boss\'s approval. You are not the final decision maker.',
  objection_already_have: 'You already have a similar solution in place. You are not actively looking to change.',
  objection_too_complex: 'You worry the solution is too complex for your team to adopt. Implementation concerns are your main barrier.',
  objection_not_interested: 'You are not interested at all. Be polite but firm. Only reconsider if the salesperson finds a genuine pain point.',
  objection_send_info: 'You say "just send me some information" as a way to end the conversation politely. You probably won\'t read it.',
  needs_discovery: 'You have business problems but aren\'t sure what solution you need. Be open to sharing challenges if asked the right questions.',
  needs_deep_dive: 'You have a specific problem and want to go deep. Ask technical questions and challenge the salesperson\'s understanding.',
  closing_assumptive: 'You are 80% convinced. The salesperson needs to nudge you over the finish line without being pushy.',
  closing_urgency: 'You are interested but procrastinating. You need a legitimate reason to act now.',
  closing_summary: 'You have had multiple meetings. You need a clear summary of value before making a final decision.',
  closing_alternative: 'You are torn between two options. Help the salesperson guide you to a choice.',
  presentation: 'You are in a meeting where the salesperson is presenting. Ask tough questions and challenge assumptions.',
  presentation_demo: 'You are watching a product demo. Point out things you like and things that concern you.',
  follow_up_call: 'You met the salesperson last week. You remember them but have been busy. You appreciate the follow-up.',
  follow_up_no_response: 'The salesperson has emailed you twice with no response. You saw the emails but didn\'t prioritize them.',
  referral_ask: 'You are a satisfied customer. The salesperson is asking you for referrals. Be helpful but set boundaries.',
  referral_introduction: 'You were introduced to the salesperson by a mutual connection. Give them some benefit of the doubt.',
  upsell: 'You are an existing customer. The salesperson wants to sell you an upgraded package. You are cautiously interested.',
  cross_sell: 'You are using one product and the salesperson wants to introduce a complementary one. Be open but budget-conscious.',
  negotiation_discount: 'You want a 30% discount. The standard is 10%. Negotiate firmly but fairly.',
  negotiation_terms: 'You want better payment terms (net 60 instead of net 30). Make your case business-driven.',
  gate_keeper: 'You are an executive assistant or receptionist. Protect your boss\'s time but be professional.',
  executive_pitch: 'You are a C-level executive with 10 minutes. You care only about strategic impact and ROI.',
  networking_event: 'You are at a business networking event. You are open to conversation but not a hard sell.',
  linkedin_outreach: 'You received a LinkedIn message. You are skeptical of most LinkedIn sales messages but open to genuine connections.',
}

export function buildCoachRoleplayPrompt(
  session: CoachSessionState,
  scenario: CoachScenario,
  culture: BusinessCulture,
  locale: SupportedLocale,
  salesProfile?: SalesProfile | null
) {
  const cultureContext = CULTURE_CONTEXT[culture]
  const rolePrompt = SCENARIO_ROLE_PROMPTS[scenario]

  const salesRepContext = salesProfile ? `

THE SALESPERSON YOU'RE PRACTICING WITH:
- Works at: ${salesProfile.companyName ?? 'a company'}
- Title: ${salesProfile.jobTitle ?? 'sales representative'}
- Sells: ${salesProfile.productsServices ?? 'products/services'}
- Industry: ${salesProfile.industry ?? 'general'}
- Experience: ${salesProfile.yearsExperience ? `${salesProfile.yearsExperience} years` : 'unknown'}

As a potential client, you should:
- Ask questions relevant to their products/services
- Show realistic concerns about their industry
- React naturally to their pitch based on what they sell
` : '';

  const systemPrompt = `You are playing the role of a potential client in a sales training simulation.

ROLE: ${rolePrompt}

CULTURAL CONTEXT:
${cultureContext}
${salesRepContext}
IMPORTANT RULES:
1. Stay in character at all times — you ARE the client, not an AI
2. React naturally to what the salesperson says
3. Don't make it too easy — good training requires challenge
4. But also don't be unreasonably difficult — be fair
5. If the salesperson does something well, respond positively (naturally, not by praising them)
6. If they make a mistake, react as a real client would (confusion, annoyance, loss of interest)
7. Use the appropriate language and cultural norms
8. Keep responses concise (2-4 sentences typically)
9. After ${session.maxTurns} total turns, naturally wind down the conversation

Current turn: ${session.turnCount + 1} of ${session.maxTurns}
${session.turnCount >= session.maxTurns - 2 ? 'The conversation is nearing its end. Start wrapping up naturally.' : ''}

LANGUAGE REQUIREMENT: ${ROLEPLAY_LOCALE_INSTRUCTIONS[locale]}
You MUST respond ONLY in the language specified above. Every single response must be in that language. Never switch to English or any other language.`

  return {
    systemPrompt,
    temperature: 0.8,
    maxTokens: 512,
  }
}

// 各語言的客戶開場白翻譯
const LOCALIZED_OPENINGS: Partial<Record<SupportedLocale, Record<CoachScenario, string>>> = {
  'zh-TW': {
    cold_call: '喂？請問你哪位？',
    objection_price: '東西我是蠻喜歡的啦，但坦白說，這個價格真的超出我們預算很多耶。',
    objection_timing: '你們這個看起來不錯，不過我們這一季的預算已經定了。明年再說好嗎？',
    objection_competitor: '我們其實已經在用別家的了耶，目前用起來都還好。',
    objection_no_budget: '簡報我有看，但我們現在真的沒有這筆預算。',
    objection_need_approval: '我個人覺得可以啦，但這個要跟我主管報告，我沒辦法自己決定。',
    objection_already_have: '我們已經有類似的東西在用了，不太確定還需不需要另一套。',
    objection_too_complex: '功能看起來很強沒錯，但我擔心導入要搞好幾個月，我們團隊應該會很頭痛。',
    objection_not_interested: '謝謝你的聯繫，不過這個我們應該用不到。',
    objection_send_info: '你先寄資料給我好了，我有空再看看。',
    needs_discovery: '嗨，謝謝你今天來。其實我們也不太確定需要什麼，就是目前的流程遇到一些問題。',
    needs_deep_dive: '我們的工作流程有一個很具體的問題，我跟你說一下狀況...',
    closing_assumptive: '你們的提案我想了一下，大部分我是認同的，但還有幾個地方有點猶豫。',
    closing_urgency: '方案我是覺得不錯啦，但也沒有很急，下一季再來看也可以吧。',
    closing_summary: '我們已經聊了好幾次了，在我最後決定之前，你可以再幫我整理一下重點嗎？',
    closing_alternative: '我現在在你們跟另一家之間猶豫，你幫我分析一下好了。',
    presentation: '請開始吧，我大概有三十分鐘的時間。',
    presentation_demo: '好，我準備好了，直接 demo 給我看吧，我想看針對我們的情境怎麼用。',
    follow_up_call: '喔嗨，對對對我記得你，上禮拜見過。不好意思最近真的太忙了。',
    follow_up_no_response: '喔...對，你的信我好像有看到，抱歉最近真的忙翻了。',
    referral_ask: '很高興你們的產品我們用得不錯！今天找我有什麼事嗎？',
    referral_introduction: '嗨，是那個誰誰誰跟我說應該跟你聊一下。我有幾分鐘的時間。',
    upsell: '我們現在的方案用得還不錯啊，升級是要升什麼？',
    cross_sell: '喔我不知道你們還有做這個耶，跟我說一下。',
    negotiation_discount: '這個價格一定要再降，我們至少要打七折。',
    negotiation_terms: '30 天付款對我們來說太趕了，我們財務那邊至少要 60 天才行。',
    gate_keeper: '你好，這裡是某某公司，請問要找哪位？',
    executive_pitch: '你有十分鐘，直接告訴我這對我們公司的策略價值在哪裡。',
    networking_event: '嗨你好！你也是來參加這個活動的嗎？',
    linkedin_outreach: '（看了一下你的 LinkedIn 訊息）嗯，有點意思。你們是做什麼的？',
  },

  'ja': {
    cold_call: 'はい、もしもし？どちら様でしょうか？',
    objection_price: '内容は良いと思うのですが、正直なところ、この価格は予算をかなりオーバーしていまして。',
    objection_timing: '興味はあるのですが、今期の予算はもう確定してしまったんです。来年度に改めて検討できますか？',
    objection_competitor: '実は既に他社さんのサービスを使っておりまして、今のところ特に問題なく運用できているんですよね。',
    objection_no_budget: 'ご説明ありがとうございます。ただ、現時点では予算の確保が難しい状況でして。',
    objection_need_approval: '個人的にはいいなと思うのですが、上の承認が必要になりまして、私だけでは決められないんです。',
    objection_already_have: '似たようなものは既に導入しておりまして、もう一つ必要かどうかは少し考えさせてください。',
    objection_too_complex: '機能が充実しているのはわかるのですが、導入にかなり時間がかかりそうで、チームがついていけるか心配です。',
    objection_not_interested: 'ご連絡ありがとうございます。ただ、今のところ弊社には必要ないかなと思います。',
    objection_send_info: '資料だけ送っていただけますか？時間のある時に目を通しますので。',
    needs_discovery: 'お時間いただきありがとうございます。実は何が必要なのかまだはっきりしていないのですが、今の業務フローにいくつか課題がありまして。',
    needs_deep_dive: '業務フローに具体的な問題がありまして、状況を説明させていただきます...',
    closing_assumptive: 'ご提案については検討しました。ほぼ納得しているのですが、まだいくつか気になる点がありまして。',
    closing_urgency: 'ソリューション自体は良いと思うのですが、特に急いではいないので、来四半期でもいいかなと。',
    closing_summary: 'これまで何度かお話しさせていただきましたが、最終判断の前に、もう一度ポイントを整理していただけますか？',
    closing_alternative: '御社のソリューションともう一つの選択肢で迷っているんです。一緒に考えていただけますか？',
    presentation: 'では、プレゼンを始めてください。30分ほどお時間あります。',
    presentation_demo: 'デモの準備はできています。弊社のケースでどう使えるか見せてください。',
    follow_up_call: 'あ、先週お会いした方ですね。すみません、バタバタしておりまして。',
    follow_up_no_response: 'あ...メールは拝見していたのですが、申し訳ありません、ここ数週間忙しくてお返事できず。',
    referral_ask: '製品の調子は良いですよ！今日はどういったご用件でしょうか？',
    referral_introduction: 'こんにちは、共通の知り合いの方からご紹介いただきました。少しだけお時間あります。',
    upsell: '今のプランには満足していますよ。アップグレードの話というのは？',
    cross_sell: 'そちらのサービスもやっていらっしゃるんですね。もう少し詳しく教えてください。',
    negotiation_discount: '価格はもっと下げていただかないと。少なくとも30%オフは必要です。',
    negotiation_terms: '30日払いは厳しいです。この規模の取引だと、経理から最低60日は欲しいと言われておりまして。',
    gate_keeper: 'おはようございます。○○会社でございます。どちらにお繋ぎいたしましょうか？',
    executive_pitch: '10分でお願いします。弊社にとっての戦略的価値を教えてください。',
    networking_event: 'こんにちは！今日はどういったきっかけでいらっしゃったんですか？',
    linkedin_outreach: '（LinkedInのメッセージを見ています）ふむ、興味深いですね。もう少し詳しくお聞かせいただけますか？',
  },

  'ko': {
    cold_call: '여보세요? 누구시죠?',
    objection_price: '제품은 마음에 드는데요, 솔직히 말씀드리면 저희 예산 대비 가격이 너무 높아요.',
    objection_timing: '관심은 있는데, 이번 분기 예산이 이미 확정됐어요. 내년에 다시 얘기할 수 있을까요?',
    objection_competitor: '저희가 이미 다른 업체 제품을 쓰고 있거든요. 지금까지 별 문제 없이 잘 쓰고 있어요.',
    objection_no_budget: '발표 잘 들었습니다. 근데 지금은 정말 예산이 없어요.',
    objection_need_approval: '개인적으로는 괜찮다고 생각하는데, 이건 대표님한테 보고드려야 해요. 제가 결정할 수 있는 사안이 아니라서요.',
    objection_already_have: '저희 이미 비슷한 솔루션을 쓰고 있어요. 또 다른 걸 도입할 필요가 있을지 모르겠네요.',
    objection_too_complex: '기능이 강력한 건 알겠는데, 도입하는 데 몇 달 걸릴 것 같고 저희 팀이 적응하기 어려울 것 같아 걱정이에요.',
    objection_not_interested: '연락 감사합니다만, 저희한테는 필요 없을 것 같아요.',
    objection_send_info: '자료만 보내주시겠어요? 시간 될 때 한번 살펴볼게요.',
    needs_discovery: '안녕하세요, 시간 내주셔서 감사합니다. 사실 저희도 뭐가 필요한지 정확히 모르겠는데, 현재 프로세스에 좀 어려움이 있어요.',
    needs_deep_dive: '저희 업무 프로세스에 구체적인 문제가 있어서요. 상황을 좀 설명드릴게요...',
    closing_assumptive: '제안서 검토해봤는데요, 거의 마음이 기울었는데 아직 몇 가지 걱정되는 부분이 있어요.',
    closing_urgency: '솔루션 자체는 괜찮은데, 급하지는 않아서 다음 분기에 봐도 될 것 같은데요.',
    closing_summary: '여러 번 미팅했잖아요. 최종 결정 전에 핵심 포인트를 한번 더 정리해주시겠어요?',
    closing_alternative: '귀사 솔루션이랑 다른 옵션 사이에서 고민 중인데, 같이 좀 분석해주실 수 있나요?',
    presentation: '프레젠테이션 시작해주세요. 30분 정도 시간 있습니다.',
    presentation_demo: '데모 볼 준비 됐습니다. 저희 상황에 어떻게 적용되는지 보여주세요.',
    follow_up_call: '아, 네 지난주에 뵀죠. 죄송해요, 요즘 너무 바빠서요.',
    follow_up_no_response: '아... 이메일은 본 것 같은데, 죄송합니다 요 몇 주가 정말 정신없어서요.',
    referral_ask: '제품 잘 쓰고 있어요! 오늘은 무슨 일로 연락주셨나요?',
    referral_introduction: '안녕하세요, 아는 분이 한번 얘기해보라고 해서요. 잠깐 시간 있습니다.',
    upsell: '지금 플랜 잘 쓰고 있는데요. 업그레이드가 뭔가요?',
    cross_sell: '그런 서비스도 하시는지 몰랐네요. 좀 더 설명해주세요.',
    negotiation_discount: '가격을 좀 많이 내려주셔야 해요. 최소 30% 할인은 돼야 합니다.',
    negotiation_terms: '30일 결제는 저희한테 부담이에요. 이 규모면 재무팀에서 최소 60일은 필요하다고 합니다.',
    gate_keeper: '안녕하세요, OO회사입니다. 어디로 연결해드릴까요?',
    executive_pitch: '10분 드리겠습니다. 저희 조직에 어떤 전략적 가치가 있는지 말씀해주세요.',
    networking_event: '안녕하세요! 어떻게 이 행사에 오시게 됐나요?',
    linkedin_outreach: '(LinkedIn 메시지를 보며) 음, 흥미롭네요. 어떤 일을 하시는지 좀 더 말씀해주세요.',
  },

  'th': {
    cold_call: 'สวัสดีครับ/ค่ะ ขอโทษนะครับ ใครโทรมาครับ?',
    objection_price: 'สินค้าน่าสนใจนะครับ แต่พูดตรงๆ ราคานี้เกินงบที่เราตั้งไว้มากเลยครับ',
    objection_timing: 'น่าสนใจนะครับ แต่ตอนนี้งบประมาณไตรมาสนี้ปิดไปแล้วครับ ไว้ปีหน้าค่อยมาคุยกันใหม่ได้ไหมครับ?',
    objection_competitor: 'จริงๆ เราใช้ของอีกเจ้าอยู่แล้วครับ ใช้ได้ดีไม่มีปัญหาอะไรครับ',
    objection_no_budget: 'ขอบคุณสำหรับการนำเสนอนะครับ แต่ตอนนี้เราไม่มีงบสำหรับส่วนนี้จริงๆ ครับ',
    objection_need_approval: 'ผมเองคิดว่ามันดีนะครับ แต่ต้องเสนอผู้บริหารก่อน ผมตัดสินใจเองไม่ได้ครับ',
    objection_already_have: 'เรามีระบบคล้ายๆ แบบนี้ใช้อยู่แล้วครับ ไม่แน่ใจว่าจำเป็นต้องมีอีกตัวไหมครับ',
    objection_too_complex: 'ดูเหมือนฟีเจอร์จะเยอะมากนะครับ แต่ผมกังวลว่าจะใช้เวลานานในการติดตั้ง แล้วทีมงานจะปรับตัวยากครับ',
    objection_not_interested: 'ขอบคุณที่ติดต่อมานะครับ แต่คิดว่าเราคงไม่ได้ใช้ครับ',
    objection_send_info: 'ส่งเอกสารมาให้ดูก่อนได้ไหมครับ? ว่างเมื่อไหร่จะดูให้ครับ',
    needs_discovery: 'สวัสดีครับ ขอบคุณที่มาพบนะครับ จริงๆ เราก็ยังไม่แน่ใจว่าต้องการอะไร แต่ตอนนี้กระบวนการทำงานมีปัญหาอยู่บ้างครับ',
    needs_deep_dive: 'เรามีปัญหาเฉพาะเจาะจงเกี่ยวกับขั้นตอนการทำงานครับ ผมจะอธิบายให้ฟังนะครับ...',
    closing_assumptive: 'ผมคิดเรื่องข้อเสนอของคุณมาแล้วครับ ส่วนใหญ่โอเคแล้ว แต่ยังมีบางจุดที่กังวลอยู่ครับ',
    closing_urgency: 'โซลูชันดีนะครับ แต่ไม่ได้รีบขนาดนั้น ไว้ไตรมาสหน้าก็ได้มั้งครับ',
    closing_summary: 'เราคุยกันมาหลายครั้งแล้วนะครับ ก่อนตัดสินใจขั้นสุดท้าย ช่วยสรุปประเด็นสำคัญให้อีกทีได้ไหมครับ?',
    closing_alternative: 'ผมกำลังลังเลระหว่างของคุณกับอีกตัวเลือกหนึ่งครับ ช่วยวิเคราะห์ให้หน่อยได้ไหมครับ?',
    presentation: 'เชิญเริ่มนำเสนอเลยครับ ผมมีเวลาประมาณ 30 นาทีครับ',
    presentation_demo: 'พร้อมดูเดโมแล้วครับ ลองโชว์ให้ดูว่าจะใช้กับงานของเราได้ยังไงครับ',
    follow_up_call: 'อ้อ ครับ จำได้ครับ เจอกันเมื่ออาทิตย์ที่แล้ว ขอโทษนะครับ ช่วงนี้ยุ่งมากเลยครับ',
    follow_up_no_response: 'อ้อ... อีเมลเหมือนเห็นผ่านตาครับ ขอโทษนะครับ ช่วงนี้วุ่นวายมากจริงๆ ครับ',
    referral_ask: 'ดีใจที่สินค้าใช้ได้ดีนะครับ! วันนี้มีอะไรให้ช่วยครับ?',
    referral_introduction: 'สวัสดีครับ คนรู้จักบอกว่าน่าจะลองคุยกันดู ผมมีเวลาสักครู่ครับ',
    upsell: 'แพลนตอนนี้ก็ใช้ดีอยู่นะครับ อัปเกรดคืออะไรครับ?',
    cross_sell: 'ไม่รู้ว่าทางคุณมีบริการนี้ด้วยนะครับ เล่าให้ฟังหน่อยสิครับ',
    negotiation_discount: 'ราคาต้องลดลงเยอะๆ เลยนะครับ เราต้องการส่วนลดอย่างน้อย 30% ครับ',
    negotiation_terms: '30 วันมันสั้นไปสำหรับเราครับ ฝ่ายการเงินบอกว่าต้อง 60 วันเป็นอย่างน้อยสำหรับยอดขนาดนี้ครับ',
    gate_keeper: 'สวัสดีครับ บริษัท OO ครับ ต้องการติดต่อใครครับ?',
    executive_pitch: 'มี 10 นาทีครับ บอกมาเลยว่ามีคุณค่าเชิงกลยุทธ์อะไรสำหรับองค์กรเราครับ',
    networking_event: 'สวัสดีครับ! มาร่วมงานนี้ด้วยเหรอครับ?',
    linkedin_outreach: '(กำลังอ่านข้อความ LinkedIn ของคุณ) อืม น่าสนใจนะครับ เล่าให้ฟังหน่อยว่าทำอะไรครับ',
  },

  'vi': {
    cold_call: 'Alo? Xin lỗi, ai gọi đây ạ?',
    objection_price: 'Sản phẩm thì tôi thấy ổn, nhưng nói thật là mức giá này vượt xa ngân sách của bên mình rồi anh/chị ạ.',
    objection_timing: 'Cái này hay đấy, nhưng ngân sách quý này bên mình đã chốt rồi. Sang năm mình bàn lại được không ạ?',
    objection_competitor: 'Thực ra bên mình đang dùng sản phẩm của bên khác rồi, dùng cũng ổn không có vấn đề gì.',
    objection_no_budget: 'Cảm ơn anh/chị đã trình bày. Nhưng hiện tại bên mình thực sự không có ngân sách cho khoản này.',
    objection_need_approval: 'Cá nhân tôi thì thấy được, nhưng cái này phải trình lên sếp quyết định, tôi không tự quyết được.',
    objection_already_have: 'Bên mình đã có giải pháp tương tự đang dùng rồi. Chưa chắc cần thêm cái nữa đâu.',
    objection_too_complex: 'Tính năng thì nhiều thật, nhưng tôi lo triển khai mất mấy tháng, đội ngũ bên mình sẽ khó thích nghi lắm.',
    objection_not_interested: 'Cảm ơn anh/chị đã liên hệ, nhưng có lẽ bên mình không cần cái này.',
    objection_send_info: 'Anh/chị gửi tài liệu qua cho tôi đi, khi nào rảnh tôi sẽ xem.',
    needs_discovery: 'Chào anh/chị, cảm ơn đã dành thời gian. Thực ra bên mình cũng chưa biết chính xác cần gì, nhưng quy trình hiện tại đang gặp một số khó khăn.',
    needs_deep_dive: 'Bên mình có một vấn đề cụ thể trong quy trình làm việc. Để tôi mô tả tình hình cho anh/chị nghe...',
    closing_assumptive: 'Đề xuất của anh/chị tôi đã xem kỹ rồi. Về cơ bản thì đồng ý, nhưng vẫn còn vài điểm băn khoăn.',
    closing_urgency: 'Giải pháp thì tốt, nhưng bên mình không gấp lắm. Quý sau xem cũng được mà.',
    closing_summary: 'Mình đã trao đổi nhiều lần rồi. Trước khi tôi quyết định cuối cùng, anh/chị tổng hợp lại các điểm chính cho tôi một lần nữa được không?',
    closing_alternative: 'Tôi đang phân vân giữa bên anh/chị và một lựa chọn khác. Giúp tôi phân tích được không?',
    presentation: 'Anh/chị bắt đầu trình bày đi. Tôi có khoảng 30 phút.',
    presentation_demo: 'Tôi sẵn sàng xem demo rồi. Cho tôi xem cách áp dụng cho trường hợp cụ thể bên mình nhé.',
    follow_up_call: 'À anh/chị, tôi nhớ rồi, tuần trước mình gặp nhau mà. Xin lỗi dạo này bận quá.',
    follow_up_no_response: 'À... hình như tôi có thấy email, xin lỗi anh/chị, mấy tuần nay bận túi bụi quá.',
    referral_ask: 'Vui là sản phẩm bên mình dùng tốt! Hôm nay anh/chị cần gì ạ?',
    referral_introduction: 'Chào anh/chị, người quen giới thiệu nên tôi muốn trao đổi thử. Tôi có vài phút.',
    upsell: 'Gói hiện tại dùng ổn mà. Nâng cấp là nâng cái gì vậy?',
    cross_sell: 'Không biết bên anh/chị còn có dịch vụ này nữa. Kể tôi nghe thêm đi.',
    negotiation_discount: 'Giá phải giảm nhiều hơn nữa. Bên mình cần tối thiểu giảm 30%.',
    negotiation_terms: 'Thanh toán 30 ngày hơi gấp cho bên mình. Bộ phận tài chính nói ít nhất phải 60 ngày cho đơn hàng lớn thế này.',
    gate_keeper: 'Xin chào, công ty OO xin nghe. Anh/chị cần gặp ai ạ?',
    executive_pitch: 'Anh/chị có 10 phút. Nói cho tôi biết giá trị chiến lược cho tổ chức của tôi là gì.',
    networking_event: 'Chào anh/chị! Anh/chị đến sự kiện này vì lý do gì vậy?',
    linkedin_outreach: '(Đang xem tin nhắn LinkedIn của anh/chị) Hmm, hay đấy. Kể thêm về công việc của anh/chị đi.',
  },
}

// 英文預設開場白
const DEFAULT_OPENINGS: Record<CoachScenario, string> = {
  cold_call: 'Hello? Who is this?',
  objection_price: 'I like what I see, but honestly, the pricing is way beyond what we budgeted for this.',
  objection_timing: 'This looks interesting, but we just finalized our budget for this quarter. Can we revisit this next year?',
  objection_competitor: 'We actually already use [Competitor] for this. It\'s working fine for us.',
  objection_no_budget: 'I appreciate the presentation, but we simply don\'t have budget for this right now.',
  objection_need_approval: 'I personally think this could work, but I\'d need to run this by my director first.',
  objection_already_have: 'We already have something similar in place. I\'m not sure we need another solution.',
  objection_too_complex: 'This seems very powerful, but I\'m worried it would take months to implement and my team would struggle with it.',
  objection_not_interested: 'Thanks for reaching out, but I don\'t think this is something we need.',
  objection_send_info: 'Why don\'t you just send me some materials and I\'ll take a look when I get a chance?',
  needs_discovery: 'Hi, thanks for meeting with me. I\'m not entirely sure what we need, but we\'ve been having some challenges with our current process.',
  needs_deep_dive: 'We have a very specific problem with our workflow. Let me explain what\'s happening...',
  closing_assumptive: 'I\'ve been thinking about your proposal. I\'m mostly convinced, but I still have a few concerns.',
  closing_urgency: 'I do like the solution, but there\'s no real rush on our end. We can probably look at this next quarter.',
  closing_summary: 'We\'ve had several discussions now. Before I make a final decision, can you walk me through the key points one more time?',
  closing_alternative: 'I\'m stuck between your solution and another option. Help me think through this.',
  presentation: 'Please go ahead with your presentation. I have about 30 minutes.',
  presentation_demo: 'I\'m ready for the demo. Show me how this would work for our specific use case.',
  follow_up_call: 'Oh hi, yes I remember you from last week. Sorry I\'ve been swamped.',
  follow_up_no_response: 'Oh... yes, I think I saw your emails. Sorry, it\'s been a crazy few weeks.',
  referral_ask: 'Glad the product is working well for us! What can I help you with today?',
  referral_introduction: 'Hi, [mutual connection] mentioned I should talk to you. I have a few minutes.',
  upsell: 'We\'re happy with the current plan. What\'s this about an upgrade?',
  cross_sell: 'I didn\'t know you offered that as well. Tell me more.',
  negotiation_discount: 'The price needs to come down significantly. We\'re looking at at least 30% off.',
  negotiation_terms: 'Net 30 is tough for us. Our finance team needs at least net 60 for purchases this size.',
  gate_keeper: 'Good morning, [Company name]. How can I direct your call?',
  executive_pitch: 'You have 10 minutes. What\'s the strategic value for my organization?',
  networking_event: 'Hi there! What brings you to this event?',
  linkedin_outreach: '[Viewing your LinkedIn message...] Hmm, interesting. Tell me more about what you do.',
}

export function buildInitialClientMessage(
  scenario: CoachScenario,
  culture: BusinessCulture,
  locale: SupportedLocale
): string {
  // 優先使用該語言的翻譯版本
  const localizedOpenings = LOCALIZED_OPENINGS[locale]
  if (localizedOpenings?.[scenario]) {
    return localizedOpenings[scenario]
  }

  // 預設英文
  return DEFAULT_OPENINGS[scenario] ?? 'Hello, how can I help you?'
}
