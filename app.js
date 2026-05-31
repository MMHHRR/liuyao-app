// ============================================================
//  六爻算卦 - 核心逻辑
// ============================================================

// ── 八卦数据 ──
const TRIGRAMS = {
  "乾": { symbol: "☰", nature: "天", attribute: "健", family: "父", lines: [1,1,1] },
  "兑": { symbol: "☱", nature: "泽", attribute: "悦", family: "少女", lines: [0,1,1] },
  "离": { symbol: "☲", nature: "火", attribute: "丽", family: "中女", lines: [1,0,1] },
  "震": { symbol: "☳", nature: "雷", attribute: "动", family: "长男", lines: [0,0,1] },
  "巽": { symbol: "☴", nature: "风", attribute: "入", family: "长女", lines: [1,1,0] },
  "坎": { symbol: "☵", nature: "水", attribute: "陷", family: "中男", lines: [0,1,0] },
  "艮": { symbol: "☶", nature: "山", attribute: "止", family: "少男", lines: [1,0,0] },
  "坤": { symbol: "☷", nature: "地", attribute: "顺", family: "母", lines: [0,0,0] },
};
const TRIGRAM_ORDER = ["乾","兑","离","震","巽","坎","艮","坤"];

function trigramFromLines(a,b,c) {
  for (const [name, info] of Object.entries(TRIGRAMS)) {
    if (info.lines[0]===a && info.lines[1]===b && info.lines[2]===c) return name;
  }
  return "?";
}

