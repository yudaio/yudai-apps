'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const C = {
  bg:'#050812', surface:'#0C0E1F', card:'#0F1126',
  border:'#1A2040', borderHi:'#2A3460',
  text:'#E2E8FF', muted:'#5A6890', mutedHi:'#8A9CC0',
  accent:'#6366F1', violet:'#A78BFA', cyan:'#38BDF8', green:'#34D399',
  rose:'#FB7185', amber:'#FBBF24',
};

/* ── カテゴリ別アプリデータ ── */
const CATEGORIES = [
  {
    id: 'ai-chat',
    label: 'AIチャット',
    icon: '💬',
    color: '#C8A84B',
    apps: [
      { id:'koe',     icon:'🕯️', title:'声の遺産',    sub:'大切な人の言葉を登録→いつでも話しかけられる追悼AIチャット', color:'#C8A84B', tag:'追悼', badge:'人気No.1' },
      { id:'konoka',  icon:'🌸', title:'このちゃんAI', sub:'日向坂46・松田好花の話し方をAIが再現。ファン必見', color:'#F472B6', tag:'ファン' },
      { id:'untangle',icon:'🧩', title:'Untangle',     sub:'人生の「足かせ」をAIカウンセラーが対話で解きほぐす', color:'#7C5CFC', tag:'カウンセリング' },
    ],
  },
  {
    id: 'ai-diagnosis',
    label: 'AI診断・分析',
    icon: '🔮',
    color: '#818CF8',
    apps: [
      { id:'fate',    icon:'🔮', title:'運命診断',    sub:'統計と心理学がビジョンを解析。あなたの本質を暴く', color:'#7C3AED', tag:'診断' },
      { id:'marry',   icon:'💍', title:'婚活診断',    sub:'AI面接官があなたの婚活力を10項目でスコア診断', color:'#EC4899', tag:'婚活', badge:'NEW' },
      { id:'side',    icon:'💰', title:'副業診断',    sub:'スキル・時間・目標を入力→最適な副業ロードマップを生成', color:'#F59E0B', tag:'副業' },
      { id:'muda',    icon:'🧠', title:'無駄削減',    sub:'週のルーティンを入力→節約できる時間を数値で可視化', color:'#0891B2', tag:'効率' },
      { id:'rant',    icon:'💢', title:'鬱憤爆発',    sub:'理不尽・社会への怒りを哲学・データ・感情の3視点で解剖', color:'#DC2626', tag:'社会' },
      { id:'tarot',   icon:'🎴', title:'AIタロット',  sub:'3枚のカードが過去・現在・未来を映す。AIが深い洞察でリーディング', color:'#7C3AED', tag:'占い', badge:'NEW' },
      { id:'fortune', icon:'🌟', title:'今日の運勢',  sub:'12星座ごとにAIが毎日生成。恋愛・仕事・健康・金運をスコアで可視化', color:'#F59E0B', tag:'星占い', badge:'NEW' },
      { id:'aiai',    icon:'💕', title:'AI相性診断',  sub:'名前と星座を入力→AIがスコアで相性を診断。恋愛・友情・仕事を多角的に分析', color:'#EC4899', tag:'相性', badge:'NEW' },
    ],
  },
  {
    id: 'ai-learning',
    label: '学習・スキル',
    icon: '📚',
    color: '#38BDF8',
    apps: [
      { id:'eigo',      icon:'🗣️', title:'AI英会話',    sub:'ネイティブAIと英語でチャット練習。レベル・トピックを選んで会話力を磨く', color:'#38BDF8', tag:'英語', badge:'NEW' },
      { id:'vocab',     icon:'📖', title:'英単語クイズ', sub:'初〜上級3レベルの10問クイズ。正解後にAIが例文と解説を生成して記憶を定着', color:'#A78BFA', tag:'語彙', badge:'NEW' },
      { id:'interview', icon:'🎤', title:'AI面接練習',   sub:'AIが面接官に。質問3問に答えるとスコア・改善点・模範回答をリアルタイムフィードバック', color:'#7C5CFC', tag:'就活', badge:'NEW' },
    ],
  },
  {
    id: 'ai-creation',
    label: 'AI生成・創作',
    icon: '✨',
    color: '#34D399',
    apps: [
      { id:'dream',   icon:'🌙', title:'夢映像化',    sub:'昨夜の夢をAIが詩的散文＋AIアート画像として永遠に残す', color:'#0D9488', tag:'AI画像' },
      { id:'monster', icon:'👾', title:'言葉モンスター',sub:'日記からAIが唯一無二の感情モンスターを召喚。図鑑機能も', color:'#34D399', tag:'図鑑' },
      { id:'suno',    icon:'🎵', title:'Melody AI',   sub:'テキスト→プロ品質の楽曲歌詞を瞬時に生成。ジャンル選択も', color:'#8B5CF6', tag:'音楽' },
      { id:'biz',     icon:'📊', title:'ビジネス文書', sub:'提案書・企画書・メールをAIが業界水準で自動作成', color:'#2563EB', tag:'仕事' },
      { id:'kokoro',  icon:'🪞', title:'内省',         sub:'毎日の記録をAIが感情タグ付け。パターン分析で自己理解が深まる', color:'#7C6FFF', tag:'日記' },
      { id:'poem',    icon:'✍️', title:'AIポエム',     sub:'テーマを入力するだけでAIが俳句・短歌・自由詩・恋詩を生成する', color:'#F472B6', tag:'詩', badge:'NEW' },
      { id:'message',   icon:'💌', title:'AIメッセージ',   sub:'誕生日・感謝・告白・謝罪など8シーンのメッセージをAIが代筆する', color:'#FB923C', tag:'言葉', badge:'NEW' },
      { id:'selfintro', icon:'🪪', title:'AI自己紹介文',   sub:'SNS・名刺・婚活・スピーチなど6用途に最適化した自己紹介文をAIが即座に生成する', color:'#A78BFA', tag:'紹介', badge:'NEW' },
    ],
  },
  {
    id: 'tools',
    label: 'ツール・体験',
    icon: '🛠️',
    color: '#38BDF8',
    apps: [
      { id:'books',   icon:'📖', title:'感情図書館',  sub:'今の感情を入力→AIが運命の一冊を選書。読書体験が変わる', color:'#4F46E5', tag:'読書' },
      { id:'genki',   icon:'🌐', title:'元気玉',      sub:'あなたの気分を送信→世界中の人の感情とリアルタイムで繋がる', color:'#D97706', tag:'コミュニティ' },
      { id:'yamato',  icon:'⛩️', title:'大和魂教育',  sub:'日本の文化・歴史・精神をゲーム形式で学べる教育コンテンツ', color:'#B45309', tag:'教育' },
      { id:'vending', icon:'🎰', title:'自販機マップ', sub:'現在地周辺の自販機を地図で即表示。無料GPSツール', color:'#2563EB', tag:'MAP' },
      { id:'recipe',  icon:'🍳', title:'AIレシピ',    sub:'冷蔵庫の食材を入力するだけでAIがレシピを提案。ジャンル・時間・人数で絞り込み', color:'#FB923C', tag:'料理', badge:'NEW' },
      { id:'travel',  icon:'✈️', title:'AI旅行プランナー', sub:'目的地と日数を入力するだけでAIが旅行プランを自動生成。午前・午後・夜の詳細スケジュール付き', color:'#38BDF8', tag:'旅行', badge:'NEW' },
    ],
  },
  {
    id: 'beauty-growth',
    label: '美容・成長',
    icon: '✨',
    color: '#C8A96E',
    apps: [
      { id:'faceglow', icon:'✨', title:'FACEGLOW',      sub:'AIが顔を診断し理想のルックスを可視化。改善ポイントを詳しく解説', color:'#C8A96E', tag:'美容', badge:'NEW' },
      { id:'growth',   icon:'📈', title:'Growth Tracker', sub:'13軸レーダーチャートで自己成長を可視化。AIと一緒に習慣管理', color:'#22C55E', tag:'成長' },
      { id:'coach',    icon:'🎯', title:'AIコーチ',       sub:'専属AIコーチとチャットしながら目標達成を加速。タスク管理付き', color:'#7C5CFC', tag:'コーチング' },
    ],
  },
];

