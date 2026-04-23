#!/bin/bash
set -e
cd "C:/Users/thoma/Documents/odysee-frontend-new"

# Step 1: Delete old connect() index.js files
git rm -f "ui/page/claim/internal/claimPageComponent/internal/streamClaimPage/internal/shorts/index.js"
echo "DONE: git rm shorts/index.js"

git rm -f "ui/page/claim/internal/claimPageComponent/internal/streamClaimPage/internal/videoPlayers/index.js"
echo "DONE: git rm videoPlayers/index.js"

# Step 2: Take ours for shorts/view.tsx
git checkout --ours "ui/page/claim/internal/claimPageComponent/internal/streamClaimPage/internal/shorts/view.tsx"
git add "ui/page/claim/internal/claimPageComponent/internal/streamClaimPage/internal/shorts/view.tsx"
echo "DONE: shorts/view.tsx"

# Step 3: Take ours for videoPlayers/view.tsx
git checkout --ours "ui/page/claim/internal/claimPageComponent/internal/streamClaimPage/internal/videoPlayers/view.tsx"
git add "ui/page/claim/internal/claimPageComponent/internal/streamClaimPage/internal/videoPlayers/view.tsx"
echo "DONE: videoPlayers/view.tsx"

# Step 4: Take ours for streamClaimPage/view.jsx
git checkout --ours "ui/page/claim/internal/claimPageComponent/internal/streamClaimPage/view.jsx"
git add "ui/page/claim/internal/claimPageComponent/internal/streamClaimPage/view.jsx"
echo "DONE: streamClaimPage/view.jsx"

# Step 5: Count remaining conflicts
REMAINING=$(git diff --name-only --diff-filter=U | wc -l)
echo "REMAINING_CONFLICTS=$REMAINING"

echo "ALL_DONE"
