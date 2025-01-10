#!/usr/bin/env sh

# 遇到錯誤時退出腳本
set -e

# 打包
npm run build

# 進入打包輸出的目錄
cd dist

# 如果是自訂網域，取消註解下面一行，並將 example.com 替換為你的網域
# echo 'www.example.com' > CNAME

# 避免 Jekyll 處理 GitHub Pages 的靜態文件
echo > .nojekyll

# 初始化 Git 儲存庫
git init
git checkout -b main

# 將變更新增到 Git 暫存區
git add -A
git commit -m 'deploy'

# 推送到 gh-pages 分支，請將 <USERNAME> 和 <REPO> 替換為你的 GitHub 用戶名和儲存庫名稱
git push -f git@github.com:yozuwork/YozuManga.git main:gh-pages

# 返回上層目錄
cd -
