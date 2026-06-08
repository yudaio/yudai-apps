'use client';
import { useState, useEffect } from 'react';
import { AppHero, HeroBtn } from './shared';

const GRAD = 'linear-gradient(135deg,#1E3A8A,#2563EB,#0EA5E9)';
const C = { card:'#060B18', border:'#0A1A30', text:'#D0E8FF', muted:'#2A4A70' };

const MOCK = [
  { id:1, name:"ダイドー 駅前", dist:null, items:["コーヒー","水","エナジー"], hot:true, cold:true },
  { id:2, name:"コカコーラ 2号館脇", dist:null, items:["コーラ","お茶","スポーツ"], hot:false, cold:true },
  { id:3, name:"アサヒ 歩道橋下", dist:null, items:["カップ麺","スナック","飲料"], hot:true, cold:true },
  { id:4, name:"JR 改札外", dist:null, items:["お茶","コーヒー","ジュース"], hot:true, cold:true },
  { id:5, name:"ファミマ横", dist:null, items:["アイス","飲料","スムージー"], hot:false, cold:true },
];

function calcDist(lat1,lng1,dlat,dlng){const R=6371000;const dLat=dlat*Math.PI/180;const dLng=dlng*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos((lat1+dlat)*Math.PI/180)*Math.sin(dLng/2)**2;return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));}

export default function Vending() {
  const[filter,setFilter]=useState("全て");
  const[location,setLocation]=useState(null);
  const[address,setAddress]=useState('');
  const[gpsLoading,setGpsLoading]=useState(false);
  const[gpsError,setGpsError]=useState('');
  const[machines,setMachines]=useState(MOCK.map((m,i)=>({...m,lat:i*0.0005,lng:i*0.0003})));

  const getGPS=()=>{ if(!navigator.geolocation){setGpsError('GPS非対応');return;} setGpsLoading(true);setGpsError(''); navigator.geolocation.getCurrentPosition(async(pos)=>{ const{latitude:lat,longitude:lng}=pos.coords; setLocation({lat,lng}); try{ const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`); const d=await r.json(); setAddress(d.address?.suburb||d.address?.city||d.display_name?.split(',')[0]||'現在地'); }catch{setAddress('現在地');} setMachines(MOCK.map((m,i)=>({...m,lat:m.lat,lng:m.lng,dist:calcDist(lat,lng,m.lat+i*0.0005,m.lng+i*0.0003)+'m'}))); setGpsLoading(false); },(e)=>{setGpsError('位置情報の取得に失敗しました');setGpsLoading(false);}); };

  const filters=["全て","Hot対応","軽食あり"];
  const filtered=machines.filter(v=>{ if(filter==="Hot対応")return v.hot; if(filter==="軽食あり")return v.items.some(i=>["カップ麺","スナック"].includes(i)); return true; }).sort((a,b)=>{ if(!a.dist||!b.dist)return 0; return parseInt(a.dist)-parseInt(b.dist); });

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:C.text }}>
      <AppHero icon="🎰" title="自販機マップ" sub="現在地周辺の自販機を瞬時に発見" grad={GRAD}
        badge={location?<><span>📍</span><span>{address}</span><span>· {machines.length}件</span></>:null}/>

      {/* GPS取得 */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ flex:1 }}>
            <div style={{ color:C.text, fontSize:14, fontWeight:600, marginBottom:4 }}>
              {location?address:'GPS未取得'}
            </div>
            <div style={{ color:C.muted, fontSize:12 }}>
              {location?`取得済み · ${machines.length}件の自販機`:'GPSを取得して距離順に並び替え'}
            </div>
          </div>
          <button onClick={getGPS} disabled={gpsLoading} style={{ padding:'10px 20px', background:location?'#042010':'#0A1A40', border:`1px solid ${location?'#1A4A20':'#1A3060'}`, borderRadius:10, color:location?'#34D399':'#60A5FA', fontSize:13, cursor:gpsLoading?'default':'pointer', fontFamily:'inherit', fontWeight:600, whiteSpace:'nowrap' }}>{gpsLoading?'取得中...':location?'✓ 取得済み':'📍 GPS取得'}</button>
        </div>
        {gpsError&&<div style={{ color:'#F87171', fontSize:12, marginTop:10 }}>{gpsError}</div>}
      </div>

      {/* フィルター */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {filters.map(f=><button key={f} onClick={()=>setFilter(f)} style={{ padding:'8px 18px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:13, border:`1px solid ${filter===f?'#2563EB':'#0A1A30'}`, background:filter===f?GRAD:'transparent', color:filter===f?'#fff':'#3A6890', fontWeight:filter===f?600:400, transition:'all 0.15s' }}>{f}</button>)}
      </div>

      {/* 自販機リスト */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map((v,idx)=>(
          <div key={v.id} style={{ padding:'16px 18px', background:C.card, border:`1px solid ${C.border}`, borderRadius:14, transition:'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.borderColor='#1A3060'} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,#1A3060,#2563EB)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎰</div>
                <div>
                  <div style={{ color:C.text, fontSize:14, fontWeight:600 }}>{v.name}</div>
                  {idx===0&&location&&<div style={{ color:'#34D399', fontSize:11, marginTop:2 }}>📍 最寄り</div>}
                </div>
              </div>
              <div style={{ color:'#60A5FA', fontSize:15, fontWeight:800 }}>{v.dist||'---'}</div>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {v.items.map(i=><span key={i} style={{ padding:'4px 10px', background:'#080E20', borderRadius:12, color:'#3A6890', fontSize:11, border:`1px solid ${C.border}` }}>{i}</span>)}
              {v.hot&&<span style={{ padding:'4px 10px', background:'#2A0A00', borderRadius:12, color:'#FB923C', fontSize:11, border:'1px solid #3A1A00', fontWeight:600 }}>🔥 Hot</span>}
              {v.cold&&<span style={{ padding:'4px 10px', background:'#001A2A', borderRadius:12, color:'#38BDF8', fontSize:11, border:'1px solid #002A40', fontWeight:600 }}>❄️ Cold</span>}
            </div>
          </div>
        ))}
      </div>

      {!location&&<p style={{ color:C.muted, fontSize:12, textAlign:'center', marginTop:16 }}>※ GPSを取得すると距離順に並び替えられます</p>}
    </div>
  );
}
