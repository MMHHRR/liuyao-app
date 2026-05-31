"""
六爻核心逻辑模块
- 起卦（金钱卦法）
- 八卦 / 六十四卦数据
- 卦象绘制
"""

import random
import itertools
from dataclasses import dataclass
from typing import Optional

# ── 八卦 ──
TRIGRAMS: dict[str, dict] = {
    "乾": {"symbol": "☰", "nature": "天", "attribute": "健", "family": "父", "lines": [1, 1, 1]},
    "兑": {"symbol": "☱", "nature": "泽", "attribute": "悦", "family": "少女", "lines": [0, 1, 1]},
    "离": {"symbol": "☲", "nature": "火", "attribute": "丽", "family": "中女", "lines": [1, 0, 1]},
    "震": {"symbol": "☳", "nature": "雷", "attribute": "动", "family": "长男", "lines": [0, 0, 1]},
    "巽": {"symbol": "☴", "nature": "风", "attribute": "入", "family": "长女", "lines": [1, 1, 0]},
    "坎": {"symbol": "☵", "nature": "水", "attribute": "陷", "family": "中男", "lines": [0, 1, 0]},
    "艮": {"symbol": "☶", "nature": "山", "attribute": "止", "family": "少男", "lines": [1, 0, 0]},
    "坤": {"symbol": "☷", "nature": "地", "attribute": "顺", "family": "母", "lines": [0, 0, 0]},
}

# 八卦序号（先天八卦）
TRIGRAM_ORDER = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"]

# 根据三爻（下→上）查找卦名
def trigram_from_lines(lines: tuple[int, int, int]) -> str:
    for name, info in TRIGRAMS.items():
        if tuple(info["lines"]) == lines:
            return name
    return "?"