// ── 六十四卦数据 ──
const HEXAGRAM_DATA = {
  "乾_乾": { name:"乾", keyword:"乾为天", tuan:"元亨利贞", judgment:"天行健，君子以自强不息。", description:"纯阳之象，象征天、创造力、刚健不息。运势极强，宜积极进取。" },
  "坤_坤": { name:"坤", keyword:"坤为地", tuan:"元亨，利牝马之贞", judgment:"地势坤，君子以厚德载物。", description:"纯阴之象，象征地、包容、柔顺。宜厚德载物，以柔克刚。" },
  "坎_震": { name:"屯", keyword:"水雷屯", tuan:"元亨利贞，勿用有攸往", judgment:"云雷屯，君子以经纶。", description:"创始之艰。万事开头难，宜守正耐心，待时而动。" },
  "艮_坎": { name:"蒙", keyword:"山水蒙", tuan:"亨。匪我求童蒙，童蒙求我", judgment:"山下出泉，蒙；君子以果行育德。", description:"蒙昧初开，宜虚心求教。如幼童启蒙，需师友引导。" },
  "坎_乾": { name:"需", keyword:"水天需", tuan:"有孚，光亨，贞吉", judgment:"云上于天，需；君子以饮食宴乐。", description:"等待之象。时机未到，宜耐心等待，养精蓄锐。" },
  "乾_坎": { name:"讼", keyword:"天水讼", tuan:"有孚窒惕，中吉", judgment:"天与水违行，讼；君子以作事谋始。", description:"争讼之象。宜和解为上，不宜争强好胜。" },
  "坤_坎": { name:"师", keyword:"地水师", tuan:"贞丈人吉，无咎", judgment:"地中有水，师；君子以容民畜众。", description:"统率之象。行师之道，宜德才兼备之将领统率。" },
  "坎_坤": { name:"比", keyword:"水地比", tuan:"吉。原筮元永贞，无咎", judgment:"地上有水，比；先王以建万国，亲诸侯。", description:"亲比之象。相亲相辅，团结互助为吉。" },
  "巽_乾": { name:"小畜", keyword:"风天小畜", tuan:"亨。密云不雨", judgment:"风行天上，小畜；君子以懿文德。", description:"小有积蓄。力量尚不充足，宜积蓄修养。" },
  "乾_兑": { name:"履", keyword:"天泽履", tuan:"履虎尾，不咥人，亨", judgment:"上天下泽，履；君子以辨上下，定民志。", description:"履行之象。如履虎尾而未被咬，险中求吉，宜谨慎行事。" },
  "坤_乾": { name:"泰", keyword:"地天泰", tuan:"小往大来，吉亨", judgment:"天地交，泰；后以财成天地之道，辅相天地之宜。", description:"通泰之象。天地交融，万物通达，万事吉祥。" },
  "乾_坤": { name:"否", keyword:"天地否", tuan:"否之匪人，不利君子贞", judgment:"天地不交，否；君子以俭德辟难，不可荣以禄。", description:"闭塞之象。天地不交，宜隐忍退守，不可妄动。" },
  "乾_离": { name:"同人", keyword:"天火同人", tuan:"同人于野，亨", judgment:"天与火，同人；君子以类族辨物。", description:"大同之象。与人同心，团结合作，亨通顺利。" },
  "离_乾": { name:"大有", keyword:"火天大有", tuan:"元亨", judgment:"火在天上，大有；君子以遏恶扬善，顺天休命。", description:"大有收获。丰盛富足，宜顺天应人，积善行德。" },
  "坤_艮": { name:"谦", keyword:"地山谦", tuan:"亨，君子有终", judgment:"地中有山，谦；君子以裒多益寡，称物平施。", description:"谦虚之象。满招损，谦受益，谦虚必然亨通。" },
  "震_坤": { name:"豫", keyword:"雷地豫", tuan:"利建侯行师", judgment:"雷出地奋，豫；先王以作乐崇德。", description:"愉悦之象。安乐和悦，宜顺势而为，建功立业。" },
  "兑_震": { name:"随", keyword:"泽雷随", tuan:"元亨利贞，无咎", judgment:"泽中有雷，随；君子以向晦入宴息。", description:"随从之象。随时而动，顺应自然，无往不利。" },
  "艮_巽": { name:"蛊", keyword:"山风蛊", tuan:"元亨，利涉大川", judgment:"山下有风，蛊；君子以振民育德。", description:"整顿之象。积弊待除，宜革新整治，拨乱反正。" },
  "坤_兑": { name:"临", keyword:"地泽临", tuan:"元亨利贞", judgment:"泽上有地，临；君子以教思无穷，容保民无疆。", description:"临近之象。居高临下，以柔治下，教化万民。" },
  "巽_坤": { name:"观", keyword:"风地观", tuan:"盥而不荐，有孚颙若", judgment:"风行地上，观；先王以省方观民设教。", description:"观察之象。以德服人，以诚感化，宜反躬自省。" },
  "离_震": { name:"噬嗑", keyword:"火雷噬嗑", tuan:"亨，利用狱", judgment:"雷电噬嗑；先王以明罚敕法。", description:"咬合之象。有障碍阻隔，宜果断清除，明断是非。" },
  "艮_离": { name:"贲", keyword:"山火贲", tuan:"亨，小利有攸往", judgment:"山下有火，贲；君子以明庶政，无敢折狱。", description:"文饰之象。文质彬彬，修饰美化，但不可过分浮华。" },
  "艮_坤": { name:"剥", keyword:"山地剥", tuan:"不利有攸往", judgment:"山附于地，剥；上以厚下安宅。", description:"剥落之象。阴盛阳衰，宜守不宜攻，等待转机。" },
  "坤_震": { name:"复", keyword:"地雷复", tuan:"亨。出入无疾", judgment:"雷在地中，复；先王以至日闭关，商旅不行。", description:"回复之象。一阳来复，生机萌发，宜休养生息。" },
  "乾_震": { name:"无妄", keyword:"天雷无妄", tuan:"元亨利贞", judgment:"天下雷行，物与无妄；先王以茂对时育万物。", description:"无妄之象。顺其自然，不妄为则吉，妄动则有灾。" },
  "艮_乾": { name:"大畜", keyword:"山天大畜", tuan:"利贞，不家食吉", judgment:"天在山中，大畜；君子以多识前言往行，以畜其德。", description:"大蓄之象。积蓄力量，厚积薄发，宜增长学识。" },
  "艮_震": { name:"颐", keyword:"山雷颐", tuan:"贞吉。观颐，自求口实", judgment:"山下有雷，颐；君子以慎言语，节饮食。", description:"颐养之象。养生之道，言语谨慎，饮食有节。" },
  "巽_兑": { name:"中孚", keyword:"风泽中孚", tuan:"豚鱼吉，利涉大川", judgment:"泽上有风，中孚；君子以议狱缓死。", description:"诚信之象。中正诚信，感化万物。" },
  "兑_巽": { name:"大过", keyword:"泽风大过", tuan:"栋桡，利有攸往，亨", judgment:"泽灭木，大过；君子以独立不惧，遁世无闷。", description:"大为过甚。非常时期，宜行非常之事，独立不惧。" },
  "坎_坎": { name:"坎", keyword:"坎为水", tuan:"有孚维心，亨", judgment:"水洊至，习坎；君子以常德行，习教事。", description:"险陷之象。重重险难，宜保持诚信，谨慎前行。" },
  "离_离": { name:"离", keyword:"离为火", tuan:"利贞，亨", judgment:"明两作，离；大人以继明照于四方。", description:"附丽之象。光明连续，宜附丽正道，文明照世。" },
  "兑_艮": { name:"咸", keyword:"泽山咸", tuan:"亨，利贞", judgment:"山上有泽，咸；君子以虚受人。", description:"感应之象。男女感应，情感交流，以虚心接纳。" },
  "震_巽": { name:"恒", keyword:"雷风恒", tuan:"亨，无咎，利贞", judgment:"雷风，恒；君子以立不易方。", description:"恒久之象。持之以恒，守正不移。" },
  "乾_艮": { name:"遁", keyword:"天山遁", tuan:"亨，小利贞", judgment:"天下有山，遁；君子以远小人，不恶而严。", description:"退避之象。急流勇退，以退为进。" },
  "震_乾": { name:"大壮", keyword:"雷天大壮", tuan:"利贞", judgment:"雷在天上，大壮；君子以非礼勿履。", description:"盛大之象。气势壮盛，但不可恃强妄为。" },
  "离_坤": { name:"晋", keyword:"火地晋", tuan:"康侯用锡马蕃庶", judgment:"明出地上，晋；君子以自昭明德。", description:"前进之象。光明上升，宜积极进取，展现才华。" },
  "巽_离": { name:"家人", keyword:"风火家人", tuan:"利女贞", judgment:"风自火出，家人；君子以言有物而行有恒。", description:"家庭之象。各安其位，家道正而天下安。" },
  "离_兑": { name:"睽", keyword:"火泽睽", tuan:"小事吉", judgment:"上火下泽，睽；君子以同而异。", description:"乖离之象。意见不合，宜求同存异，从小处着手。" },
  "坎_艮": { name:"蹇", keyword:"水山蹇", tuan:"利西南，不利东北", judgment:"山上有水，蹇；君子以反身修德。", description:"艰难之象。前路险阻，宜反躬自省，修身养德。" },
  "震_坎": { name:"解", keyword:"雷水解", tuan:"利西南", judgment:"雷雨作，解；君子以赦过宥罪。", description:"解除之象。困难消散，宜宽恕待人，休养生息。" },
  "艮_兑": { name:"损", keyword:"山泽损", tuan:"有孚，元吉", judgment:"山下有泽，损；君子以惩忿窒欲。", description:"减损之象。损己利人，宜克制私欲，自我约束。" },
  "巽_震": { name:"益", keyword:"风雷益", tuan:"利有攸往，利涉大川", judgment:"风雷，益；君子以见善则迁，有过则改。", description:"增益之象。损上益下，宜见善则迁，有过则改。" },
  "兑_乾": { name:"夬", keyword:"泽天夬", tuan:"扬于王庭", judgment:"泽上于天，夬；君子以施禄及下，居德则忌。", description:"决断之象。果断裁决，扬善除恶。" },
  "乾_巽": { name:"姤", keyword:"天风姤", tuan:"女壮，勿用取女", judgment:"天下有风，姤；后以施命诰四方。", description:"相遇之象。不期而遇，宜审慎行事。" },
  "兑_坤": { name:"萃", keyword:"泽地萃", tuan:"亨，王假有庙", judgment:"泽上于地，萃；君子以除戎器，戒不虞。", description:"聚集之象。精英荟萃，宜聚众修德，戒备不虞。" },
  "坤_巽": { name:"升", keyword:"地风升", tuan:"元亨，用见大人", judgment:"地中生木，升；君子以顺德，积小以高大。", description:"上升之象。循序渐进，积小成大，步步高升。" },
  "兑_坎": { name:"困", keyword:"泽水困", tuan:"亨，贞大人吉", judgment:"泽无水，困；君子以致命遂志。", description:"困厄之象。穷困之境，宜守正持志，不坠其志。" },
  "坎_巽": { name:"井", keyword:"水风井", tuan:"改邑不改井，无丧无得", judgment:"木上有水，井；君子以劳民劝相。", description:"井养之象。固定不变，宜滋养他人，持之以恒。" },
  "兑_离": { name:"革", keyword:"泽火革", tuan:"巳日乃孚，元亨利贞", judgment:"泽中有火，革；君子以治历明时。", description:"变革之象。除旧布新，顺天应人。" },
  "离_巽": { name:"鼎", keyword:"火风鼎", tuan:"元吉，亨", judgment:"木上有火，鼎；君子以正位凝命。", description:"鼎新之象。革故鼎新，建立新秩序。" },
  "震_震": { name:"震", keyword:"震为雷", tuan:"亨。震来虩虩", judgment:"洊雷，震；君子以恐惧修省。", description:"震动之象。雷震百里，宜戒惧反省，临危不乱。" },
  "艮_艮": { name:"艮", keyword:"艮为山", tuan:"艮其背，不获其身", judgment:"兼山，艮；君子以思不出其位。", description:"静止之象。当止则止，宜知止知足。" },
  "巽_艮": { name:"渐", keyword:"风山渐", tuan:"女归吉，利贞", judgment:"山上有木，渐；君子以居贤德善俗。", description:"渐进之象。循序渐进，不可急躁。" },
  "震_兑": { name:"归妹", keyword:"雷泽归妹", tuan:"征凶，无攸利", judgment:"泽上有雷，归妹；君子以永终知敝。", description:"归嫁之象。婚姻之事，宜从正道，否则有凶。" },
  "坤_离": { name:"明夷", keyword:"地火明夷", tuan:"利艰贞", judgment:"明入地中，明夷；君子以莅众，用晦而明。", description:"晦暗之象。光明被伤，宜隐忍守正，等待时机。" },
  "震_离": { name:"丰", keyword:"雷火丰", tuan:"亨，王假之", judgment:"雷电皆至，丰；君子以折狱致刑。", description:"丰盛之象。日中则昃，盛极当防衰。" },
  "离_艮": { name:"旅", keyword:"火山旅", tuan:"小亨，旅贞吉", judgment:"山上有火，旅；君子以明慎用刑而不留狱。", description:"旅行之象。漂泊不定，宜谨慎行事，不可张扬。" },
  "巽_巽": { name:"巽", keyword:"巽为风", tuan:"小亨，利有攸往", judgment:"随风，巽；君子以申命行事。", description:"顺入之象。风行天下，宜顺势而行，贯彻政令。" },
  "兑_兑": { name:"兑", keyword:"兑为泽", tuan:"亨，利贞", judgment:"丽泽，兑；君子以朋友讲习。", description:"喜悦之象。两泽相连，宜与朋友讲习切磋。" },
  "巽_坎": { name:"涣", keyword:"风水涣", tuan:"亨，王假有庙", judgment:"风行水上，涣；先王以享于帝立庙。", description:"涣散之象。散则聚之，宜凝聚人心。" },
  "坎_兑": { name:"节", keyword:"水泽节", tuan:"亨，苦节不可贞", judgment:"泽上有水，节；君子以制数度，议德行。", description:"节制之象。适度节制，过苦则不可坚守。" },
  "震_艮": { name:"小过", keyword:"雷山小过", tuan:"亨，利贞", judgment:"山上有雷，小过；君子以行过乎恭，丧过乎哀。", description:"小有过失。小事可过，大事不可过。" },
  "坎_离": { name:"既济", keyword:"水火既济", tuan:"亨小，利贞", judgment:"水在火上，既济；君子以思患而预防之。", description:"既成之象。事已成功，宜居安思危，防患未然。" },
  "离_坎": { name:"未济", keyword:"火水未济", tuan:"亨，小狐汔济", judgment:"火在水上，未济；君子以慎辨物居方。", description:"未成之象。事未竟成，宜谨慎从事，继续努力。" },
};

