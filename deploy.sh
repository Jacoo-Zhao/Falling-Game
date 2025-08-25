#!/bin/bash

# 落下方块游戏 - 快速部署脚本
# Falling Squares Game - Quick Deployment Script

echo "🎮 准备部署落下方块游戏..."
echo "🎮 Preparing to deploy Falling Squares Game..."

# 检查是否已初始化git
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
    git add .
    git commit -m "Initial commit: Falling Squares Game"
    echo "✅ Git仓库已初始化"
    
    echo ""
    echo "🔗 请按以下步骤完成部署："
    echo "1. 在GitHub上创建新仓库"
    echo "2. 复制仓库URL"
    echo "3. 运行以下命令："
    echo ""
    echo "   git remote add origin YOUR_REPO_URL"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
    echo "4. 在GitHub仓库设置中启用Pages"
    echo "5. 选择main分支作为源"
    echo ""
else
    echo "📤 推送到GitHub..."
    git add .
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
    git push
    echo "✅ 代码已推送到GitHub"
fi

echo ""
echo "🌐 其他部署选项："
echo "• Netlify: 拖拽文件夹到 netlify.com"
echo "• Vercel: 连接GitHub仓库到 vercel.com"
echo "• Surge: 运行 'npx surge' 命令"
echo ""
echo "🎯 部署完成后，您的游戏将在几分钟内上线！"
echo "🎮 享受您的落下方块游戏吧！"