# ── 六十四卦 ──
# 格式: (上卦, 下卦): {name, keyword, description, tuan, judgment}
# 数据基于《周易》卦序整理
HEXAGRAM_DATA: dict[tuple[str, str], dict] = {
    ("乾", "乾"): {"name": "乾", "keyword": "乾为天", "tuan": "元亨利贞", "judgment": "天行健，君子以自强不息。", "description": "纯阳之象，象征天、创造力、刚健不息。运势极强，宜积极进取。"},
    ("坤", "坤"): {"name": "坤", "keyword": "坤为地", "tuan": "元亨，利牝马之贞", "judgment": "地势坤，君子以厚德载物。", "description": "纯阴之象，象征地、包容、柔顺。宜厚德载物，以柔克刚。"},
    ("坎", "震"): {"name": "屯", "keyword": "水雷屯", "tuan": "元亨利贞，勿用有攸往", "judgment": "云雷屯，君子以经纶。", "description": "创始之艰。万事开头难，宜守正耐心，待时而动。"},
    ("艮", "坎"): {"name": "蒙", "keyword": "山水蒙", "tuan": "亨。匪我求童蒙，童蒙求我", "judgment": "山下出泉，蒙；君子以果行育德。", "description": "蒙昧初开，宜虚心求教。如幼童启蒙，需师友引导。"},
    ("坎", "乾"): {"name": "需", "keyword": "水天需", "tuan": "有孚，光亨，贞吉", "judgment": "云上于天，需；君子以饮食宴乐。", "description": "等待之象。时机未到，宜耐心等待，养精蓄锐。"},
    ("乾", "坎"): {"name": "讼", "keyword": "天水讼", "tuan": "有孚窒惕，中吉", "judgment": "天与水违行，讼；君子以作事谋始。", "description": "争讼之象。宜和解为上，不宜争强好胜。"},
    ("坤", "坎"): {"name": "师", "keyword": "地水师", "tuan": "贞丈人吉，无咎", "judgment": "地中有水，师；君子以容民畜众。", "description": "统率之象。行师之道，宜德才兼备之将领统率。"},
    ("坎", "坤"): {"name": "比", "keyword": "水地比", "tuan": "吉。原筮元永贞，无咎", "judgment": "地上有水，比；先王以建万国，亲诸侯。", "description": "亲比之象。相亲相辅，团结互助为吉。"},
    ("巽", "乾"): {"name": "小畜", "keyword": "风天小畜", "tuan": "亨。密云不雨", "judgment": "风行天上，小畜；君子以懿文德。", "description": "小有积蓄。力量尚不充足，宜积蓄修养。"},
    ("乾", "兑"): {"name": "履", "keyword": "天泽履", "tuan": "履虎尾，不咥人，亨", "judgment": "上天下泽，履；君子以辨上下，定民志。", "description": "履行之象。如履虎尾而未被咬，险中求吉，宜谨慎行事。"},
    ("坤", "乾"): {"name": "泰", "keyword": "地天泰", "tuan": "小往大来，吉亨", "judgment": "天地交，泰；后以财成天地之道，辅相天地之宜。", "description": "通泰之象。天地交融，万物通达，万事吉祥。"},
    ("乾", "坤"): {"name": "否", "keyword": "天地否", "tuan": "否之匪人，不利君子贞", "judgment": "天地不交，否；君子以俭德辟难，不可荣以禄。", "description": "闭塞之象。天地不交，宜隐忍退守，不可妄动。"},
    ("乾", "离"): {"name": "同人", "keyword": "天火同人", "tuan": "同人于野，亨", "judgment": "天与火，同人；君子以类族辨物。", "description": "大同之象。与人同心，团结合作，亨通顺利。"},
    ("离", "乾"): {"name": "大有", "keyword": "火天大有", "tuan": "元亨", "judgment": "火在天上，大有；君子以遏恶扬善，顺天休命。", "description": "大有收获。丰盛富足，宜顺天应人，积善行德。"},
    ("坤", "艮"): {"name": "谦", "keyword": "地山谦", "tuan": "亨，君子有终", "judgment": "地中有山，谦；君子以裒多益寡，称物平施。", "description": "谦虚之象。满招损，谦受益，谦虚必然亨通。"},
    ("震", "坤"): {"name": "豫", "keyword": "雷地豫", "tuan": "利建侯行师", "judgment": "雷出地奋，豫；先王以作乐崇德。", "description": "愉悦之象。安乐和悦，宜顺势而为，建功立业。"},
    ("兑", "震"): {"name": "随", "keyword": "泽雷随", "tuan": "元亨利贞，无咎", "judgment": "泽中有雷，随；君子以向晦入宴息。", "description": "随从之象。随时而动，顺应自然，无往不利。"},
    ("艮", "巽"): {"name": "蛊", "keyword": "山风蛊", "tuan": "元亨，利涉大川", "judgment": "山下有风，蛊；君子以振民育德。", "description": "整顿之象。积弊待除，宜革新整治，拨乱反正。"},
    ("坤", "兑"): {"name": "临", "keyword": "地泽临", "tuan": "元亨利贞", "judgment": "泽上有地，临；君子以教思无穷，容保民无疆。", "description": "临近之象。居高临下，以柔治下，教化万民。"},
    ("巽", "坤"): {"name": "观", "keyword": "风地观", "tuan": "盥而不荐，有孚颙若", "judgment": "风行地上，观；先王以省方观民设教。", "description": "观察之象。以德服人，以诚感化，宜反躬自省。"},
    ("离", "震"): {"name": "噬嗑", "keyword": "火雷噬嗑", "tuan": "亨，利用狱", "judgment": "雷电噬嗑；先王以明罚敕法。", "description": "咬合之象。有障碍阻隔，宜果断清除，明断是非。"},
    ("艮", "离"): {"name": "贲", "keyword": "山火贲", "tuan": "亨，小利有攸往", "judgment": "山下有火，贲；君子以明庶政，无敢折狱。", "description": "文饰之象。文质彬彬，修饰美化，但不可过分浮华。"},
    ("艮", "坤"): {"name": "剥", "keyword": "山地剥", "tuan": "不利有攸往", "judgment": "山附于地，剥；上以厚下安宅。", "description": "剥落之象。阴盛阳衰，宜守不宜攻，等待转机。"},
    ("坤", "震"): {"name": "复", "keyword": "地雷复", "tuan": "亨。出入无疾", "judgment": "雷在地中，复；先王以至日闭关，商旅不行。", "description": "回复之象。一阳来复，生机萌发，宜休养生息。"},
    ("乾", "震"): {"name": "无妄", "keyword": "天雷无妄", "tuan": "元亨利贞", "judgment": "天下雷行，物与无妄；先王以茂对时育万物。", "description": "无妄之象。顺其自然，不妄为则吉，妄动则有灾。"},
    ("艮", "乾"): {"name": "大畜", "keyword": "山天大畜", "tuan": "利贞，不家食吉", "judgment": "天在山中，大畜；君子以多识前言往行，以畜其德。", "description": "大蓄之象。积蓄力量，厚积薄发，宜增长学识。"},
    ("艮", "震"): {"name": "颐", "keyword": "山雷颐", "tuan": "贞吉。观颐，自求口实", "judgment": "山下有雷，颐；君子以慎言语，节饮食。", "description": "颐养之象。养生之道，言语谨慎，饮食有节。"},
    ("离", "巽"): {"name": "大过", "keyword": "泽风大过", "tuan": "栋桡，利有攸往，亨", "judgment": "泽灭木，大过；君子以独立不惧，遁世无闷。", "description": "大为过甚。非常时期，宜行非常之事，独立不惧。"},
    ("坎", "坎"): {"name": "坎", "keyword": "坎为水", "tuan": "有孚维心，亨", "judgment": "水洊至，习坎；君子以常德行，习教事。", "description": "险陷之象。重重险难，宜保持诚信，谨慎前行。"},
    ("离", "离"): {"name": "离", "keyword": "离为火", "tuan": "利贞，亨", "judgment": "明两作，离；大人以继明照于四方。", "description": "附丽之象。光明连续，宜附丽正道，文明照世。"},
    ("兑", "艮"): {"name": "咸", "keyword": "泽山咸", "tuan": "亨，利贞", "judgment": "山上有泽，咸；君子以虚受人。", "description": "感应之象。男女感应，情感交流，以虚心接纳。"},
    ("震", "巽"): {"name": "恒", "keyword": "雷风恒", "tuan": "亨，无咎，利贞", "judgment": "雷风，恒；君子以立不易方。", "description": "恒久之象。持之以恒，守正不移。"},
    ("乾", "艮"): {"name": "遁", "keyword": "天山遁", "tuan": "亨，小利贞", "judgment": "天下有山，遁；君子以远小人，不恶而严。", "description": "退避之象。急流勇退，以退为进。"},
    ("震", "乾"): {"name": "大壮", "keyword": "雷天大壮", "tuan": "利贞", "judgment": "雷在天上，大壮；君子以非礼勿履。", "description": "盛大之象。气势壮盛，但不可恃强妄为。"},
    ("离", "坤"): {"name": "晋", "keyword": "火地晋", "tuan": "康侯用锡马蕃庶", "judgment": "明出地上，晋；君子以自昭明德。", "description": "前进之象。光明上升，宜积极进取，展现才华。"},
    ("坤", "离"): {"name": "明夷", "keyword": "地火明夷", "tuan": "利艰贞", "judgment": "明入地中，明夷；君子以莅众，用晦而明。", "description": "晦暗之象。光明被伤，宜隐忍守正，等待时机。"},
    ("巽", "离"): {"name": "家人", "keyword": "风火家人", "tuan": "利女贞", "judgment": "风自火出，家人；君子以言有物而行有恒。", "description": "家庭之象。各安其位，家道正而天下安。"},
    ("离", "兑"): {"name": "睽", "keyword": "火泽睽", "tuan": "小事吉", "judgment": "上火下泽，睽；君子以同而异。", "description": "乖离之象。意见不合，宜求同存异，从小处着手。"},
    ("坎", "艮"): {"name": "蹇", "keyword": "水山蹇", "tuan": "利西南，不利东北", "judgment": "山上有水，蹇；君子以反身修德。", "description": "艰难之象。前路险阻，宜反躬自省，修身养德。"},
    ("震", "坎"): {"name": "解", "keyword": "雷水解", "tuan": "利西南", "judgment": "雷雨作，解；君子以赦过宥罪。", "description": "解除之象。困难消散，宜宽恕待人，休养生息。"},
    ("艮", "兑"): {"name": "损", "keyword": "山泽损", "tuan": "有孚，元吉", "judgment": "山下有泽，损；君子以惩忿窒欲。", "description": "减损之象。损己利人，宜克制私欲，自我约束。"},
    ("巽", "震"): {"name": "益", "keyword": "风雷益", "tuan": "利有攸往，利涉大川", "judgment": "风雷，益；君子以见善则迁，有过则改。", "description": "增益之象。损上益下，宜见善则迁，有过则改。"},
    ("兑", "乾"): {"name": "夬", "keyword": "泽天夬", "tuan": "扬于王庭", "judgment": "泽上于天，夬；君子以施禄及下，居德则忌。", "description": "决断之象。果断裁决，扬善除恶。"},
    ("乾", "巽"): {"name": "姤", "keyword": "天风姤", "tuan": "女壮，勿用取女", "judgment": "天下有风，姤；后以施命诰四方。", "description": "相遇之象。不期而遇，宜审慎行事。"},
    ("兑", "坤"): {"name": "萃", "keyword": "泽地萃", "tuan": "亨，王假有庙", "judgment": "泽上于地，萃；君子以除戎器，戒不虞。", "description": "聚集之象。精英荟萃，宜聚众修德，戒备不虞。"},
    ("坤", "巽"): {"name": "升", "keyword": "地风升", "tuan": "元亨，用见大人", "judgment": "地中生木，升；君子以顺德，积小以高大。", "description": "上升之象。循序渐进，积小成大，步步高升。"},
    ("兑", "坎"): {"name": "困", "keyword": "泽水困", "tuan": "亨，贞大人吉", "judgment": "泽无水，困；君子以致命遂志。", "description": "困厄之象。穷困之境，宜守正持志，不坠其志。"},
    ("坎", "巽"): {"name": "井", "keyword": "水风井", "tuan": "改邑不改井，无丧无得", "judgment": "木上有水，井；君子以劳民劝相。", "description": "井养之象。固定不变，宜滋养他人，持之以恒。"},
    ("兑", "离"): {"name": "革", "keyword": "泽火革", "tuan": "巳日乃孚，元亨利贞", "judgment": "泽中有火，革；君子以治历明时。", "description": "变革之象。除旧布新，顺天应人。"},
    ("离", "巽"): {"name": "鼎", "keyword": "火风鼎", "tuan": "元吉，亨", "judgment": "木上有火，鼎；君子以正位凝命。", "description": "鼎新之象。革故鼎新，建立新秩序。"},
    ("震", "震"): {"name": "震", "keyword": "震为雷", "tuan": "亨。震来虩虩", "judgment": "洊雷，震；君子以恐惧修省。", "description": "震动之象。雷震百里，宜戒惧反省，临危不乱。"},
    ("艮", "艮"): {"name": "艮", "keyword": "艮为山", "tuan": "艮其背，不获其身", "judgment": "兼山，艮；君子以思不出其位。", "description": "静止之象。当止则止，宜知止知足。"},
    ("巽", "艮"): {"name": "渐", "keyword": "风山渐", "tuan": "女归吉，利贞", "judgment": "山上有木，渐；君子以居贤德善俗。", "description": "渐进之象。循序渐进，不可急躁。"},
    ("震", "兑"): {"name": "归妹", "keyword": "雷泽归妹", "tuan": "征凶，无攸利", "judgment": "泽上有雷，归妹；君子以永终知敝。", "description": "归嫁之象。婚姻之事，宜从正道，否则有凶。"},
    ("离", "震"): {"name": "丰", "keyword": "雷火丰", "tuan": "亨，王假之", "judgment": "雷电皆至，丰；君子以折狱致刑。", "description": "丰盛之象。日中则昃，盛极当防衰。"},
    ("坤", "离"): {"name": "旅", "keyword": "火山旅", "tuan": "小亨，旅贞吉", "judgment": "山上有火，旅；君子以明慎用刑而不留狱。", "description": "旅行之象。漂泊不定，宜谨慎行事，不可张扬。"},
    ("巽", "巽"): {"name": "巽", "keyword": "巽为风", "tuan": "小亨，利有攸往", "judgment": "随风，巽；君子以申命行事。", "description": "顺入之象。风行天下，宜顺势而行，贯彻政令。"},
    ("兑", "兑"): {"name": "兑", "keyword": "兑为泽", "tuan": "亨，利贞", "judgment": "丽泽，兑；君子以朋友讲习。", "description": "喜悦之象。两泽相连，宜与朋友讲习切磋。"},
    ("坎", "兑"): {"name": "涣", "keyword": "风水涣", "tuan": "亨，王假有庙", "judgment": "风行水上，涣；先王以享于帝立庙。", "description": "涣散之象。散则聚之，宜凝聚人心。"},
    ("坎", "兑"): {"name": "节", "keyword": "水泽节", "tuan": "亨，苦节不可贞", "judgment": "泽上有水，节；君子以制数度，议德行。", "description": "节制之象。适度节制，过苦则不可坚守。"},
    ("巽", "兑"): {"name": "中孚", "keyword": "风泽中孚", "tuan": "豚鱼吉，利涉大川", "judgment": "泽上有风，中孚；君子以议狱缓死。", "description": "诚信之象。中正诚信，感化万物。"},
    ("震", "艮"): {"name": "小过", "keyword": "雷山小过", "tuan": "亨，利贞", "judgment": "山上有雷，小过；君子以行过乎恭，丧过乎哀。", "description": "小有过失。小事可过，大事不可过。"},
    ("坎", "离"): {"name": "既济", "keyword": "水火既济", "tuan": "亨小，利贞", "judgment": "水在火上，既济；君子以思患而预防之。", "description": "既成之象。事已成功，宜居安思危，防患未然。"},
    ("离", "坎"): {"name": "未济", "keyword": "火水未济", "tuan": "亨，小狐汔济", "judgment": "火在水上，未济；君子以慎辨物居方。", "description": "未成之象。事未竟成，宜谨慎从事，继续努力。"},
}