function getHexagram(upper, lower) {
  return HEXAGRAM_DATA[upper + "_" + lower] || null;
}

// ============================================================
//  核心逻辑
// ============================================================

const POS_NAMES = { 0: "初", 1: "二", 2: "三", 3: "四", 4: "五", 5: "上" };
const LINE_YANG = "———";
const LINE_YIN = "— —";
const LINE_OLD_YANG = "———";
const LINE_OLD_YIN = "— —";

function renderYaoLine(value, changing) {
  let html = '';
  if (value === 1) {
    html = `<div class="visual-yao"><div class="yao-bar yao-solid"></div>`;
  } else {
    html = `<div class="visual-yao"><div class="yao-bar yao-broken"><span></span><span></span></div>`;
  }
  if (changing) {
    if (value === 1) {
      html += `<span class="yao-mark"><svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="none" stroke="#f78166" stroke-width="2"/></svg></span>`;
    } else {
      html += `<span class="yao-mark"><svg viewBox="0 0 14 14"><line x1="2" y1="2" x2="12" y2="12" stroke="#f78166" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="#f78166" stroke-width="2.5" stroke-linecap="round"/></svg></span>`;
    }
  }
  html += `</div>`;
  return html;
}

function tossCoins() {
  const coins = [Math.random()<0.5?1:0, Math.random()<0.5?1:0, Math.random()<0.5?1:0];
  const heads = coins.reduce((a,b)=>a+b, 0);
  if (heads === 3) return { value:1, changing:true, coin:"三背（老阳）⚡" };
  if (heads === 2) return { value:0, changing:false, coin:"二背一字（少阴）" };
  if (heads === 1) return { value:1, changing:false, coin:"一背二字（少阳）" };
  return { value:0, changing:true, coin:"三字（老阴）⚡" };
}

function cast() {
  const yaos = [];
  const changingLines = [];
  for (let i = 0; i < 6; i++) {
    const y = tossCoins();
    yaos.push(y);
    if (y.changing) changingLines.push(i);
  }

  const lowerTri = trigramFromLines(yaos[0].value, yaos[1].value, yaos[2].value);
  const upperTri = trigramFromLines(yaos[3].value, yaos[4].value, yaos[5].value);
  const hexInfo = getHexagram(upperTri, lowerTri) || { name:"?", keyword:"", tuan:"", judgment:"", description:"" };

  let changedUpper = null, changedLower = null, changedInfo = null;
  if (changingLines.length > 0) {
    const newLower = [
      yaos[0].changing ? 1-yaos[0].value : yaos[0].value,
      yaos[1].changing ? 1-yaos[1].value : yaos[1].value,
      yaos[2].changing ? 1-yaos[2].value : yaos[2].value,
    ];
    const newUpper = [
      yaos[3].changing ? 1-yaos[3].value : yaos[3].value,
      yaos[4].changing ? 1-yaos[4].value : yaos[4].value,
      yaos[5].changing ? 1-yaos[5].value : yaos[5].value,
    ];
    changedLower = trigramFromLines(newLower[0], newLower[1], newLower[2]);
    changedUpper = trigramFromLines(newUpper[0], newUpper[1], newUpper[2]);
    changedInfo = getHexagram(changedUpper, changedLower);
  }

  return { yaos, changingLines, upper:upperTri, lower:lowerTri, hexInfo,
           changedUpper, changedLower, changedInfo };
}

// ============================================================
//  UI 渲染
// ============================================================

let castCount = 0;

