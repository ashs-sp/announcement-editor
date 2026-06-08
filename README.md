# 公告文件編輯系統

一個架設在 GitHub Pages 上的靜態網頁應用，用於製作學生自治機關公告文件。

## 功能特色

- 🏛️ **多機關支援** — 學生會、學生議會、選委會、行政中心
- 📋 **多範本支援** — 公告、函文、通知、決議
- 📝 **層級編號** — 支援四層縮排（一、(一)、1.、(1)）
- ✒️ **署名設定** — 僅職銜 / 職銜+姓名
- 📎 **受文者管理** — 函文正副本處理
- 📄 **多格式匯出** — PDF、Word、直接列印
- 🔖 **騎縫章** — 多頁文件騎縫戳記
- 📅 **民國日期** — 自動換算民國曆

## 開發環境

```bash
npm install
npm run dev
```

## 建置與部署

```bash
npm run build
```

將 `dist/` 目錄部署到 GitHub Pages，或透過 GitHub Actions 自動部署。

### GitHub Actions 自動部署

1. 在 Repository Settings → Pages 中設定 Source 為 "GitHub Actions"
2. 推送到 `main` 分支即可自動部署

## 資料維護

### 新增機關 (`public/data/organizations.json`)

```json
{
  "id": "your_org_id",
  "name": "機關全名",
  "shortName": "機關簡稱",
  "abbr": "縮寫",
  "docNumberEnabled": true,
  "docNumberPrefixes": ["代字一", "代字二"],
  "templateIds": ["announcement", "letter"],
  "leaders": [
    { "title": "首長職銜", "honorific": "" }
  ]
}
```

### 新增範本 (`public/data/templates.json`)

```json
{
  "id": "template_id",
  "name": "範本名稱",
  "description": "說明",
  "docType": "announcement",
  "hasRecipients": false,
  "blocks": [
    {
      "id": "subject",
      "label": "主旨",
      "type": "text",
      "required": true,
      "placeholder": "提示文字"
    },
    {
      "id": "content",
      "label": "公告事項",
      "type": "numbered-list",
      "required": true
    }
  ]
}
```

## 技術架構

- **框架**：React 18 + Vite 5
- **樣式**：Tailwind CSS
- **字型**：Noto Serif TC / Noto Sans TC
- **PDF 匯出**：html2canvas + jsPDF
- **Word 匯出**：docx
- **部署**：GitHub Pages via GitHub Actions

## 目錄結構

```
src/
├── components/
│   ├── editor/      # 各編輯面板元件
│   ├── export/      # 匯出對話框
│   ├── preview/     # 文件預覽
│   └── steps/       # 流程步驟頁面
├── context/         # 全域狀態管理
├── utils/           # 工具函式
└── index.css        # 全域樣式

public/data/         # 機關與範本 JSON 資料
```