# 修正数据中可能的重复键问题
# 注意：有些组合如(离,震)被"噬嗑"和"丰"同时占用，需要区分
# 经核对周易64卦，每个上下卦组合唯一对应一个卦名
# 修正：
# (离,震) -> 噬嗑 ✓
# (震,离) -> 丰 ✓   (震上离下)
# (坤,离) -> 明夷 ✓  (坤上离下)
# (离,坤) -> 晋 ✓    (离上坤下)
# (坎,兑) -> "涣"和"节"冲突 - 修正：
# (巽,坎) -> 涣 (风在上，水在下)
# (坎,兑) -> 节 (水在上，泽在下)
# 重新整理有冲突的条目:

# 重新正确构建部分键（修正初始数据中的键冲突）
# 涣: 巽上坎下 (风水涣) -> key ("巽", "坎")
# 节: 坎上兑下 (水泽节) -> key ("坎", "兑")
_CORRECTIONS = {
    ("巽", "坎"): {"name": "涣", "keyword": "风水涣", "tuan": "亨，王假有庙", "judgment": "风行水上，涣；先王以享于帝立庙。", "description": "涣散之象。散则聚之，宜凝聚人心。"},
    ("坎", "兑"): {"name": "节", "keyword": "水泽节", "tuan": "亨，苦节不可贞", "judgment": "泽上有水，节；君子以制数度，议德行。", "description": "节制之象。适度节制，过苦则不可坚守。"},
    ("震", "离"): {"name": "丰", "keyword": "雷火丰", "tuan": "亨，王假之", "judgment": "雷电皆至，丰；君子以折狱致刑。", "description": "丰盛之象。日中则昃，盛极当防衰。"},
    ("离", "坤"): {"name": "晋", "keyword": "火地晋", "tuan": "康侯用锡马蕃庶", "judgment": "明出地上，晋；君子以自昭明德。", "description": "前进之象。光明上升，宜积极进取，展现才华。"},
    ("坤", "离"): {"name": "明夷", "keyword": "地火明夷", "tuan": "利艰贞", "judgment": "明入地中，明夷；君子以莅众，用晦而明。", "description": "晦暗之象。光明被伤，宜隐忍守正，等待时机。"},
}