function renderResult(result, fromHistory) {
  const area = document.getElementById("resultArea");
  const hasChange = result.changingLines.length > 0;

  let yaoArt = "";
  for (let i = 5; i >= 0; i--) {
    const y = result.yaos[i];
    const cls = y.changing ? 'yao-row yao-changing' : 'yao-row';
    const lineHtml = renderYaoLine(y.value, y.changing);
    const changeLabel = y.changing ? '<span class="yao-change-label">变</span>' : '';
    yaoArt += `<div class="${cls}">${lineHtml}<span class="yao-pos">${POS_NAMES[i]}</span>${changeLabel}</div>`;
  }

  let changedYaoArt = "";
  if (hasChange) {
    for (let i = 5; i >= 0; i--) {
      const y = result.yaos[i];
      const v = y.changing ? 1-y.value : y.value;
      const lineHtml = renderYaoLine(v, false);
      changedYaoArt += `<div class="yao-row">${lineHtml}<span class="yao-pos">${POS_NAMES[i]}</span></div>`;
    }
  }

  let html = `<div class="result-card" id="resultCard">`;

  // --- Build hexagram column helper ---
  function hexagramColumn(badge, title, subtitle, yaoArt, info, animate, single) {
    return `
    <div class="hexagram-column${animate ? ' hexagram-column--enter' : ''}${single ? ' hexagram-column--single' : ''}">
      <div class="hexagram-header">
        <span class="hexagram-badge ${badge}">${title}</span>
        <span class="hexagram-title">${info.keyword}</span>
        <span class="hexagram-subtitle">${subtitle}</span>
      </div>
      <div class="hexagram-art">${yaoArt}</div>
      <div class="hexagram-info">
        <div class="info-block">
          <div class="info-label">卦辞</div>
          <div class="info-content tuan">${info.tuan}</div>
        </div>
        <div class="info-block">
          <div class="info-label">象曰</div>
          <div class="info-content judgment">${info.judgment}</div>
        </div>
        <div class="info-block">
          <div class="info-label">解读</div>
          <div class="info-content desc">${info.description}</div>
        </div>
      </div>
    </div>`;
  }

  const primarySubtitle = `上 ${result.upper}（${TRIGRAMS[result.upper].symbol}）· 下 ${result.lower}（${TRIGRAMS[result.lower].symbol}）`;

  if (hasChange) {
    const changedSubtitle = `上 ${result.changedUpper}（${TRIGRAMS[result.changedUpper].symbol}）· 下 ${result.changedLower}（${TRIGRAMS[result.changedLower].symbol}）`;
    html += `<div class="hexagram-columns">`;
    html += hexagramColumn('badge-primary', '本卦', primarySubtitle, yaoArt, result.hexInfo, false);
    html += hexagramColumn('badge-secondary', '变卦', changedSubtitle, changedYaoArt, result.changedInfo, true);
    html += `</div>`;
    const changingPosStr = result.changingLines.map(i => POS_NAMES[i]+"爻").join("、");
    html += `<div class="changing-arrow">变爻：${changingPosStr}</div>`;
  } else {
    html += `<div class="hexagram-columns">`;
    html += hexagramColumn('badge-primary', '本卦', primarySubtitle, yaoArt, result.hexInfo, false, true);
    html += `</div>`;
    html += `<div class="static-card">本卦无变爻，以卦辞为断。静卦主事态平稳，宜静不宜动。</div>`;
  }

  // --- LLM Section ---
  const enableLLM = document.getElementById("enableLLM").value === "1";
  if (enableLLM) {
    if (fromHistory) {
      html += `
    <div class="llm-section">
      <div class="llm-header">
        <h3>LLM 智能解读</h3>
      </div>
      ${result._llmContent
        ? `<div class="llm-content active" id="llmContent"><div id="llmText">${renderMarkdown(result._llmContent)}</div></div>
           <div class="llm-chat" id="llmChat">
             <div class="llm-chat-input-row">
               <input type="text" class="llm-chat-input" id="llmChatInput" placeholder="追问解读…" maxlength="500" onkeydown="if(event.key==='Enter')sendFollowUp()">
               <button class="llm-chat-btn" id="llmChatBtn" onclick="sendFollowUp()">发送</button>
             </div>
           </div>`
        : `<div style="padding:12px 16px;background:rgba(0,0,0,0.2);border-radius:6px;border-left:2px solid #30363d;font-size:0.85rem;color:#8b949e;">
        此为历史记录。<br>
        如需 LLM 智能解读，请重新<a href="#" onclick="recastFromHistory();return false;" style="color:#f78166;text-decoration:underline;">摇卦</a>或关闭 LLM 后仅查看传统卦辞。
      </div>`}
      <div class="llm-error" id="llmError"></div>
    </div>`;
    } else {
      html += `
    <div class="llm-section">
      <div class="llm-header">
        <h3>LLM 智能解读</h3>
        <div class="llm-loading active" id="llmLoading">
          <div class="llm-spinner"></div>  正在请大模型解卦...
        </div>
      </div>
      <div class="llm-content" id="llmContent">
        <div id="llmText"></div>
      </div>
      <div class="llm-error" id="llmError"></div>
      <div class="llm-chat" id="llmChat">
        <div class="llm-chat-input-row">
          <input type="text" class="llm-chat-input" id="llmChatInput" placeholder="追问解读…" maxlength="500" onkeydown="if(event.key==='Enter')sendFollowUp()" disabled>
          <button class="llm-chat-btn" id="llmChatBtn" onclick="sendFollowUp()" disabled>发送</button>
        </div>
      </div>
    </div>`;
    }
  }

  html += `</div>`; // end result-card
  area.innerHTML = html;

  // Trigger animations
  requestAnimationFrame(() => {
    const card = document.getElementById("resultCard");
    if (card) card.classList.add("visible");
    // Animate changing yao bars then reveal 变卦
    const changingRows = card?.querySelectorAll('.hexagram-column:first-child .yao-changing');
    if (changingRows?.length) {
      changingRows.forEach((row, i) => {
        row.style.animationDelay = (i * 200) + 'ms';
      });
    }
    const rightCol = card?.querySelector('.hexagram-column--enter');
    if (rightCol) {
      const totalDelay = 400 + (changingRows?.length || 0) * 200 + 1000;
      setTimeout(() => rightCol.classList.add('hexagram-column--show'), totalDelay);
    }
  });

  // Call LLM if enabled (only for new casts)
  if (enableLLM && !fromHistory) {
    callLLM(result);
  }
}

// ============================================================
//  LLM 调用
// ============================================================

function buildPromptText(result) {
  const yaoStrs = [];
  for (let i = 0; i < 6; i++) {
    const y = result.yaos[i];
    const yn = y.value===1 ? "阳" : "阴";
    const ch = y.changing ? "（变爻）" : "";
    yaoStrs.push(`  ${POS_NAMES[i]}爻: ${yn} ${y.coin}${ch}`);
  }

  let text = `
【起卦结果 - 金钱卦】

━━━ 本卦: ${result.hexInfo.keyword}（${result.upper}上${result.lower}下）━━━
卦辞: ${result.hexInfo.tuan}
《象》曰: ${result.hexInfo.judgment}
解读: ${result.hexInfo.description}

━━━ 六爻 ━━━
${yaoStrs.join("\n")}
`;
  if (result.changingLines.length > 0) {
    text += `
━━━ 变卦: ${result.changedInfo.keyword}（${result.changedUpper}上${result.changedLower}下）━━━
卦辞: ${result.changedInfo.tuan}
《象》曰: ${result.changedInfo.judgment}
解读: ${result.changedInfo.description}
`;
  }
  return text;
}