const ALL_APPS = CATEGORIES.flatMap(c => c.apps);

/* ── アニメーション付きカード ── */
function AppCard({ app, size = 'normal' }) {
  const [hov, setHov] = useState(false);
  const large = size === 'large';
  return (
    <Link href={`/${app.id}`} style={{ textDecoration:'none', display:'block', height:'100%' }}>
      <div
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{
          height:'100%',
          padding: large ? '24px' : '18px 16px',
          background: hov ? '#0F1330' : '#0C0E22',
          border:`1px solid ${hov ? app.color+'55' : '#1E2448'}`,
          borderRadius:16, position:'relative', overflow:'hidden',
          boxShadow: hov ? `0 16px 48px ${app.color}20, 0 0 0 1px ${app.color}18` : 'none',
          transition:'all 0.22s ease',
          transform: hov ? 'translateY(-3px)' : 'none',
          cursor:'pointer',
        }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:`radial-gradient(circle, ${app.color}20 0%, transparent 70%)`, opacity: hov ? 1 : 0.5, transition:'opacity 0.3s', pointerEvents:'none' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, padding:'3px 8px', borderRadius:12, background:app.color+'18', color:app.color, border:`1px solid ${app.color}30`, fontWeight:700 }}>{app.tag}</span>
            {app.badge && <span style={{ fontSize:10, padding:'3px 8px', borderRadius:12, background:'#F59E0B18', color:'#F59E0B', border:'1px solid #F59E0B30', fontWeight:700 }}>{app.badge}</span>}
          </div>
          <span style={{ fontSize: large ? 28 : 22 }}>{app.icon}</span>
        </div>
        <div style={{ color:C.text, fontSize: large ? 16 : 14, fontWeight:700, marginBottom:5, position:'relative' }}>{app.title}</div>
        <div style={{ color:C.muted, fontSize: large ? 13 : 12, lineHeight:1.65, position:'relative' }}>{app.sub}</div>
        <div style={{ position:'relative', marginTop:10, color:app.color, fontSize:12, fontWeight:600, opacity:hov?1:0, transform:hov?'translateX(0)':'translateX(-6px)', transition:'all 0.18s' }}>試してみる →</div>
      </div>
    </Link>
  );
}

