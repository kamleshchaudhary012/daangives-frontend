# ============================================================
# DaanGives — CSR Connect PPT Generator
# Integrated Digital Donor and Beneficiary Management Platform
# ============================================================

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# ---------- COLOR PALETTE ----------
NAVY    = RGBColor(0x0B, 0x1C, 0x30)
PRIMARY = RGBColor(0x00, 0x4A, 0xC6)
GREEN   = RGBColor(0x00, 0x6C, 0x49)
ORANGE  = RGBColor(0x8E, 0x3C, 0x00)
GRAY    = RGBColor(0x43, 0x46, 0x55)
LIGHT   = RGBColor(0xF8, 0xF9, 0xFF)
WHITE   = RGBColor(0xFF, 0xFF, 0xFF)
BORDER  = RGBColor(0xC3, 0xC6, 0xD7)

prs = Presentation()
prs.slide_width  = Inches(13.333)   # 16:9
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

# ---------- HELPERS ----------
def add_bg(slide, color=LIGHT):
    bg = slide.shapes.add_shape(1, 0, 0, prs.slide_width, prs.slide_height)
    bg.fill.solid(); bg.fill.fore_color.rgb = color
    bg.line.fill.background()
    bg.shadow.inherit = False
    return bg

def add_text(slide, text, x, y, w, h,
             size=18, bold=False, color=NAVY,
             align=PP_ALIGN.LEFT, font="Noto Sans Gujarati"):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    r.font.name = font
    return tb

def add_bullets(slide, items, x, y, w, h,
                size=16, color=GRAY, gap=12):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(gap)
        r = p.add_run()
        r.text = "•  " + item
        r.font.size = Pt(size)
        r.font.color.rgb = color
        r.font.name = "Noto Sans Gujarati"
    return tb

def add_accent_bar(slide, y, color=PRIMARY, height=Inches(0.06)):
    bar = slide.shapes.add_shape(1, Inches(0.6), y,
                                 prs.slide_width - Inches(1.2), height)
    bar.fill.solid(); bar.fill.fore_color.rgb = color
    bar.line.fill.background()
    bar.shadow.inherit = False

def add_card(slide, x, y, w, h,
             title, body, accent=PRIMARY):
    card = slide.shapes.add_shape(1, x, y, w, h)
    card.fill.solid(); card.fill.fore_color.rgb = WHITE
    card.line.color.rgb = BORDER
    card.line.width = Pt(1)
    card.shadow.inherit = False

    top = slide.shapes.add_shape(1, x, y, w, Inches(0.08))
    top.fill.solid(); top.fill.fore_color.rgb = accent
    top.line.fill.background()
    top.shadow.inherit = False

    add_text(slide, title,
             x + Inches(0.25), y + Inches(0.25),
             w - Inches(0.5), Inches(0.5),
             size=15, bold=True, color=accent)
    add_text(slide, body,
             x + Inches(0.25), y + Inches(0.85),
             w - Inches(0.5), h - Inches(1.0),
             size=12, color=GRAY)

# ============================================================
# SLIDE 1 — TITLE
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s, NAVY)

