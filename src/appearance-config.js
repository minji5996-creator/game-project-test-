export const hairColors=[
 {id:'black',name:'흑단 블랙',hex:'#292735'},
 {id:'brown',name:'초콜릿 브라운',hex:'#805337'},
 {id:'blonde',name:'허니 블론드',hex:'#d8b66a'},
 {id:'silver',name:'문라이트 실버',hex:'#aebbc9'},
 {id:'white',name:'스노 화이트',hex:'#f4e8d8'},
 {id:'red',name:'루비 레드',hex:'#bc474d'},
 {id:'orange',name:'코퍼 오렌지',hex:'#d38a44'},
 {id:'pink',name:'로즈 핑크',hex:'#d79cb0'},
 {id:'purple',name:'라일락 퍼플',hex:'#9977b7'},
 {id:'blue',name:'미드나이트 블루',hex:'#5e8fc2'}
];
export const outfitColors=[{id:'green',name:'숲의 초록',hex:'#708650'},{id:'black',name:'밤의 검정',hex:'#343540'},{id:'purple',name:'별의 보라',hex:'#88619c'},{id:'red',name:'불꽃 빨강',hex:'#b84b46'},{id:'yellow',name:'햇살 노랑',hex:'#d6b34d'}];
export const skinColors=[
 {id:'natural',name:'기본 로즈',hex:'#f2bcb7',source:'original'},
 {id:'cream',name:'살구 크림',hex:'#ffeedd',source:'reference'},
 {id:'tan',name:'허니 탄',hex:'#bb9966',source:'reference'},
 {id:'bronze',name:'딥 브론즈',hex:'#886633',source:'reference'},
 {id:'ivory',name:'웜 아이보리',hex:'#ffffee',source:'reference'},
 {id:'lilac',name:'라벤더 그레이',hex:'#ddddee',source:'reference'},
 {id:'porcelain',name:'포슬린 그레이',hex:'#eeeeee',source:'reference'},
 {id:'beige',name:'샌드 베이지',hex:'#ddccaa',source:'reference'},
 {id:'rose',name:'소프트 로즈',hex:'#ffdddd',source:'reference'},
 {id:'slate',name:'블루 그레이',hex:'#bbbbcc',source:'reference'},
 {id:'milk',name:'밀크 화이트',hex:'#ffeeee',source:'reference'},
 {id:'pink',name:'페어리 핑크',hex:'#ffddee',source:'reference'}
];
export const defaultAppearance={gender:'female',hair:'black',outfit:'green',skin:'natural'};
export function normalizeAppearance(value){const v=value&&typeof value==='object'?value:{};return {gender:v.gender==='male'?'male':'female',hair:hairColors.some(c=>c.id===v.hair)?v.hair:'black',outfit:outfitColors.some(c=>c.id===v.outfit)?v.outfit:'green',skin:skinColors.some(c=>c.id===v.skin)?v.skin:'natural'};}
