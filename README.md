# Skin Texture Painter

เว็บสำหรับระบายสีพื้นผิว (texture) ของโมเดล `.obj` โดยเห็นผลบนโมเดล 3D ทันที แล้วบันทึกเป็น PNG ชื่อและขนาดเดิม เพื่อนำไปวางทับในเกม

ทั้งหมดทำงานในเบราว์เซอร์ ไฟล์ไม่ถูกอัปโหลดไปที่ไหน

## วิธีใช้

1. เปิดเว็บ แล้วกด **เปิดไฟล์ .obj / .png** เลือกทั้งสองไฟล์พร้อมกัน (หรือลากมาวางในหน้า)
2. ระบายบนโมเดล 3D หรือบนภาพ PNG ฝั่งขวา อีกฝั่งจะอัปเดตตาม
3. กด **บันทึก PNG** จะได้ไฟล์ชื่อเดิม ขนาดเดิม

| เครื่องมือ | ปุ่มลัด | ใช้ทำอะไร |
|---|---|---|
| พู่กัน | B | ระบายสีทับ |
| ย้อมสี | T | เปลี่ยนสีแต่เก็บลายและแสงเงาเดิม |
| คืนต้นฉบับ | E | ลบสิ่งที่ระบาย ให้กลับเป็นภาพเดิม |
| เปลี่ยนโทน | R | คลิกสีหนึ่ง ทุกจุดที่สีใกล้เคียงจะเปลี่ยนเป็นสีที่เลือก |
| ดูดสี | I | เก็บสีจากจุดที่คลิก |
| หมุนดู | V | หมุนโมเดลอย่างเดียว |

อื่น ๆ: `Ctrl+Z` ย้อนกลับ, `Ctrl+Shift+Z` ทำซ้ำ, `[` `]` ย่อ/ขยายพู่กัน, ล้อเมาส์ซูม, คลิกขวาลากเพื่อเลื่อน

## โครงสร้าง

```
site/index.html                  ตัวเว็บทั้งหมด (ไฟล์เดียว, ใช้ three.js r128 จาก cdnjs)
.github/workflows/pages.yml      deploy โฟลเดอร์ site/ ไป GitHub Pages ทุกครั้งที่ push เข้า main
                                 (ต้นฉบับอยู่ที่ deploy/pages.yml สคริปต์ publish จะคัดลอกให้)
scripts/publish.ps1 / .sh        สร้าง repo บน GitHub, push และเปิด Pages ในครั้งแรก
```

## Publish ครั้งแรก

ต้องมี [git](https://git-scm.com) และ [GitHub CLI](https://cli.github.com) ที่ล็อกอินแล้ว (`gh auth login`)

Windows (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\publish.ps1
```

macOS / Linux / Git Bash:

```bash
scripts/publish.sh
```

สคริปต์จะสร้าง repo `skin-texture-painter` (public), push โค้ด, ตั้งค่า Pages ให้ deploy ผ่าน GitHub Actions แล้วสั่ง deploy รอบแรก
เว็บจะอยู่ที่ `https://<ชื่อผู้ใช้>.github.io/skin-texture-painter/`

ถ้าเปิด Pages ผ่านสคริปต์ไม่สำเร็จ ให้ไปที่ **Settings → Pages → Source** แล้วเลือก **GitHub Actions**

## อัปเดตครั้งต่อไป

แก้ `site/index.html` แล้ว `git commit` + `git push` ตามปกติ workflow จะ deploy ให้เอง

## ทดสอบในเครื่อง

```bash
python -m http.server -d site 8000
```

แล้วเปิด http://localhost:8000
