# 紅色半月筊杯素材與判讀

使用內建 image_gen 生成兩張透明背景 PNG，已複製至專案根目錄供 `Jiaobei.html` 使用。

- 平面：`jiaobei-flat.png`
- 凸面：`jiaobei-convex.png`

頁面載入使用壓縮版本 `jiaobei-flat.webp`、`jiaobei-convex.webp`：640 × 640、品質 85%、保留透明背景，合計 99,612 位元組。原始 PNG 保留，合計 2,045,661 位元組；壓縮版本減少約 95.1% 傳輸量。

## 判讀參考

依據 [行天宮擲筊說明](https://www.ht.org.tw/religion207.htm) 與 [國立傳統藝術中心筊杯典藏](https://collections.ncfta.gov.tw/pages/product/view.aspx?id=11200404203)：

| 朝上組合 | 頁面結果 | 傳統意義 |
| --- | --- | --- |
| 一平一凸 | 聖杯（聖筊） | 同意、可以 |
| 兩平面 | 笑杯（笑筊） | 未明確回答，可重新釐清問題 |
| 兩凸面 | 哭杯（陰筊） | 不同意、不宜 |

平面稱陽面、凸面稱陰面。頁面採用使用者要求的「哭杯」稱呼，來源將此組合稱為陰筊。

## 平面生成提示詞

Use case: product-mockup. Transparent PNG game sprite for a Taiwanese jiaobei moon-block throwing animation. Exactly ONE red lacquered wooden jiaobei divination block, crescent / half-moon shape: long horizontal shape about 2:1 width to height, deep convex outer edge along bottom, shallow concave inner edge along top, two tapered rounded tips at left and right. Thick broad moon segment, NOT a skinny crescent. Orthodox traditional Taiwanese temple red wooden moon block. Orthographic camera directly above, object horizontal, centered in square canvas with equal margins, occupies 88 percent of width. Saturated vermilion red lacquer, subtle wood texture, realistic product lighting from upper left. Entire object visible, genuinely transparent background, no floor, no external shadow, no hands, no text, symbols, lettering, props, extra blocks or watermark. The FLAT FACE is facing camera: clearly planar smooth flat red cut surface, restrained uniform diffuse reflection, tiny beveled rim revealing thickness, no domed highlight. This is the flat yang face.

## 凸面生成提示詞

Use case: product-mockup. Transparent PNG game sprite for a Taiwanese jiaobei moon-block throwing animation. Exactly ONE red lacquered wooden jiaobei divination block, crescent / half-moon shape: long horizontal shape about 2:1 width to height, deep convex outer edge along bottom, shallow concave inner edge along top, two tapered rounded tips at left and right. Thick broad moon segment, NOT a skinny crescent. Orthodox traditional Taiwanese temple red wooden moon block. Orthographic camera directly above, object horizontal, centered in square canvas with equal margins, occupies 88 percent of width. Saturated vermilion red lacquer, subtle wood texture, realistic product lighting from upper left. Entire object visible, genuinely transparent background, no floor, no external shadow, no hands, no text, symbols, lettering, props, extra blocks or watermark. The CONVEX FACE is facing camera: clearly rounded domed red wooden back, pronounced broad curved highlight across the domed center, darker curved edges convey a bulbous curved surface. This is the convex yin face. Maintain a crescent half-moon outline, not a bowl or a bean. No flat cut surface visible.