add_text(s, "Integrated Digital Donor and",
         Inches(0.8), Inches(1.8), prs.slide_width - Inches(1.6), Inches(1),
         size=40, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_text(s, "Beneficiary Management Platform",
         Inches(0.8), Inches(2.6), prs.slide_width - Inches(1.6), Inches(1),
         size=40, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

add_accent_bar(s, Inches(3.8), PRIMARY, Inches(0.08))

add_text(s, "Proposed CSR Connect Module",
         Inches(0.8), Inches(4.1), prs.slide_width - Inches(1.6), Inches(0.6),
         size=22, color=RGBColor(0x6C,0xF8,0xBB), align=PP_ALIGN.CENTER)

add_text(s, "Presented By:  Kamlesh Chaudhari",
         Inches(0.8), Inches(5.6), prs.slide_width - Inches(1.6), Inches(0.5),
         size=16, color=WHITE, align=PP_ALIGN.CENTER)

add_text(s, "Connecting Companies with Verified Social Impact Projects",
         Inches(0.8), Inches(6.3), prs.slide_width - Inches(1.6), Inches(0.5),
         size=14, color=BORDER, align=PP_ALIGN.CENTER)

# ============================================================
# SLIDE 2 — INTRODUCTION
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s)

add_text(s, "Introduction", Inches(0.6), Inches(0.4),
         prs.slide_width - Inches(1.2), Inches(0.8),
         size=32, bold=True, color=NAVY)
add_accent_bar(s, Inches(1.25), PRIMARY)

add_text(s,
    "કંપનીઓ પોતાની CSR (Corporate Social Responsibility) જવાબદારી પૂરી કરવા માંગે છે, "
    "પણ વિશ્વસનીય અને verified NGO શોધવામાં મુશ્કેલી અનુભવે છે.",
    Inches(0.6), Inches(1.6), prs.slide_width - Inches(1.2), Inches(1),
    size=17, color=GRAY)

add_text(s,
    "CSR Connect એ DaanGives platform પરનું નવું module છે, જે કંપનીઓને "
    "admin-verified NGOs સાથે સીધું જોડે છે — પહેલી request થી લઈને project પૂર્ણ "
    "થાય ત્યાં સુધી પારદર્શક અને structured ભાગીદારી માટે.",
    Inches(0.6), Inches(2.9), prs.slide_width - Inches(1.2), Inches(1.2),
    size=17, color=GRAY)

y0 = Inches(4.4)
add_card(s, Inches(0.6),  y0, Inches(3.9), Inches(2.2),
         "🏢  Company",
         "CSR fund ધરાવે છે, પણ verified NGO શોધવાનો\nભરોસાપાત્ર રસ્તો જોઈએ છે.",
         PRIMARY)
add_card(s, Inches(4.7),  y0, Inches(3.9), Inches(2.2),
         "🏫  NGO / Institution",
         "સામાજિક કામ ધરાવે છે, પણ કંપનીઓ સુધી\nપહોંચવું મુશ્કેલ છે.",
         GREEN)
add_card(s, Inches(8.8),  y0, Inches(3.9), Inches(2.2),
         "🤝  CSR Connect",
         "બંનેને એક જ platform પર structured\nઅને transparent રીતે જોડે છે.",
         ORANGE)

# ============================================================
# SLIDE 3 — EXISTING PROBLEMS
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s)

add_text(s, "Existing Problems", Inches(0.6), Inches(0.4),
         prs.slide_width - Inches(1.2), Inches(0.8),
         size=32, bold=True, color=NAVY)
add_accent_bar(s, Inches(1.25), RGBColor(0xBA,0x1A,0x1A))

problems = [
    ("❌  NGO શોધવાની મુશ્કેલી",
     "કંપનીઓ પાસે CSR fund છે, પણ કઈ NGO genuine છે તે ખબર પડતી નથી."),
    ("❌  પહોંચવામાં અડચણ",
     "NGOs પાસે કામ છે, પણ કંપનીઓ સુધી પહોંચવાનો structured રસ્તો નથી."),
    ("❌  Broker / Middleman નું જોખમ",
     "વચ્ચે middleman હોય છે, જે trust તોડી નાખે છે."),
    ("❌  Verification નો અભાવ",
     "NGO ના documents, legal status verify કરવું અઘરું છે."),
    ("❌  Transparency નથી",
     "ફંડ ક્યાં ગયું, શું કામ થયું — તે દેખાતું નથી."),
    ("❌  Tracking નો અભાવ",
     "Project progress અને completion ની કોઈ structured tracking નથી."),
]

x0, y0 = Inches(0.6), Inches(1.6)
cw, ch  = Inches(5.9), Inches(1.05)
gap_x, gap_y = Inches(0.35), Inches(0.18)

for i, (t, d) in enumerate(problems):
    col = i % 2
    row = i // 2
    x = x0 + col * (cw + gap_x)
    y = y0 + row * (ch + gap_y)
    add_card(s, x, y, cw, ch, t, d,
             RGBColor(0xBA,0x1A,0x1A))

# ============================================================
# SLIDE 4 — PROPOSED SOLUTION
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s)

add_text(s, "Proposed Solution", Inches(0.6), Inches(0.4),
         prs.slide_width - Inches(1.2), Inches(0.8),
         size=32, bold=True, color=NAVY)
add_accent_bar(s, Inches(1.25), GREEN)