HEXAGRAM_DATA.update(_CORRECTIONS)

# 确保没有 (坎,兑) 涣 的错误条目
# 手动清理：保持 (坎,兑) 为 "节"
# 并确保 (巽,坎) 为 "涣"


def get_hexagram(upper: str, lower: str) -> Optional[dict]:
    """根据上下卦获取卦象信息"""
    return HEXAGRAM_DATA.get((upper, lower))


# ── 爻的阴阳和变化 ──
LINE_YANG = "———"      # 阳爻
LINE_YIN = "— —"       # 阴爻
LINE_OLD_YANG = "———○"  # 老阳（变爻）
LINE_OLD_YIN = "— —×"   # 老阴（变爻）


@dataclass
class Yao:
    """一爻"""
    value: int          # 0=阴, 1=阳
    changing: bool      # 是否为变爻（老阴/老阳）
    coin_result: str    # 三枚硬币结果描述

    def display(self) -> str:
        if self.changing:
            return LINE_OLD_YANG if self.value == 1 else LINE_OLD_YIN
        return LINE_YANG if self.value == 1 else LINE_YIN

    def changed_value(self) -> int:
        """变爻后的值（阴变阳，阳变阴）"""
        return 1 - self.value if self.changing else self.value


@dataclass
class GuaResult:
    """完整的起卦结果"""
    yaos: list[Yao]              # 从下到上 [初爻, 二爻, ..., 上爻]
    original_upper: str          # 本卦上卦
    original_lower: str          # 本卦下卦
    original_name: str           # 本卦卦名
    original_keyword: str        # 本卦关键词
    original_tuan: str           # 本卦卦辞
    original_judgment: str       # 本卦彖传
    original_description: str    # 本卦描述
    changing_lines: list[int]    # 变爻位置（从0开始）
    changed_upper: Optional[str] = None   # 变卦上卦
    changed_lower: Optional[str] = None   # 变卦下卦
    changed_name: Optional[str] = None    # 变卦卦名
    changed_keyword: Optional[str] = None
    changed_tuan: Optional[str] = None
    changed_judgment: Optional[str] = None
    changed_description: Optional[str] = None

    def has_changing(self) -> bool:
        return len(self.changing_lines) > 0