/* ── ビデオ風デモカード ── */
function DemoCard({ app, steps }) {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActiveStep(s => (s + 1) % steps.length), 2400);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div style={{ background:'#0C0E22', border:`1px solid #1E2448`, borderRadius:20, overflow:'hidden' }}>
      {/* プレビューエリア */}
      <div style={{ padding:'28px 24px', background:`linear-gradient(135deg, ${app.color}10, #050812)`, borderBottom:'1px solid #1E2448', minHeight:160, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:app.color+'20', border:`1px solid ${app.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{app.icon}</div>
          <div>
            <div style={{ color:C.text, fontSize:16, fontWeight:800 }}>{app.title}</div>
            <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{app.sub}</div>
          </div>
        </div>
        {/* アニメーションステップ */}
        <div style={{ fontSize:13, color:C.text, lineHeight:1.8, background:'rgba(0,0,0,0.3)', padding:'12px 16px', borderRadius:10, borderLeft:`3px solid ${app.color}`, minHeight:60, transition:'all 0.3s' }}>
          <span style={{ color:app.color, fontWeight:700, fontSize:11, display:'block', marginBottom:4 }}>STEP {activeStep+1}</span>
          {steps[activeStep]}
        </div>
      </div>
      {/* ステップインジケーター */}
      <div style={{ padding:'14px 24px', display:'flex', alignItems:'center', gap:8 }}>
        {steps.map((_,i) => (
          <div key={i} onClick={()=>setActiveStep(i)} style={{ flex:i===activeStep?2:1, height:3, borderRadius:4, background:i===activeStep?app.color:'#1E2448', transition:'all 0.3s', cursor:'pointer' }}/>
        ))}
        <Link href={`/${app.id}`} style={{ textDecoration:'none', marginLeft:'auto' }}>
          <button style={{ padding:'8px 18px', background:app.color, border:'none', borderRadius:10, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>使ってみる →</button>
        </Link>
      </div>
    </div>
  );
}

/* ── 統計カウンター ── */
function StatBar() {
  const stats = [
    { val:'31', label:'アプリ',   icon:'📦', sub:'すべて無料で使える' },
    { val:'12', label:'AI搭載',   icon:'🤖', sub:'生成AI活用' },
    { val:'6',  label:'カテゴリ', icon:'🗂️', sub:'診断・英語・美容・詩' },
    { val:'∞',  label:'使い放題', icon:'✨', sub:'登録不要でOK' },
  ];
  return (
    <div style={{ maxWidth:800, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'#0C0E22', border:'1px solid #1E2448', borderRadius:18, overflow:'hidden' }}>
      {stats.map((s,i)=>(
        <div key={i} style={{ padding:'20px 12px', textAlign:'center', borderRight:i<3?'1px solid #1E2448':'none' }}>
          <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
          <div style={{ fontSize:28, fontWeight:900, background:'linear-gradient(135deg,#A78BFA,#6366F1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{s.val}</div>
          <div style={{ color:C.muted, fontSize:11, marginTop:2, fontWeight:600 }}>{s.label}</div>
          <div style={{ color:'#2A3460', fontSize:10, marginTop:1 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ── プレミアムCTA ── */
function PremiumCTA() {
  return (
    <section style={{ padding:'0 24px 80px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{
          background:'linear-gradient(135deg, #1A0A40 0%, #0D1235 50%, #041020 100%)',
          border:'1px solid #4C1D9550',
          borderRadius:24, padding:'40px 32px',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, #7C3AED20, transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, #6366F115, transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ position:'relative' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', background:'#7C3AED20', border:'1px solid #7C3AED40', borderRadius:20, color:'#C084FC', fontSize:11, fontWeight:700, marginBottom:18 }}>✨ PREMIUM</div>
            <h2 style={{ color:C.text, fontSize:'clamp(22px,4vw,32px)', fontWeight:900, letterSpacing:'-0.03em', margin:'0 0 14px', lineHeight:1.2 }}>もっと深く、もっと自由に</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.9, margin:'0 0 24px', maxWidth:480 }}>
              プレミアムで利用回数の制限を解除。履歴の保存・エクスポート・優先AI処理で、毎日の記録と創作が加速します。
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:28 }}>
              {[
                { icon:'🚀', text:'AI使い放題（回数無制限）' },
                { icon:'💾', text:'履歴・結果を無制限に保存' },
                { icon:'⚡', text:'優先AI処理（高速レスポンス）' },
                { icon:'📤', text:'PDF・テキストエクスポート' },
              ].map((f,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid #ffffff0F' }}>
                  <span style={{ fontSize:16 }}>{f.icon}</span>
                  <span style={{ color:C.mutedHi, fontSize:12 }}>{f.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
              <button style={{ padding:'14px 28px', background:'linear-gradient(135deg,#7C3AED,#6366F1)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 28px #7C3AED40', letterSpacing:'-0.01em' }}>
                ✨ 7日間無料で試す
              </button>
              <span style={{ color:'#3A4870', fontSize:12 }}>その後 ¥480/月 · いつでもキャンセル可</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 使い方 3ステップ ── */
function HowItWorks() {
  const steps = [
    { icon:'📲', title:'アプリを選ぶ', desc:'31本の中から気になるアプリをタップ。登録不要・すぐ使える。' },
    { icon:'✍️', title:'テキストを入力', desc:'今の気持ちや質問を自由に書くだけ。難しい設定は一切なし。' },
    { icon:'🤖', title:'AIが即座に応答', desc:'最新AIが個別の回答・診断・創作物を数秒で生成する。' },
  ];
  return (
    <section style={{ padding:'0 24px 72px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:11, color:C.cyan, letterSpacing:'0.15em', fontWeight:700, textTransform:'uppercase', marginBottom:12 }}>✦ 使い方</div>
          <h2 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:900, color:C.text, letterSpacing:'-0.025em', margin:'0 0 10px' }}>3ステップで始められる</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {steps.map((s,i)=>(
            <div key={i} style={{ textAlign:'center', padding:'24px 16px', background:'#0C0E22', border:'1px solid #1E2448', borderRadius:16, position:'relative' }}>
              {i < 2 && <div style={{ position:'absolute', top:'50%', right:-9, transform:'translateY(-50%)', color:'#1E2448', fontSize:18, fontWeight:900, zIndex:1 }}>›</div>}
              <div style={{ width:52, height:52, borderRadius:'50%', background:'#6366F115', border:'1px solid #6366F130', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 14px' }}>{s.icon}</div>
              <div style={{ color:C.text, fontSize:14, fontWeight:700, marginBottom:8 }}>{s.title}</div>
              <div style={{ color:C.muted, fontSize:12, lineHeight:1.7 }}>{s.desc}</div>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:900, margin:'14px auto 0' }}>{i+1}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── デモプレビューセクション ── */
function DemoSection() {
  const demos = [
    {
      app: { id:'koe', icon:'🕯️', title:'声の遺産', sub:'追悼AIチャット', color:'#C8A84B' },
      steps: [
        '「父」「母」など大切だった人を登録する',
        'その人の口癖・思い出・言葉を追加していく',
        'チャットで話しかけると、その人の話し方でAIが応答する',
        '会話記録が積み重なり、永遠の「声の遺産」になる',
      ],
    },
    {
      app: { id:'fate', icon:'🔮', title:'運命診断', sub:'AIビジョン解析', color:'#7C3AED' },
      steps: [
        '生年月日・名前・現在の状況をテキストで入力する',
        'AIが統計・心理学・パターン認識で分析を開始',
        '「あなたの本質」「強み」「隠れた才能」が明らかに',
        '結果をシェアして友人と比較できる',
      ],
    },
    {
      app: { id:'dream', icon:'🌙', title:'夢映像化', sub:'AI詩的散文＋AI画像', color:'#0D9488' },
      steps: [
        '今朝の夢を覚えている断片をテキストで書く',
        'AIが夢を詩的な散文として美しく変換する',
        'Pollinations AIが夢の情景を画像として生成',
        '夢日記として保存・SNSシェアができる',
      ],
    },
  ];

  return (
    <section style={{ padding:'0 24px 72px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:11, color:C.green, letterSpacing:'0.15em', fontWeight:700, textTransform:'uppercase', marginBottom:12 }}>▶ デモ</div>
          <h2 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:900, color:C.text, letterSpacing:'-0.025em', margin:'0 0 10px' }}>こんなことができる</h2>
          <p style={{ color:C.muted, fontSize:14, margin:0 }}>人気アプリの使い方をアニメーションで確認</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {demos.map((d,i) => <DemoCard key={i} app={d.app} steps={d.steps}/>)}
        </div>
      </div>
    </section>
  );
}

/* ── カテゴリセクション ── */
function CategorySection({ cat }) {
  return (
    <div style={{ marginBottom:48 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18, paddingBottom:12, borderBottom:`1px solid #1E2448` }}>
        <div style={{ width:36, height:36, borderRadius:10, background:cat.color+'18', border:`1px solid ${cat.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{cat.icon}</div>
        <div>
          <h2 style={{ color:C.text, fontSize:17, fontWeight:800, margin:0 }}>{cat.label}</h2>
        </div>
        <span style={{ color:C.muted, fontSize:12, marginLeft:'auto' }}>{cat.apps.length} apps</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
        {cat.apps.map(app => <AppCard key={app.id} app={app}/>)}
      </div>
    </div>
  );
}

/* ── デモ動画設定 ── */
// 実際のYouTubeショート動画URLを入れると動画が優先表示されます
// 例: "https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=VIDEO_ID"
const DEMO_VIDEOS = {
  koe: null, konoka: null, untangle: null,
  fate: null, marry: null, side: null, muda: null, rant: null, tarot: null, fortune: null, eigo: null, vocab: null, aiai: null,
  dream: null, monster: null, suno: null, biz: null, kokoro: null, poem: null, message: null, recipe: null, travel: null, interview: null,
  books: null, genki: null, yamato: null, vending: null, selfintro: null,
};

/* ── アプリごとのデモシナリオ (入力→AI処理→結果) ── */
const APP_DEMOS = {
  koe:     [
    { t:'in',    text:'お父さん\n聞こえる？' },
    { t:'out',   text:'ああ、元気か？\n毎日来いよ' },
    { t:'in',    text:'声が聞けて\nうれしい😭' },
  ],
  konoka:  [
    { t:'in',    text:'悩みがあって\n話していい？' },
    { t:'proc' },
    { t:'out',   text:'えっ！聞く聞く〜\n何があったの？🌸' },
  ],
  untangle:[
    { t:'input', text:'会社辞めたい\nでも怖い…' },
    { t:'proc' },
    { t:'res',   text:'根本: 人間関係72%\n→ 具体的対処法を提案' },
  ],
  fate:    [
    { t:'input', text:'1998年5月12日\n東京生まれ' },
    { t:'proc' },
    { t:'res',   text:'創造性 ★★★★★\n転機は28歳\n隠れた才: 芸術' },
  ],
  marry:   [
    { t:'input', text:'外見重視: 40%\n価値観重視: 80%' },
    { t:'proc' },
    { t:'res',   text:'婚活力 78/100\nタイプ: 誠実派\nマッチ率 高め' },
  ],
  side:    [
    { t:'input', text:'スキル: デザイン\n週3h / 月3万目標' },
    { t:'proc' },
    { t:'res',   text:'Canva副業\n月5万可能\n3ヶ月で達成見込み' },
  ],
  muda:    [
    { t:'input', text:'会議: 週8h\n通勤: 週5h\nSNS: 週7h' },
    { t:'proc' },
    { t:'res',   text:'削減可能\n週9.2時間\n= 年間480時間！' },
  ],
  rant:    [
    { t:'input', text:'理不尽な\nサービス残業\nもう限界です' },
    { t:'proc' },
    { t:'res',   text:'📐 哲学的視点\n📊 統計的視点\n❤️ 感情的視点' },
  ],
  dream:   [
    { t:'input', text:'空を飛んでた\n光の中で誰かが\n呼んでいた' },
    { t:'proc' },
    { t:'res',   text:'✨ 詩＋AI画像生成済\n夢日記に保存完了' },
  ],
  monster: [
    { t:'input', text:'今日も孤独感…\nずっとグルグル\n頭から離れない' },
    { t:'proc' },
    { t:'res',   text:'👾 召喚成功!\nソリュードラゴン\nLv.3 誕生' },
  ],
  suno:    [
    { t:'input', text:'失恋の夜\nJ-POPバラードで\n切ない雰囲気' },
    { t:'proc' },
    { t:'res',   text:'♪ 歌詞完成\n4コーラス構成\n→ Sunoで楽曲生成へ' },
  ],
  biz:     [
    { t:'input', text:'SNS広告\n提案書\n食品業界向け' },
    { t:'proc' },
    { t:'res',   text:'📄 文書完成\n8ページ構成\nすぐ使える' },
  ],
  kokoro:  [
    { t:'input', text:'今日は疲れた\nでも頑張れた' },
    { t:'res',   text:'タグ: 疲労・達成感\n今週: 疲労↑ 希望→' },
    { t:'res',   text:'📊 3週間グラフ\n感情の変化を可視化' },
  ],
  books:   [
    { t:'input', text:'今日は虚しくて\n何もしたくない' },
    { t:'proc' },
    { t:'res',   text:'📖 人間失格\n太宰 治\n→ 今の心に刺さる' },
  ],
  genki:   [
    { t:'input', text:'気分: 70点\nエネルギー高め\n前向きな朝' },
    { t:'proc' },
    { t:'res',   text:'🌐 世界と繋がった\n今日の平均 65点\n上位 20%' },
  ],
  yamato:  [
    { t:'res',   text:'Q: 武士道の\n精神とは？\n①〜③から選択' },
    { t:'in',    text:'① 誠実・礼儀\n   ・勇気' },
    { t:'res',   text:'✅ 正解！+10pt\n連続正解: 3🔥' },
  ],
  vending: [
    { t:'input', text:'📍 現在地を\n取得中...' },
    { t:'proc' },
    { t:'res',   text:'周辺に7台発見\n最近: 80m先\n→ ルート案内' },
  ],
  tarot: [
    { t:'input', text:'好きな人に\n告白すべきか\n迷っています…' },
    { t:'proc' },
    { t:'res',   text:'🎴 恋人・塔・星\n「転換期を経て\n希望が待つ」' },
  ],
  fortune: [
    { t:'res',  text:'♊ 双子座を選択' },
    { t:'proc' },
    { t:'res',  text:'総合運 82 🌟\n恋愛 ★★★★☆\n仕事 ★★★★★' },
  ],
  eigo: [
    { t:'in',  text:'Hello! My name is\nYudai and I\'m from\nYokohama!' },
    { t:'proc' },
    { t:'out', text:'That\'s great, Yudai!\nYokohama is amazing.\nWhat do you like there?' },
  ],
  poem: [
    { t:'input', text:'テーマ: 失恋\nスタイル: 自由詩' },
    { t:'proc' },
    { t:'res',   text:'傘もなく\n雨の中で笑った\nその日のことを\nまだ覚えてる' },
  ],
  aiai: [
    { t:'input', text:'ゆだい × あい\n♊双子座 × ♏蠍座' },
    { t:'proc' },
    { t:'res',   text:'💕 相性 88点\n運命の相手💜\n恋愛・仕事ともに◎' },
  ],
  message: [
    { t:'res',  text:'🎂 誕生日\nトーン: 温かく\n宛先: お母さん' },
    { t:'proc' },
    { t:'res',  text:'お母さん、いつも\nありがとう。あなたの\n笑顔が私の力です💕' },
  ],
  selfintro: [
    { t:'input', text:'📱 SNS用\n職業: エンジニア\n趣味: 旅行・写真' },
    { t:'proc' },
    { t:'res',   text:'🪪 自己紹介完成!\n親しみやすく\n100字で生成済み' },
  ],
};

/* ── アプリデモカード（アニメーション付き） ── */
function AppVideoCard({ app }) {
  const steps = APP_DEMOS[app.id] || [];
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!steps.length) return;
    const t = setInterval(() => setPhase(p => (p + 1) % steps.length), 2200);
    return () => clearInterval(t);
  }, [steps.length]);
  const step = steps[phase] || {};
  return (
    <div style={{ width:'100%', height:'100%', background:'linear-gradient(180deg,#0A0D1A 0%,#050810 100%)', border:`1px solid ${app.color}44`, display:'flex', flexDirection:'column' }}>
      {/* ヘッダー */}
      <div style={{ padding:'7px 8px', background:app.color+'18', borderBottom:`1px solid ${app.color}22`, display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
        <span style={{ fontSize:11 }}>{app.icon}</span>
        <span style={{ color:app.color, fontSize:8, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{app.title}</span>
      </div>
      {/* コンテンツ */}
      <div style={{ flex:1, padding:'8px', display:'flex', flexDirection:'column', justifyContent:'center', gap:5, overflow:'hidden' }}>
        {step.t === 'in' && (
          <div style={{ alignSelf:'flex-end', maxWidth:'88%', background:app.color+'30', border:`1px solid ${app.color}44`, borderRadius:'8px 8px 2px 8px', padding:'5px 7px', color:'#E2E8FF', fontSize:8.5, lineHeight:1.5, whiteSpace:'pre-line' }}>{step.text}</div>
        )}
        {step.t === 'out' && (
          <div style={{ alignSelf:'flex-start', maxWidth:'88%', background:'#161930', border:'1px solid #252848', borderRadius:'8px 8px 8px 2px', padding:'5px 7px', color:'#C5D0F0', fontSize:8.5, lineHeight:1.5, whiteSpace:'pre-line' }}>{step.text}</div>
        )}
        {step.t === 'proc' && (
          <div style={{ textAlign:'center' }}>
            <div style={{ display:'flex', gap:5, justifyContent:'center', marginBottom:6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:app.color, animation:`dotPulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
            </div>
            <div style={{ color:'#3A4870', fontSize:8 }}>AI処理中...</div>
          </div>
        )}
        {step.t === 'input' && (
          <div style={{ background:'#0A0D1A', border:'1px solid #1A2040', borderRadius:8, padding:'5px 7px', color:'#8A9CC0', fontSize:8, lineHeight:1.5, whiteSpace:'pre-line' }}>{step.text}</div>
        )}
        {step.t === 'res' && (
          <div style={{ background:app.color+'12', border:`1px solid ${app.color}30`, borderRadius:8, padding:'6px 8px', color:app.color, fontSize:8.5, fontWeight:600, lineHeight:1.6, whiteSpace:'pre-line' }}>{step.text}</div>
        )}
      </div>
      {/* プログレスバー */}
      <div style={{ padding:'5px 8px 7px', display:'flex', gap:3, flexShrink:0 }}>
        {steps.map((_,i) => <div key={i} style={{ flex:i===phase?2:1, height:2, borderRadius:2, background:i===phase?app.color:app.color+'28', transition:'all 0.4s ease' }}/>)}
      </div>
    </div>
  );
}