solutions = [
    "platform પર જ કંપનીઓ અને verified NGOs ને સીધું જોડવું.",
    "કંપની પોતાની CSR જરૂરિયાત post કરે.",
    "સિસ્ટમ matching કરીને relevant NGO બતાવે.",
    "NGO પહેલેથી DaanGives પર verify થઈ ચૂકી છે — Legal Documents, Bank Details, Trustees બધું ચેક થઈ ગયું છે.",
    "બંને વચ્ચે structured વાતચીત, request workflow અને progress tracking.",
    "Admin verification દ્વારા trust અને auditability જાળવવી.",
]

y0 = Inches(1.6)
for i, item in enumerate(solutions):
    y = y0 + Inches(i * 0.85)
    badge = s.shapes.add_shape(1, Inches(0.6), y, Inches(0.5), Inches(0.5))
    badge.fill.solid(); badge.fill.fore_color.rgb = GREEN
    badge.line.fill.background()
    badge.shadow.inherit = False
    add_text(s, str(i+1),
             Inches(0.6), y + Inches(0.05), Inches(0.5), Inches(0.4),
             size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    add_text(s, item,
             Inches(1.3), y + Inches(0.03),
             prs.slide_width - Inches(2.0), Inches(0.7),
             size=15, color=GRAY)

# ============================================================
# SLIDE 5 — STAKEHOLDERS (FIXED)
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s)

add_text(s, "Stakeholders", Inches(0.6), Inches(0.4),
         prs.slide_width - Inches(1.2), Inches(0.8),
         size=32, bold=True, color=NAVY)
add_accent_bar(s, Inches(1.25), PRIMARY)

cards = [
    ("🏢  Company (CSR Sponsor)",
     "CSR budget ધરાવે છે.\nCSR preference અને area of interest\nસેટ કરે છે.\nયોગ્ય CSR project શોધે છે.\nSupport Request મોકલે છે.",
     PRIMARY),
    ("🏫  NGO / Institution",
     "CSR જરૂરિયાત / project post કરે છે.\nCompany requests review કરે છે.\nAccept / Reject કરે છે.\nPartnership track કરે છે.",
     GREEN),
    ("🛡️  Admin",
     "Institution / NGO verify કરે છે.\nCSR Requirement verify કરે છે.\nPlatform monitor કરે છે.\nReports અને analytics જુએ છે.",
     ORANGE),
]

x0, y0 = Inches(0.6), Inches(1.6)
cw, ch  = Inches(3.95), Inches(5.2)
gap_x   = Inches(0.4)

for i, (title, body, color) in enumerate(cards):
    x = x0 + i * (cw + gap_x)
    card = s.shapes.add_shape(1, x, y0, cw, ch)
    card.fill.solid(); card.fill.fore_color.rgb = WHITE
    card.line.color.rgb = BORDER
    card.shadow.inherit = False

    top = s.shapes.add_shape(1, x, y0, cw, Inches(0.12))
    top.fill.solid(); top.fill.fore_color.rgb = color
    top.line.fill.background()
    top.shadow.inherit = False

    add_text(s, title,
             x + Inches(0.3), y0 + Inches(0.4),
             cw - Inches(0.6), Inches(0.8),
             size=18, bold=True, color=color)

    add_text(s, body,
             x + Inches(0.3), y0 + Inches(1.4),
             cw - Inches(0.6), ch - Inches(1.8),
             size=13, color=GRAY)

# ============================================================
# SLIDE 6 — SYSTEM WORKFLOW
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s)

add_text(s, "System Workflow", Inches(0.6), Inches(0.3),
         prs.slide_width - Inches(1.2), Inches(0.7),
         size=30, bold=True, color=NAVY)
add_accent_bar(s, Inches(1.05), PRIMARY)

steps_top = [
    "કંપની\nરજિસ્ટ્રેશન",
    "CSR\nપ્રોફાઇલ",
    "જરૂરિયાત\nપોસ્ટ",
    "મેચિંગ\nએન્જિન",
    "સપોર્ટ\nરિક્વેસ્ટ",
]
steps_bottom = [
    "સંસ્થાની\nસમીક્ષા",
    "જોડાણ\nસ્થાપિત",
    "ભાગીદારી\nકરાર",
    "પ્રોજેક્ટ\nટ્રેકિંગ",
    "પૂર્ણતા\nરિપોર્ટ",
]

bw = Inches(2.15)
bh = Inches(1.35)
gap = Inches(0.25)
start_x = Inches(0.65)

