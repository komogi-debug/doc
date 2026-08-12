# 公文小老師｜GitHub Pages 版

這是可直接部署到 GitHub Pages 的靜態版。它只使用 HTML、CSS 與 JavaScript，不需要 Python 或伺服器。

## 部署方式

1. 建立一個 GitHub repository。
2. 將本資料夾內的 `index.html`、`app.js`、`styles.css`、`.nojekyll` 上傳到 repository 根目錄。
3. 到 repository 的 **Settings → Pages**。
4. 在 **Build and deployment** 的 **Source** 選擇 **Deploy from a branch**。
5. 選擇 `main` 分支與 `/(root)` 資料夾後儲存。
6. 等待 GitHub Pages 建置完成，再開啟 GitHub 顯示的網址。

GitHub Pages 對專案網站的網址通常是：

`https://你的帳號.github.io/你的repository名稱/`

## 重要提醒

- 這個版本在使用者瀏覽器內做規則式分析，不會把公文內容送到本機器人後端。
- 目前支援貼上文字與 `.txt`／`.md`，尚未支援 PDF、Word、掃描 OCR。
- 目前沒有登入、權限管理與資料庫，不建議放置機密或含個資的正式公文。
- 回覆草稿仍須由承辦人與主管確認，不能直接當成正式發文。