async function callLLM(result) {
  // 保存以便重试
  window._lastLLMResult = result;

  const guaText = buildPromptText(result);

  const systemPrompt = `你是一位精通《周易》的易学大师，同时也是一位善于用现代语言解读卦象的人生导师。

请根据用户起得的卦象，给出有深度、有温度、实用的解读。

原则：
1. 引用卦辞和爻辞进行解释
2. 如有变爻，重点分析变爻含义及本卦到变卦的转化趋势
3. 三段式：🎯核心卦意 → 🔍详细解读 → 💫行动建议
4. 既有古风哲理，又有现代温度
5. 从事业、感情、健康、财运等维度给出综合参考

请用中文回答，控制在500字以内。`;

  const userPrompt = `以下是我刚刚起得的卦象信息，请为我详细解读：

${guaText}

请从事业、感情、健康、财运等角度（如适用）给出综合解读和行动建议。`;

  const llmContent = document.getElementById("llmContent");
  const llmText = document.getElementById("llmText");
  const loading = document.getElementById("llmLoading");

  try {
    const resp = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        stream: true,
      }),
    });

    if (!resp.ok) {
      if (loading) loading.classList.remove("active");
      const errText = await resp.text();
      showLLMError(`API 调用失败 (HTTP ${resp.status})：${errText.slice(0,200)}`);
      return;
    }

    // Show content area immediately, keep loading spinner
    if (llmContent) llmContent.classList.add("active");
    llmText.textContent = '';
    let fullText = '';
    let buffer = '';

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            llmText.textContent = fullText;
          }
        } catch (_) {}
      }
    }

    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6).trim();
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            llmText.textContent = fullText;
          }
        } catch (_) {}
      }
    }

    // Final render with full markdown formatting
    llmText.innerHTML = renderMarkdown(fullText);

    // Store conversation context for follow-up chat
    window._llmMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
      { role: "assistant", content: fullText }
    ];
    // Save LLM result to current history entry
    const currentResult = history[activeHistoryIndex];
    if (currentResult) {
      currentResult._llmContent = fullText;
      currentResult._llmMessages = window._llmMessages;
      saveHistory();
      // 同步到 Supabase
      if (typeof sbUpdateLLM !== 'undefined' && currentResult._sbId) {
        sbUpdateLLM(currentResult._sbId, fullText, window._llmMessages);
      }
    }
    if (loading) loading.classList.remove("active");

    // Enable chat input
    const chatInput = document.getElementById("llmChatInput");
    const chatBtn = document.getElementById("llmChatBtn");
    if (chatInput) chatInput.disabled = false;
    if (chatBtn) chatBtn.disabled = false;
  } catch (e) {
    if (loading) loading.classList.remove("active");
    if (llmContent) llmContent.classList.add("active");
    llmText.innerHTML = `<p style="color:#8b949e;">连接失败：${e.message}，<a class="retry-link" href="#" onclick="retryLLM();return false">点击重试</a></p>`;
  }
}

async function sendFollowUp() {
  const input = document.getElementById("llmChatInput");
  const btn = document.getElementById("llmChatBtn");
  const chat = document.getElementById("llmChat");
  const question = input.value.trim();
  if (!question || btn.disabled) return;

  input.value = '';
  input.disabled = true;
  btn.disabled = true;

  // Add user message
  const userMsg = document.createElement("div");
  userMsg.className = "llm-chat-msg user";
  userMsg.textContent = question;
  chat.insertBefore(userMsg, chat.lastElementChild);

  // Typing indicator
  const typing = document.createElement("div");
  typing.className = "llm-chat-msg typing";
  typing.textContent = "大模型思考中…";
  chat.insertBefore(typing, chat.lastElementChild);

  const messages = (window._llmMessages || []).concat({ role: "user", content: question });

  // 保存以备重试
  window._pendingRetry = { question, messages, userMsg, typing };

  try {
    const resp = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "deepseek-chat", messages, temperature: 0.7, max_tokens: 1000, stream: true }),
    });

    if (!resp.ok) {
      showInlineRetry(typing, '请求失败', question, messages);
      btn.disabled = false;
      input.disabled = false;
      return;
    }

    typing.textContent = '';
    typing.className = "llm-chat-msg assistant";
    let answer = '';

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            answer += delta;
            typing.innerHTML = renderMarkdown(answer);
          }
        } catch (_) {}
      }
    }
    typing.innerHTML = renderMarkdown(answer);
    window._llmMessages = messages.concat({ role: "assistant", content: answer });
    // 保存追问到历史
    const cur = history[activeHistoryIndex];
    if (cur) { cur._llmMessages = window._llmMessages; saveHistory();
      if (typeof sbUpdateLLM !== 'undefined' && cur._sbId)
        sbUpdateLLM(cur._sbId, cur._llmContent, window._llmMessages);
    }
  } catch (e) {
    showInlineRetry(typing, '连接失败：' + e.message, question, messages);
  }

  btn.disabled = false;
  input.disabled = false;
  input.focus();
}

function showInlineRetry(typingEl, label, question, messages) {
  typingEl.innerHTML = `${label}，<a class="retry-link" href="#" data-question="${question.replace(/"/g,'&quot;')}">点击重试</a>`;
  const link = typingEl.querySelector('.retry-link');
  if (link) {
    link.onclick = async (e) => {
      e.preventDefault();
      link.textContent = '重试中…';
      link.style.pointerEvents = 'none';
      const userMsg = typingEl.previousElementSibling;
      if (userMsg && userMsg.classList.contains("user")) userMsg.remove();
      typingEl.remove();
      const input = document.getElementById("llmChatInput");
      const btn = document.getElementById("llmChatBtn");
      if (input && btn) {
        input.value = question;
        input.disabled = false;
        btn.disabled = false;
        sendFollowUp();
      }
    };
  }
}

function showLLMError(msg) {
  const err = document.getElementById("llmError");
  if (err) {
    err.innerHTML = `<strong>LLM 解读失败</strong><br>${msg}<br><br><a class="retry-link" href="#" onclick="retryLLM();return false">点击重试</a><br><br>也可检查 API 配置后重新摇卦。`;
    err.classList.add("active");
  }
}

function retryLLM() {
  const err = document.getElementById("llmError");
  if (err) { err.classList.remove("active"); err.innerHTML = ""; }
  const loading = document.getElementById("llmLoading");
  if (loading) loading.classList.add("active");
  if (window._lastLLMResult) {
    callLLM(window._lastLLMResult);
  }
}

function renderMarkdown(text) {
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Block-level conversions
  // Headings ###
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$2</h2>');
  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  // Blockquote >
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  // Unordered list items
  html = html.replace(/^[\d]+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');
  // Paragraphs: lines that are not headings/lists/quotes/etc
  const lines = html.split('\n');
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<blockquote') || trimmed.startsWith('</')) {
      result.push(trimmed);
    } else {
      result.push(`<p>${trimmed}</p>`);
    }
  }
  return result.join('\n');
}