# top row
y_top = Inches(1.6)
for i, txt in enumerate(steps_top):
    x = start_x + i * (bw + gap)
    box = s.shapes.add_shape(1, x, y_top, bw, bh)
    box.fill.solid(); box.fill.fore_color.rgb = WHITE
    box.line.color.rgb = PRIMARY
    box.line.width = Pt(2)
    box.shadow.inherit = False
    add_text(s, txt, x, y_top + Inches(0.3), bw, bh - Inches(0.4),
             size=13, bold=True, color=PRIMARY, align=PP_ALIGN.CENTER)
    if i < len(steps_top) - 1:
        add_text(s, "→", x + bw, y_top + Inches(0.4),
                 gap, Inches(0.5), size=18, bold=True,
                 color=GRAY, align=PP_ALIGN.CENTER)

# down arrow
mid_x = start_x + 4 * (bw + gap) + bw/2
add_text(s, "↓", mid_x - Inches(0.2), y_top + bh,
         Inches(0.4), Inches(0.55), size=22, bold=True,
         color=PRIMARY, align=PP_ALIGN.CENTER)

# bottom row (reversed)
y_bot = Inches(3.6)
for i, txt in enumerate(steps_bottom):
    x = start_x + i * (bw + gap)
    box = s.shapes.add_shape(1, x, y_bot, bw, bh)
    box.fill.solid(); box.fill.fore_color.rgb = WHITE
    box.line.color.rgb = GREEN
    box.line.width = Pt(2)
    box.shadow.inherit = False
    add_text(s, txt, x, y_bot + Inches(0.3), bw, bh - Inches(0.4),
             size=13, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
    if i < len(steps_bottom) - 1:
        add_text(s, "→", x + bw, y_bot + Inches(0.4),
                 gap, Inches(0.5), size=18, bold=True,
                 color=GRAY, align=PP_ALIGN.CENTER)

add_text(s,
    "દરેક પગલું પારદર્શક અને ટ્રેસેબલ છે — પ્રથમ સંપર્ક થી લઈને project પૂર્ણ થવા સુધી.",
    Inches(0.6), Inches(5.5), prs.slide_width - Inches(1.2), Inches(0.6),
    size=14, color=GRAY, align=PP_ALIGN.CENTER)

# ============================================================
# SLIDE 7 — TECHNOLOGY
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s)

add_text(s, "Technology Stack", Inches(0.6), Inches(0.4),
         prs.slide_width - Inches(1.2), Inches(0.8),
         size=32, bold=True, color=NAVY)
add_accent_bar(s, Inches(1.25), PRIMARY)

tech = [
    ("🎨  Frontend",
     "React.js + Vite",
     "User Interface, Company / NGO Dashboards,\nCSR Marketplace, Admin Panel.",
     PRIMARY),
    ("⚙️  Backend",
     "Python + Django + DRF",
     "Business Logic, Authentication, REST APIs,\nPermissions, Matching Engine.",
     GREEN),
    ("🗄️  Database",
     "PostgreSQL",
     "Users, Companies, NGOs, CSR Projects,\nSupport Requests, Partnerships.",
     ORANGE),
]

x0, y0 = Inches(0.6), Inches(1.7)
cw, ch  = Inches(3.95), Inches(3.2)
gap_x   = Inches(0.4)

for i, (t, sub, body, color) in enumerate(tech):
    x = x0 + i * (cw + gap_x)
    card = s.shapes.add_shape(1, x, y0, cw, ch)
    card.fill.solid(); card.fill.fore_color.rgb = WHITE
    card.line.color.rgb = BORDER
    card.shadow.inherit = False

    top = s.shapes.add_shape(1, x, y0, cw, Inches(0.12))
    top.fill.solid(); top.fill.fore_color.rgb = color
    top.line.fill.background()
    top.shadow.inherit = False

    add_text(s, t, x + Inches(0.3), y0 + Inches(0.35),
             cw - Inches(0.6), Inches(0.5),
             size=18, bold=True, color=color)
    add_text(s, sub, x + Inches(0.3), y0 + Inches(1.0),
             cw - Inches(0.6), Inches(0.5),
             size=15, bold=True, color=NAVY)
    add_text(s, body, x + Inches(0.3), y0 + Inches(1.7),
             cw - Inches(0.6), Inches(1.4),
             size=13, color=GRAY)

# ============================================================
# SLIDE 8 — PROJECT DELIVERABLES (FIXED)
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s)

