# CI/CD 自動部署 (dist.zip → FTP)

當 `main` 分支 push 時，自動上傳並解壓 `dist.zip` 至指定 FTP 路徑。

## 前置準備

### 設定 GitHub Secrets

1. 進入 GitHub Repo 的設定：

  * `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

2. 加入以下 4 個 secret：

| 名稱         | 說明             |
|--------------|------------------|
| FTP_SERVER   | FTP 伺服器位址   |
| FTP_USERNAME | FTP 帳號         |
| FTP_PASSWORD | FTP 密碼         |
| DEPLOY_PATH  | 上傳路徑（可選） |

> 若未設定 `DEPLOY_PATH`，預設為 `/public_html/project-name/`
> 
> 若FTP帳號登入後就是上傳路徑，`DEPLOY_PATH` 設定「`/`」

### 設定 GitLab Variables

1. 進入 GitLab Repo 的設定：

  * `Settings` → `CI/CD` → `Variables` → `Add variables`

2. 加入變數。

> 如果使用 GitLab，也是設定一樣的變數。

## 自動上傳 FTP 流程

1. 更新 `main` 分支。
2. 抓取 `dist.zip`
3. 如果前置作業變數有設定，便會自動解壓縮並上傳到指定的 FTP

## 關閉自動上傳 FTP 功能

1. 進入 GitHub Repo 的設定：

  * `Settings` → `Actions` → `General`

2. Actions permissions 區塊，選擇選項「Disable actions」。
3. 儲存。

> 或是移除前置作業任何一個變數，也會停止自動上傳 FTP 功能。