// ============================================================
//  历史记录管理
// ============================================================

let history = [];
let activeHistoryIndex = -1;

function addToHistory(result) {
  result._id = Date.now();
  result._seq = history.length + 1;
  result._time = new Date().toLocaleString("zh-CN", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
  history.push(result);
  activeHistoryIndex = history.length - 1;
  renderHistoryList();
  document.getElementById("historyCount").textContent = history.length;
  saveHistory();
  // 后台同步到 Supabase
  if (typeof sbSaveHistory !== 'undefined') {
    sbSaveHistory(result).then(ok => {
      if (ok) saveHistory(); // 更新本地存储中的 _sbId
    });
  }
}

function saveHistory() {
  try {
    localStorage.setItem("liuyao-history", JSON.stringify(history));
  } catch(e) {}
}

function loadHistory() {
  try {
    const saved = localStorage.getItem("liuyao-history");
    if (saved) {
      history = JSON.parse(saved);
      activeHistoryIndex = history.length - 1;
      renderHistoryList();
      document.getElementById("historyCount").textContent = history.length;
    }
  } catch(e) {}
  // 后台从 Supabase 同步
  if (typeof sbLoadHistory !== 'undefined') {
    sbLoadHistory().then(remote => {
      if (remote && remote.length > 0) {
        history = remote;
        activeHistoryIndex = history.length - 1;
        renderHistoryList();
        document.getElementById("historyCount").textContent = history.length;
        saveHistory();
      }
    });
  }
}

function renderHistoryList(highlightId) {
  const list = document.getElementById("historyList");
  const empty = document.getElementById("emptyHistory");

  if (history.length === 0) {
    list.innerHTML = `
      <div class="empty-history" id="emptyHistory">
        <span class="empty-icon">☯</span>
        尚无占卜记录<br>点击「摇卦」开始
      </div>`;
    return;
  }

  const activeId = highlightId !== undefined ? highlightId : activeHistoryIndex;
  let html = "";
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    const hasChange = h.changingLines.length > 0;
    const badge = hasChange
      ? '<span class="si-badge has-change">变</span>'
      : '<span class="si-badge no-change">静</span>';
    const active = i === activeId ? ' active' : '';
    html += `<div class="sidebar-item${active}" data-index="${i}" onclick="showHistoryItem(${i})">
      <span class="si-gua">#${h._seq} ${h.hexInfo.name}卦</span>
      <span class="si-keyword">${h.hexInfo.keyword}</span>
      ${badge}
      <span class="si-time">${h._time}</span>
    </div>`;
  }
  list.innerHTML = html;
}

function showHistoryItem(index) {
  if (index < 0 || index >= history.length) return;
  activeHistoryIndex = index;
  const result = history[index];
  renderHistoryList(index);
  renderResult(result, true);
  // 恢复 LLM 对话上下文，启用追问输入
  if (result._llmMessages) {
    window._llmMessages = result._llmMessages;
  }
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

function clearHistory() {
  if (history.length === 0) return;
  if (!confirm("确定要清空所有占卜记录吗？")) return;
  history = [];
  activeHistoryIndex = -1;
  try { localStorage.removeItem("liuyao-history"); } catch(e) {}
  renderHistoryList();
  document.getElementById("historyCount").textContent = "0";
  document.getElementById("resultArea").innerHTML = "";
  document.getElementById("castCount").textContent = "0";
  castCount = 0;
  if (typeof sbClearHistory !== 'undefined') sbClearHistory();
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const isMobile = window.innerWidth <= 768;
  sidebar.classList.toggle("open");
  if (isMobile) {
    overlay.classList.toggle("active");
  }
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("active");
}

function recastFromHistory() {
  castHexagram();
}

// ============================================================
//  摇卦
// ============================================================

async function castHexagram() {
  const btn = document.getElementById("btnCast");
  btn.disabled = true;

  const overlay = document.getElementById("tossOverlay");
  overlay.classList.add("active");

  await new Promise(r => setTimeout(r, 1200));
  overlay.classList.remove("active");

  const result = cast();
  castCount++;
  document.getElementById("castCount").textContent = castCount;

  addToHistory(result);
  renderResult(result);
  btn.disabled = false;
}

function toggleSettings() {
  const panel = document.getElementById("settingsPanel");
  panel.classList.toggle("open");
}

function toggleRef() {
  const grid = document.getElementById("refGrid");
  grid.classList.toggle("open");
}

// ============================================================
//  初始化
// ============================================================

(function initRef() {
  const grid = document.getElementById("refGrid");
  let html = "";
  for (const name of TRIGRAM_ORDER) {
    const info = TRIGRAMS[name];
    html += `<div class="ref-item">
      <span class="ref-sym">${info.symbol}</span>
      ${name} · ${info.nature}
    </div>`;
  }
  grid.innerHTML = html;
})();

// ============================================================
//  主题切换
// ============================================================

function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById("themeIcon");
  const current = html.getAttribute("data-theme");
  if (current === "light") {
    html.removeAttribute("data-theme");
    if (icon) icon.textContent = "☽";
    localStorage.setItem("liuyao-theme", "dark");
  } else {
    html.setAttribute("data-theme", "light");
    if (icon) icon.textContent = "☀";
    localStorage.setItem("liuyao-theme", "light");
  }
}

// 初始化主题
(function initTheme() {
  const saved = localStorage.getItem("liuyao-theme");
  const icon = document.getElementById("themeIcon");
  if (saved === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    if (icon) icon.textContent = "☀";
  } else {
    if (icon) icon.textContent = "☽";
  }
})();

// 新用户清除旧历史
if (!localStorage.getItem("liuyao-visited")) {
  history = [];
  try { localStorage.removeItem("liuyao-history"); } catch(e) {}
  localStorage.setItem("liuyao-visited", "1");
}

// 加载历史记录
loadHistory();

// ============================================================
//  多种起卦方式
// ============================================================

// ── 步骤状态 ──
let _stepData = { yaos: [], step: 0 };

// ── 步骤遮罩管理 ──
function showStepOverlay(methodName, promptText, btnText, showCoins) {
  _stepData.yaos = [];
  _stepData.step = 0;
  document.getElementById('stepMethodName').textContent = methodName;
  document.getElementById('stepPrompt').textContent = promptText;
  document.getElementById('stepResultArea').classList.remove('active');
  // Always show step-coins area, control which row is visible
  document.getElementById('stepCoins').classList.add('active');
  document.getElementById('coinRow').style.display = showCoins ? 'flex' : 'none';
  document.getElementById('bookInputRow').style.display = 'none';
  document.getElementById('cardInputRow').style.display = 'none';
  document.getElementById('coinConfirmBtn').onclick = confirmCoinCast;
  document.getElementById('coinConfirmBtn').style.display = showCoins ? '' : 'none';
  document.getElementById('stepActionBtn').textContent = btnText;
  document.getElementById('stepActionBtn').style.display = showCoins ? 'none' : '';
  document.getElementById('coinHint').textContent = '点击硬币切换正反面';
  document.getElementById('stepOverlay').classList.add('active');
  updateStepUI();
}