add_text(s, "Project Deliverables", Inches(0.6), Inches(0.35),
         prs.slide_width - Inches(1.2), Inches(0.7),
         size=30, bold=True, color=NAVY)
add_accent_bar(s, Inches(1.05), PRIMARY)

left_items = [
    "Company Registration અને CSR Profile module",
    "CSR જરૂરિયાત posting અને management",
    "NGO–Company Matching Engine",
    "Support Request અને Institution Review workflow",
]
right_items = [
    "Partnership અને Connection tracking",
    "Milestone updates અને Project progress tracking",
    "CSR Compliance documentation અને Completion reports",
    "Admin Dashboard, Reports અને Analytics",
]

add_text(s, "Core Modules",
         Inches(0.6), Inches(1.4), Inches(6), Inches(0.4),
         size=16, bold=True, color=PRIMARY)
add_bullets(s, left_items,
            Inches(0.6), Inches(1.9),
            Inches(6.0), Inches(4.5),
            size=14)

add_text(s, "Tracking & Reporting",
         Inches(6.9), Inches(1.4), Inches(6), Inches(0.4),
         size=16, bold=True, color=GREEN)
add_bullets(s, right_items,
            Inches(6.9), Inches(1.9),
            Inches(6.0), Inches(4.5),
            size=14)

# ============================================================
# SLIDE 9 — OUTCOME
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s)

add_text(s, "Expected Outcome", Inches(0.6), Inches(0.4),
         prs.slide_width - Inches(1.2), Inches(0.8),
         size=32, bold=True, color=NAVY)
add_accent_bar(s, Inches(1.25), GREEN)

outcomes = [
    "કંપનીઓને CSR જવાબદારી પૂરી કરવાનો પારદર્શક, verified રસ્તો મળે છે.",
    "NGOs ને કોર્પોરેટ CSR ફંડિંગ સુધી સીધી પહોંચ મળે છે — કોઈ middleman નહીં.",
    "દરેક ભાગીદારી progress tracking અને completion report સાથે જોડાયેલ છે.",
    "ફંડનો ઉપયોગ બંને પક્ષો માટે દેખાય અને auditable બને છે.",
    "કંપનીઓને reporting માટે તૈયાર CSR compliance documentation મળે છે.",
    "ભવિષ્યના સુધારા માટે પાયો બને છે — automated reports, impact analytics, multi-year partnerships.",
]

y0 = Inches(1.7)
for i, item in enumerate(outcomes):
    y = y0 + Inches(i * 0.78)
    dot = s.shapes.add_shape(9, Inches(0.7), y + Inches(0.13),
                             Inches(0.18), Inches(0.18))
    dot.fill.solid(); dot.fill.fore_color.rgb = GREEN
    dot.line.fill.background()
    dot.shadow.inherit = False

    add_text(s, item,
             Inches(1.1), y,
             prs.slide_width - Inches(1.8), Inches(0.7),
             size=15, color=GRAY)

# ============================================================
# SLIDE 10 — THANK YOU (FIXED)
# ============================================================
s = prs.slides.add_slide(BLANK)
add_bg(s, NAVY)

add_text(s, "Thank You",
         Inches(0.8), Inches(2.4),
         prs.slide_width - Inches(1.6), Inches(1.2),
         size=60, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

add_accent_bar(s, Inches(3.9), PRIMARY, Inches(0.08))

add_text(s, "Questions & Discussion",
         Inches(0.8), Inches(4.3),
         prs.slide_width - Inches(1.6), Inches(0.7),
         size=22, color=RGBColor(0x6C,0xF8,0xBB),
         align=PP_ALIGN.CENTER)

add_text(s, "Integrated Digital Donor and Beneficiary Management Platform",
         Inches(0.8), Inches(5.4),
         prs.slide_width - Inches(1.6), Inches(0.6),
         size=14, color=BORDER, align=PP_ALIGN.CENTER)

add_text(s, "CSR Connect — Connecting CSR Budgets with Real Social Needs",
         Inches(0.8), Inches(5.9),
         prs.slide_width - Inches(1.6), Inches(0.6),
         size=13, color=BORDER, align=PP_ALIGN.CENTER)

# ============================================================
# SAVE
# ============================================================
out = "DaanGives_CSR_Connect_Presentation.pptx"
prs.save(out)
print("✅ PPT saved:", out)
print("Total slides:", len(prs.slides._sldIdLst))