function VideoStrip() {
  return (
    <section style={{ padding:'0 0 52px', overflow:'hidden' }}>
      <div style={{ maxWidth:940, margin:'0 auto', padding:'0 24px', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:11, color:C.rose, letterSpacing:'0.15em', fontWeight:700, textTransform:'uppercase' }}>▶ デモ動画</div>
          <div style={{ flex:1, height:1, background:'#1E2448' }}/>
          <div style={{ fontSize:10, color:C.muted }}>← スクロール →</div>
        </div>
      </div>
      <div className="video-strip" style={{ paddingLeft:24, display:'flex', gap:10, overflowX:'auto', scrollSnapType:'x mandatory', WebkitOverflowScrolling:'touch' }}>
        {ALL_APPS.map(app => {
          const url = DEMO_VIDEOS[app.id];
          return (
            <Link key={app.id} href={`/${app.id}`} style={{ textDecoration:'none', flexShrink:0, scrollSnapAlign:'start' }}>
              <div style={{ width:120, height:213, borderRadius:14, overflow:'hidden' }}>
                {url
                  ? <iframe src={url} style={{ width:'100%', height:'100%', border:'none', display:'block' }} allow="autoplay; encrypted-media" allowFullScreen/>
                  : <AppVideoCard app={app}/>
                }
              </div>
              <div style={{ color:C.muted, fontSize:9, marginTop:5, textAlign:'center', width:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{app.title}</div>
            </Link>
          );
        })}
        <div style={{ flexShrink:0, width:24 }}/>
      </div>
    </section>
  );
}

/* ── カテゴリナビゲーション ── */
const CATEGORY_NAV = [
  { id:'chat',      href:'/chat',      icon:'💬', color:'#C8A84B', label:'AIチャット',    desc:'話す・相談する・つながる',         count:3, badge:'人気No.1',      names:['声の遺産','このちゃんAI','Untangle'] },
  { id:'diagnosis', href:'/diagnosis', icon:'🔮', color:'#818CF8', label:'AI診断・分析', desc:'本質・才能・行動を数値化する',     count:8, badge:'最多8種類',     names:['運命診断','婚活診断','副業診断','AIタロット','今日の運勢','AI相性診断'] },
  { id:'create',    href:'/create',    icon:'✨', color:'#34D399', label:'AI生成・創作', desc:'文章・画像・音楽・詩・日記をAIで', count:8, badge:'クリエイティブ', names:['夢映像化','言葉モンスター','Melody AI','ビジネス文書','AIポエム','AIメッセージ','AI自己紹介文'] },
  { id:'tools',     href:'/tools',     icon:'🛠️', color:'#38BDF8', label:'ツール・体験', desc:'日常を豊かにする体験型アプリ',    count:6, badge:'無料ツール',     names:['感情図書館','元気玉','大和魂教育','AIレシピ','AI旅行プランナー'] },
  { id:'learn',     href:'/learn',     icon:'📚', color:'#06B6D4', label:'学習・スキル', desc:'AIで英語力・就活力をスキルアップ', count:3, badge:'英語・就活',     names:['AI英会話','英単語クイズ','AI面接練習'] },
  { id:'beauty',    href:'/beauty',    icon:'✨', color:'#C8A96E', label:'美容・成長',   desc:'顔診断・習慣管理・コーチング',   count:3, badge:'セルフアップ',  names:['FACEGLOW','Growth Tracker','AIコーチ'] },
];

function CategoryNav() {
  const [hov, setHov] = useState(null);
  return (
    <section id="apps" style={{ padding:'0 24px 80px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:11, color:C.violet, letterSpacing:'0.15em', fontWeight:700, textTransform:'uppercase', marginBottom:12 }}>✦ カテゴリから探す</div>
          <h2 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:900, color:C.text, letterSpacing:'-0.025em', margin:'0 0 10px' }}>どの体験をしたいですか？</h2>
          <p style={{ color:C.muted, fontSize:14, margin:0 }}>6カテゴリ・全31アプリ · 全部無料 · 登録不要</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16 }}>
          {CATEGORY_NAV.map(cat => (
            <Link key={cat.id} href={cat.href} style={{ textDecoration:'none' }}>
              <div
                onMouseEnter={() => setHov(cat.id)}
                onMouseLeave={() => setHov(null)}
                style={{
                  padding:'24px', borderRadius:20, cursor:'pointer',
                  background: hov===cat.id ? '#0F1330' : '#0C0E22',
                  border:`1px solid ${hov===cat.id ? cat.color+'55' : '#1E2448'}`,
                  transition:'all 0.22s ease',
                  transform: hov===cat.id ? 'translateY(-4px)' : 'none',
                  boxShadow: hov===cat.id ? `0 20px 60px ${cat.color}20` : 'none',
                  position:'relative', overflow:'hidden',
                }}>
                <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:`radial-gradient(circle, ${cat.color}15, transparent 70%)`, pointerEvents:'none' }}/>
                <div style={{ position:'relative' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                    <div style={{ width:50, height:50, borderRadius:14, background:cat.color+'18', border:`1px solid ${cat.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{cat.icon}</div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                        <span style={{ color:C.text, fontSize:16, fontWeight:800 }}>{cat.label}</span>
                        <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:cat.color+'20', color:cat.color, border:`1px solid ${cat.color}35`, fontWeight:700 }}>{cat.badge}</span>
                      </div>
                      <div style={{ color:C.muted, fontSize:11, lineHeight:1.4 }}>{cat.desc}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:16 }}>
                    {cat.names.map((name,i) => (
                      <span key={i} style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background:i===0?cat.color+'22':'#14172A', color:i===0?cat.color:C.muted, border:`1px solid ${i===0?cat.color+'40':'#252848'}`, fontWeight:i===0?700:400 }}>{name}</span>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ color:'#3A4870', fontSize:11 }}>{cat.count}本のアプリ</span>
                    <span style={{ color:cat.color, fontSize:13, fontWeight:700, opacity:hov===cat.id?1:0.3, transform:hov===cat.id?'translateX(0)':'translateX(-6px)', transition:'all 0.2s' }}>見てみる →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── メインコンポーネント ── */
export default function Hub() {
  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <style>{`
        @keyframes floatSlow { 0%,100%{transform:translateY(0)scale(1)} 50%{transform:translateY(-18px)scale(1.04)} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmerVid { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes dotPulse { 0%,80%,100%{transform:scale(0.65);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        .video-strip { scrollbar-width: none; }
        .video-strip::-webkit-scrollbar { display: none; }
        * { box-sizing: border-box; }
        @media (max-width: 600px) {
          .stat-bar { grid-template-columns: repeat(2,1fr) !important; }
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .how-steps { grid-template-columns: 1fr !important; }
          .premium-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position:'relative', overflow:'hidden', padding:'96px 24px 72px', textAlign:'center' }}>
        <div style={{ position:'absolute', top:-120, left:'5%',  width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, #6366F122 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none', animation:'floatSlow 8s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', top: -80, right:'3%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, #A78BFA18 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none', animation:'floatSlow 10s ease-in-out infinite reverse' }}/>
        <div style={{ position:'absolute', bottom:-100, left:'35%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, #38BDF814 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none', animation:'floatSlow 12s ease-in-out infinite' }}/>

        <div style={{ position:'relative', maxWidth:720, margin:'0 auto', animation:'fadeUp 0.7s ease' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 18px', borderRadius:20, background:'#6366F112', border:'1px solid #6366F130', color:'#A78BFA', fontSize:12, fontWeight:600, marginBottom:24, backdropFilter:'blur(8px)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#6EE7B7', display:'inline-block', boxShadow:'0 0 6px #6EE7B7' }}/>
            AIと感情が交差する31本のプロダクト
          </div>

          <h1 style={{ fontSize:'clamp(38px,7vw,70px)', fontWeight:900, lineHeight:1.05, letterSpacing:'-0.035em', margin:'0 0 20px' }}>
            <span style={{ color:C.text }}>感情を入力するだけで</span><br/>
            <span style={{
              background:'linear-gradient(135deg, #C084FC 0%, #818CF8 35%, #38BDF8 70%, #34D399 100%)',
              backgroundSize:'200% 200%',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              animation:'gradShift 5s ease infinite',
            }}>AIが動き出す</span>
          </h1>

          <p style={{ color:C.muted, fontSize:'clamp(14px,2vw,17px)', lineHeight:1.9, margin:'0 0 32px', maxWidth:460, marginLeft:'auto', marginRight:'auto' }}>
            診断・チャット・生成・記録。<br/>
            登録不要で今すぐ全部使える。
          </p>

          <div className="hero-btns" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <a href="#demo" style={{ textDecoration:'none' }}>
              <button
                style={{ padding:'15px 30px', background:'linear-gradient(135deg,#6366F1,#A78BFA)', border:'none', borderRadius:14, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 32px #6366F150', letterSpacing:'-0.01em' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 40px #6366F168';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 8px 32px #6366F150';}}>
                ▶ デモを見る
              </button>
            </a>
            <a href="#apps" style={{ textDecoration:'none' }}>
              <button
                style={{ padding:'15px 30px', background:'transparent', border:'1px solid #252A50', borderRadius:14, color:C.mutedHi, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#404880';e.currentTarget.style.color=C.text;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#252A50';e.currentTarget.style.color=C.mutedHi;}}>
                全アプリを見る
              </button>
            </a>
            <Link href="/koe" style={{ textDecoration:'none' }}>
              <button
                style={{ padding:'15px 30px', background:'#C8A84B18', border:'1px solid #C8A84B40', borderRadius:14, color:'#C8A84B', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                🕯️ 人気No.1を試す
              </button>
            </Link>
          </div>

          {/* 社会的証明 */}
          <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginTop:20 }}>
            <div style={{ display:'flex' }}>
              {['#7C3AED','#059669','#DC2626','#D97706','#0891B2'].map((c,i)=>(
                <div key={i} style={{ width:26, height:26, borderRadius:'50%', background:`linear-gradient(135deg,${c},${c}88)`, border:'2px solid #050812', marginLeft:i>0?-7:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>
                  {['👤','🧑','👩','👦','🧓'][i]}
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>
              <span style={{ fontWeight:700, color:'#fff' }}>毎日</span> 使ってもらっています
            </div>
          </div>
        </div>
      </section>

      {/* ── デモ動画ストリップ ── */}
      <VideoStrip />

      {/* ── 統計バー ── */}
      <section style={{ padding:'0 24px 52px' }}>
        <StatBar/>
      </section>

      {/* ── カテゴリナビ ── */}
      <CategoryNav/>

      {/* ── プレミアムCTA ── */}
      <PremiumCTA/>

      {/* ── フッター ── */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'36px 24px', textAlign:'center' }}>
        <div style={{ marginBottom:12 }}>
          <span style={{ background:'linear-gradient(135deg,#A78BFA,#6366F1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:900, fontSize:20, letterSpacing:'-0.03em' }}>Yudai Apps</span>
        </div>
        <p style={{ color:C.muted, fontSize:12, margin:'0 0 16px', lineHeight:2 }}>
          AIと感情が交差するプロダクト集 · 31アプリ全部無料<br/>
          <span style={{ fontSize:11 }}>Powered by Claude AI · 画像生成 Pollinations.ai · 音楽生成 Suno AI</span>
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {ALL_APPS.map(a=>(
            <Link key={a.id} href={`/${a.id}`} style={{ color:C.muted, fontSize:11, textDecoration:'none', transition:'color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.muted}>{a.title}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