function hideStepOverlay() {
  document.getElementById('stepOverlay').classList.remove('active');
}

function updateStepUI() {
  const pct = (_stepData.step / 6) * 100;
  document.getElementById('stepProgressFill').style.width = pct + '%';
  const next = Math.min(_stepData.step, 5);
  document.getElementById('stepPosName').textContent = POS_NAMES[next];
  document.getElementById('stepCount').textContent = _stepData.step + ' / 6';
}

function showStepResult(value, changing, desc) {
  const area = document.getElementById('stepResultArea');
  const lineEl = document.getElementById('stepResultLine');
  let html;
  if (value === 1) {
    html = '<div class="visual-yao"><div class="yao-bar yao-solid' + (changing ? ' yao-changing' : '') + '"></div>' + (changing ? '<span class="yao-change-mark"><svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="none" stroke="#f78166" stroke-width="2"/></svg></span>' : '') + '</div>';
  } else {
    html = '<div class="visual-yao"><div class="yao-bar yao-broken' + (changing ? ' yao-changing' : '') + '"><span></span><span></span></div>' + (changing ? '<span class="yao-change-mark"><svg viewBox="0 0 14 14"><line x1="2" y1="2" x2="12" y2="12" stroke="#f78166" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="#f78166" stroke-width="2.5" stroke-linecap="round"/></svg></span>' : '') + '</div>';
  }
  lineEl.innerHTML = html;
  document.getElementById('stepResultDesc').textContent = desc;
  area.classList.add('active');
}

function finalizeStepCast(yaos) {
  const changingLines = [];
  for (let i = 0; i < 6; i++) {
    if (yaos[i].changing) changingLines.push(i);
  }

  const lowerTri = trigramFromLines(yaos[0].value, yaos[1].value, yaos[2].value);
  const upperTri = trigramFromLines(yaos[3].value, yaos[4].value, yaos[5].value);
  const hexInfo = getHexagram(upperTri, lowerTri) || { name:"?", keyword:"", tuan:"", judgment:"", description:"" };

  let changedUpper = null, changedLower = null, changedInfo = null;
  if (changingLines.length > 0) {
    const newLower = [
      yaos[0].changing ? 1-yaos[0].value : yaos[0].value,
      yaos[1].changing ? 1-yaos[1].value : yaos[1].value,
      yaos[2].changing ? 1-yaos[2].value : yaos[2].value,
    ];
    const newUpper = [
      yaos[3].changing ? 1-yaos[3].value : yaos[3].value,
      yaos[4].changing ? 1-yaos[4].value : yaos[4].value,
      yaos[5].changing ? 1-yaos[5].value : yaos[5].value,
    ];
    changedLower = trigramFromLines(newLower[0], newLower[1], newLower[2]);
    changedUpper = trigramFromLines(newUpper[0], newUpper[1], newUpper[2]);
    changedInfo = getHexagram(changedUpper, changedLower);
  }

  const result = { yaos, changingLines, upper:upperTri, lower:lowerTri, hexInfo,
                   changedUpper, changedLower, changedInfo };

  castCount++;
  document.getElementById("castCount").textContent = castCount;
  addToHistory(result);
  renderResult(result);
}

// ── 方法1：手摇起卦（准备 + 点击硬币切换正反面）──
let _coinState = [1, 1, 1];

function startManualCast() {
  _coinState = [1, 1, 1];
  showStepOverlay('手摇起卦', '请准备三枚硬币，心中默念你所问之事。', '', false);
  document.getElementById('stepCoins').classList.remove('active');
  document.getElementById('stepCounter').style.display = 'none';
  document.getElementById('stepProgressTrack').style.display = 'none';
  document.getElementById('stepActionBtn').style.display = '';
  document.getElementById('stepActionBtn').textContent = '开始摇卦';
  document.getElementById('stepActionBtn').onclick = startCoinPhase;
}

function startCoinPhase() {
  document.getElementById('stepPrompt').textContent = '点击硬币切换正背面，然后确认：';
  document.getElementById('stepCounter').style.display = '';
  document.getElementById('stepProgressTrack').style.display = '';
  document.getElementById('stepActionBtn').style.display = 'none';
  document.getElementById('stepCoins').classList.add('active');
  document.getElementById('coinRow').style.display = 'flex';
  document.getElementById('bookInputRow').style.display = 'none';
  document.getElementById('cardInputRow').style.display = 'none';
  document.getElementById('coinConfirmBtn').style.display = '';
  document.getElementById('coinConfirmBtn').onclick = confirmCoinCast;
  for (let i = 0; i < 3; i++) {
    const btn = document.querySelector(`.coin-btn[data-idx="${i}"]`);
    btn.classList.remove('face-zi');
    document.getElementById('coinFace' + i).textContent = '背';
  }
  document.getElementById('coinHint').textContent = '点击硬币切换正反面';
  updateStepUI();
}

function toggleCoin(idx) {
  _coinState[idx] = 1 - _coinState[idx];
  const face = document.getElementById('coinFace' + idx);
  const btn = document.querySelector(`.coin-btn[data-idx="${idx}"]`);
  if (_coinState[idx] === 1) {
    face.textContent = '背';
    btn.classList.remove('face-zi');
  } else {
    face.textContent = '字';
    btn.classList.add('face-zi');
  }
}

function confirmCoinCast() {
  const heads = _coinState.reduce((a,b) => a + b, 0);
  let text, value, changing;
  if (heads === 3) {
    text = '三背（老阳）'; value = 1; changing = true;
  } else if (heads === 2) {
    text = '二背一字（少阴）'; value = 0; changing = false;
  } else if (heads === 1) {
    text = '一背二字（少阳）'; value = 1; changing = false;
  } else {
    text = '三字（老阴）'; value = 0; changing = true;
  }

  const y = { value, changing, coin: text };
  _stepData.yaos.push(y);

  const desc = y.coin + ' · ' + (y.value === 1 ? '阳爻' : '阴爻');
  showStepResult(y.value, y.changing, desc);
  _stepData.step++;
  updateStepUI();

  if (_stepData.step >= 6) {
    document.getElementById('stepCoins').classList.remove('active');
    document.getElementById('stepProgressFill').style.width = '100%';
    document.getElementById('stepPrompt').textContent = '起卦完成！正在解读…';
    setTimeout(() => {
      hideStepOverlay();
      finalizeStepCast(_stepData.yaos);
    }, 1000);
  } else {
    // Reset coins for next step
    _coinState = [1, 1, 1];
    for (let i = 0; i < 3; i++) {
      const btn = document.querySelector(`.coin-btn[data-idx="${i}"]`);
      btn.classList.remove('face-zi');
      document.getElementById('coinFace' + i).textContent = '背';
    }
    document.getElementById('coinHint').textContent = '再次掷出铜钱，点击切换';
    updateStepUI();
  }
}