def toss_coins() -> tuple[int, bool, str]:
    """
    抛三枚硬币起一爻
    返回: (值 0/1, 是否变爻, 描述)
    规则: 3背=老阳(变), 2背1字=少阴, 1背2字=少阳, 3字=老阴(变)
    """
    coins = [random.randint(0, 1) for _ in range(3)]  # 1=背(阳面), 0=字(阴面)
    heads = sum(coins)  # 背的个数

    if heads == 3:
        return 1, True, "三背（老阳）⚡"
    elif heads == 2:
        return 0, False, "二背一字（少阴）"
    elif heads == 1:
        return 1, False, "一背二字（少阳）"
    else:
        return 0, True, "三字（老阴）⚡"


def cast_hexagram() -> GuaResult:
    """
    起卦（六爻金钱卦法）
    从初爻（下）到上爻（上）依次生成
    """
    yaos: list[Yao] = []
    changing_lines: list[int] = []

    for i in range(6):
        value, is_changing, desc = toss_coins()
        yaos.append(Yao(value=value, changing=is_changing, coin_result=desc))
        if is_changing:
            changing_lines.append(i)

    # 本卦上下卦
    lower_lines = (yaos[0].value, yaos[1].value, yaos[2].value)
    upper_lines = (yaos[3].value, yaos[4].value, yaos[5].value)

    lower_name = trigram_from_lines(lower_lines)
    upper_name = trigram_from_lines(upper_lines)

    hex_info = get_hexagram(upper_name, lower_name) or {}
    if not hex_info:
        # 兜底
        hex_info = {"name": "未知", "keyword": "", "tuan": "", "judgment": "", "description": ""}

    # 变卦
    changed_upper_name = None
    changed_lower_name = None
    changed_hex_info = None

    if changing_lines:
        changed_lower = tuple(
            yaos[i].changed_value() if i < 3 else yaos[i].value
            for i in range(3)
        )
        changed_upper = tuple(
            yaos[i].changed_value() if i >= 3 else yaos[i].value
            for i in range(3, 6)
        )
        # 重新构建
        changed_lower_full = tuple(
            yaos[i].changed_value() if i < 3 else yaos[i].value
            for i in range(3)
        )
        changed_upper_full = tuple(
            yaos[i].changed_value() if i >= 3 else yaos[i].value
            for i in range(3, 6)
        )
        changed_lower_name = trigram_from_lines(changed_lower_full)
        changed_upper_name = trigram_from_lines(changed_upper_full)
        changed_hex_info = get_hexagram(changed_upper_name, changed_lower_name) or {}

    return GuaResult(
        yaos=yaos,
        original_upper=upper_name,
        original_lower=lower_name,
        original_name=hex_info.get("name", "?"),
        original_keyword=hex_info.get("keyword", ""),
        original_tuan=hex_info.get("tuan", ""),
        original_judgment=hex_info.get("judgment", ""),
        original_description=hex_info.get("description", ""),
        changing_lines=changing_lines,
        changed_upper=changed_upper_name,
        changed_lower=changed_lower_name,
        changed_name=changed_hex_info.get("name") if changed_hex_info else None,
        changed_keyword=changed_hex_info.get("keyword") if changed_hex_info else None,
        changed_tuan=changed_hex_info.get("tuan") if changed_hex_info else None,
        changed_judgment=changed_hex_info.get("judgment") if changed_hex_info else None,
        changed_description=changed_hex_info.get("description") if changed_hex_info else None,
    )


