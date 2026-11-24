from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "cover" / "kaipai-cover-16x9.png"
WIDTH, HEIGHT = 1280, 720

SERIF = "C:/Windows/Fonts/STSONG.TTF"
SERIF_BOLD = "C:/Windows/Fonts/simhei.ttf"
SANS = "C:/Windows/Fonts/NotoSansSC-VF.ttf"
SANS_BOLD = "C:/Windows/Fonts/msyhbd.ttc"
MONO = "C:/Windows/Fonts/consola.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


image = Image.new("RGB", (WIDTH, HEIGHT), "#11100e")
draw = ImageDraw.Draw(image)

# Stage grid and warm overhead light.
for x in range(0, WIDTH, 40):
    draw.line((x, 0, x, HEIGHT), fill="#1b1916", width=1)
for y in range(0, HEIGHT, 40):
    draw.line((0, y, WIDTH, y), fill="#1b1916", width=1)
for radius in range(440, 0, -16):
    alpha = int(13 * (1 - radius / 440))
    color = (193 - alpha, 138 - alpha, 45 - alpha)
    draw.ellipse(
        (1030 - radius, -170 - radius, 1030 + radius, -170 + radius),
        fill=color,
    )

draw.rectangle((72, 55, 78, 665), fill="#c18a2d")
draw.line((0, 88, WIDTH, 88), fill="#3a3128", width=1)
draw.line((0, 632, WIDTH, 632), fill="#3a3128", width=1)

draw.text((112, 100), "开排", font=font(SERIF_BOLD, 34), fill="#f2e8da")
draw.text((212, 112), "舞台制作工作台", font=font(SANS, 15), fill="#9b9082")
draw.text(
    (112, 185),
    "把零散想法，",
    font=font(SERIF_BOLD, 67),
    fill="#f2ede4",
)
draw.text(
    (112, 268),
    "变成可执行的排演材料",
    font=font(SERIF_BOLD, 67),
    fill="#f2ede4",
)
draw.text(
    (112, 357),
    "剧本 · 场次 · 人物 · 走位 · 提示 · 部门 · 视觉 · 交付",
    font=font(SANS, 18),
    fill="#a99d8d",
)
draw.line((112, 444, 372, 444), fill="#3b332b", width=2)
draw.text((112, 462), "CUE 01 · 剧本是唯一事实源", font=font(MONO, 13), fill="#c18a2d")
draw.text((112, 492), "修改原文后，关联提示与资产进入影响队列", font=font(SANS, 16), fill="#c8bcae")

# Product frame.
panel = (690, 88, 1190, 618)
draw.rectangle(panel, fill="#e6ded1", outline="#d3cabc", width=1)
draw.rectangle((690, 88, 780, 618), fill="#181613")
draw.rectangle((708, 110, 738, 114), fill="#c18a2d")
for index, label in enumerate(["00 总览", "01 剧本", "02 拆解", "03 排演", "04 部门", "05 排练", "06 视觉", "07 交付"]):
    y = 140 + index * 29
    draw.text((708, y), label, font=font(MONO, 9), fill="#f2e8da" if index == 1 else "#6f665b")

draw.text((808, 120), "02 · 剧本拆解", font=font(MONO, 9), fill="#b23b32")
draw.text((808, 143), "第一场 · 客厅", font=font(SERIF_BOLD, 25), fill="#1c1917")
draw.text((808, 181), "老陈 / 阿岚 · 6 分钟 · 铺垫", font=font(SANS, 11), fill="#746c61")
draw.line((808, 207, 1160, 207), fill="#d3cabc", width=1)

draw.text((808, 227), "老陈", font=font(SANS_BOLD, 10), fill="#b23b32")
draw.text((808, 246), "你终于回来了。", font=font(SERIF, 18), fill="#1c1917")
draw.text((808, 286), "阿岚", font=font(SANS_BOLD, 10), fill="#55715b")
draw.text((808, 305), "爸，我回来了。", font=font(SERIF, 18), fill="#1c1917")
draw.text((808, 348), "（灯光转暖，落在桌上的钥匙上。）", font=font(SERIF_BOLD, 12), fill="#746c61")
draw.text((808, 389), "老陈", font=font(SANS_BOLD, 10), fill="#b23b32")
draw.text((808, 408), "这是你妈留下的那把。", font=font(SERIF, 18), fill="#1c1917")

draw.rectangle((1080, 226, 1158, 262), fill="#d8b96f")
draw.text((1090, 237), "灯光 cue", font=font(MONO, 10), fill="#261c10")
draw.line((1020, 394, 1080, 394), fill="#c18a2d", width=2)
draw.ellipse((1075, 389, 1085, 399), fill="#c18a2d")

draw.rectangle((808, 480, 1158, 586), fill="#fffdf8", outline="#d3cabc", width=1)
draw.text((822, 496), "部门准备", font=font(MONO, 9), fill="#746c61")
draw.line((822, 512, 1144, 512), fill="#e6ded1", width=1)
draw.text((822, 525), "灯光　面光弱一档，暖色定点落在钥匙", font=font(SANS, 12), fill="#1c1917")
draw.text((822, 547), "音效　雨声从门口渐入", font=font(SANS, 12), fill="#1c1917")
draw.text((822, 568), "来源：导演原话 · 保留待确认项", font=font(SANS, 9), fill="#746c61")

# Palette / signature footer.
for x, w, color in [
    (112, 86, "#151413"),
    (198, 86, "#40555e"),
    (284, 58, "#b23b32"),
    (342, 58, "#c18a2d"),
    (400, 38, "#f4f0e8"),
]:
    draw.rectangle((x, 650, x + w, 655), fill=color)
draw.text(
    (462, 643),
    "WORKLIGHT / 10 FAMILIES / 24 DIRECTORS",
    font=font(MONO, 10),
    fill="#756b5f",
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
image.save(OUTPUT, optimize=True)
print(OUTPUT)