// ── 方法2：书页起卦 ──
function startBookCast() {
  showStepOverlay('书页起卦', '从手边任意书籍中翻取页码，心中默念你所问之事。', '', false);
  document.getElementById('stepCoins').classList.remove('active');
  document.getElementById('stepCounter').style.display = 'none';
  document.getElementById('stepProgressTrack').style.display = 'none';
  document.getElementById('stepActionBtn').style.display = '';
  document.getElementById('stepActionBtn').textContent = '开始翻书';
  document.getElementById('stepActionBtn').onclick = startBookPhase;
}

function startBookPhase() {
  document.getElementById('stepPrompt').textContent = '输入三个不同的页码——奇数（单数）为阳，偶数（双数）为阴，三奇三偶为变爻。';
  document.getElementById('stepCounter').style.display = '';
  document.getElementById('stepProgressTrack').style.display = '';
  document.getElementById('stepCoins').classList.add('active');
  document.getElementById('stepActionBtn').style.display = 'none';
  document.getElementById('coinRow').style.display = 'none';
  document.getElementById('bookInputRow').style.display = 'flex';
  document.getElementById('cardInputRow').style.display = 'none';
  document.getElementById('coinConfirmBtn').style.display = '';
  document.getElementById('coinConfirmBtn').onclick = confirmBookCast;
  document.getElementById('coinHint').textContent = '输入三个不同的页码';
  document.getElementById('bookInput0').value = '';
  document.getElementById('bookInput1').value = '';
  document.getElementById('bookInput2').value = '';
  document.getElementById('bookInput0').focus();
  updateStepUI();
}

function confirmBookCast() {
  const vals = [
    parseInt(document.getElementById('bookInput0').value),
    parseInt(document.getElementById('bookInput1').value),
    parseInt(document.getElementById('bookInput2').value)
  ];
  if (vals.some(v => !v || v < 1)) {
    document.getElementById('coinHint').textContent = '请输入有效的页码（正整数）';
    return;
  }

  const odds = vals.reduce((s, v) => s + (v % 2), 0);
  let text, value, changing;
  if (odds === 3)      { text = '三奇（老阳）'; value = 1; changing = true; }
  else if (odds === 2) { text = '二奇一偶（少阴）'; value = 0; changing = false; }
  else if (odds === 1) { text = '一奇二偶（少阳）'; value = 1; changing = false; }
  else                 { text = '三偶（老阴）'; value = 0; changing = true; }

  const y = { value, changing, coin: text };
  _stepData.yaos.push(y);
  showStepResult(y.value, y.changing, text + ' · ' + (y.value === 1 ? '阳爻' : '阴爻'));
  _stepData.step++;
  updateStepUI();

  if (_stepData.step >= 6) {
    document.getElementById('stepProgressFill').style.width = '100%';
    document.getElementById('stepPrompt').textContent = '起卦完成！正在解读…';
    document.getElementById('coinConfirmBtn').style.display = 'none';
    setTimeout(() => { hideStepOverlay(); finalizeStepCast(_stepData.yaos); }, 1000);
  } else {
    document.getElementById('coinHint').textContent = '输入三个不同的页码';
    document.getElementById('bookInput0').value = '';
    document.getElementById('bookInput1').value = '';
    document.getElementById('bookInput2').value = '';
    document.getElementById('bookInput0').focus();
  }
}

// ── 方法3：扑克牌起卦 ──
function startCardCast() {
  showStepOverlay('扑克牌起卦', '准备一副扑克牌（不含大小王），心中默念你所问之事。', '', false);
  document.getElementById('stepCoins').classList.remove('active');
  document.getElementById('stepCounter').style.display = 'none';
  document.getElementById('stepProgressTrack').style.display = 'none';
  document.getElementById('stepActionBtn').style.display = '';
  document.getElementById('stepActionBtn').textContent = '开始抽牌';
  document.getElementById('stepActionBtn').onclick = startCardPhase;
}

function startCardPhase() {
  document.getElementById('stepPrompt').textContent = '输入三张牌的牌面（A~K）。A、3、5、7、9、J、K 为阳（奇数），2、4、6、8、10、Q 为阴（偶数）。';
  document.getElementById('stepCounter').style.display = '';
  document.getElementById('stepProgressTrack').style.display = '';
  document.getElementById('stepCoins').classList.add('active');
  document.getElementById('stepActionBtn').style.display = 'none';
  document.getElementById('coinRow').style.display = 'none';
  document.getElementById('bookInputRow').style.display = 'none';
  document.getElementById('cardInputRow').style.display = 'flex';
  document.getElementById('coinConfirmBtn').style.display = '';
  document.getElementById('coinConfirmBtn').onclick = confirmCardCast;
  document.getElementById('coinHint').textContent = '输入三张牌的牌面值（A~K）';
  document.getElementById('cardInput0').value = '';
  document.getElementById('cardInput1').value = '';
  document.getElementById('cardInput2').value = '';
  document.getElementById('cardInput0').focus();
  updateStepUI();
}

function confirmCardCast() {
  const rankMap = { 'A':1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':11, 'Q':12, 'K':13 };
  const vals = [
    document.getElementById('cardInput0').value.trim().toUpperCase(),
    document.getElementById('cardInput1').value.trim().toUpperCase(),
    document.getElementById('cardInput2').value.trim().toUpperCase()
  ];
  const nums = vals.map(v => rankMap[v]);
  if (nums.some(n => n === undefined)) {
    document.getElementById('coinHint').textContent = '请输入有效的牌面（A~K，不含大小王）';
    return;
  }

  const odds = nums.reduce((s, n) => s + (n % 2), 0);
  let text, value, changing;
  if (odds === 3)      { text = '三奇（老阳）'; value = 1; changing = true; }
  else if (odds === 2) { text = '二奇一偶（少阴）'; value = 0; changing = false; }
  else if (odds === 1) { text = '一奇二偶（少阳）'; value = 1; changing = false; }
  else                 { text = '三偶（老阴）'; value = 0; changing = true; }

  const y = { value, changing, coin: text };
  _stepData.yaos.push(y);
  showStepResult(y.value, y.changing, text + ' · ' + (y.value === 1 ? '阳爻' : '阴爻'));
  _stepData.step++;
  updateStepUI();

  if (_stepData.step >= 6) {
    document.getElementById('stepProgressFill').style.width = '100%';
    document.getElementById('stepPrompt').textContent = '起卦完成！正在解读…';
    document.getElementById('coinConfirmBtn').style.display = 'none';
    setTimeout(() => { hideStepOverlay(); finalizeStepCast(_stepData.yaos); }, 1000);
  } else {
    document.getElementById('coinHint').textContent = '输入三张牌的牌面值（A~K）';
    document.getElementById('cardInput0').value = '';
    document.getElementById('cardInput1').value = '';
    document.getElementById('cardInput2').value = '';
    document.getElementById('cardInput0').focus();
  }
}