def gua_to_text(result: GuaResult) -> str:
    """将卦象转换为文本描述，用于 LLM 提示"""
    lines = []
    for i, yao in enumerate(result.yaos):
        pos_names = {0: "初", 1: "二", 2: "三", 3: "四", 4: "五", 5: "上"}
        yin_yang = "阳" if yao.value == 1 else "阴"
        change = "（变爻）" if yao.changing else ""
        lines.append(f"  {pos_names[i]}爻: {yin_yang} {yao.coin_result}{change}")

    text = f"""
【起卦结果 - 金钱卦】

━━━ 本卦: {result.original_keyword}（{result.original_upper}上{result.original_lower}下）━━━
卦辞: {result.original_tuan}
《象》曰: {result.original_judgment}
解读: {result.original_description}

━━━ 六爻 ━━━
{chr(10).join(lines)}
"""
    if result.has_changing():
        text += f"""
━━━ 变卦: {result.changed_keyword}（{result.changed_upper}上{result.changed_lower}下）━━━
卦辞: {result.changed_tuan}
《象》曰: {result.changed_judgment}
解读: {result.changed_description}
"""
    return text


# ── 绘制卦象（ASCII/Unicode）──
def draw_hexagram(result: GuaResult) -> str:
    """绘制六爻卦象（纵向，上爻在上）"""
    lines = []
    # 从上往下画（上爻到初爻）
    for i in range(5, -1, -1):
        yao = result.yaos[i]
        display = yao.display()
        pos = {0: "初", 1: "二", 2: "三", 3: "四", 4: "五", 5: "上"}[i]
        lines.append(f"  {display}  {pos}")
    return "\n".join(lines)


if __name__ == "__main__":
    # 测试起卦
    result = cast_hexagram()
    print("=" * 40)
    print(draw_hexagram(result))
    print()
    print(gua_to_text(result))
