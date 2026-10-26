#!/usr/bin/env bash
# 生成用于发布 APK 的固定签名（PKCS12）。只需运行一次。
# 用法：bash scripts/make-keystore.sh
set -euo pipefail
trap 'echo "[失败] 生成签名时出错（第 $LINENO 行）" >&2' ERR

# Git Bash 会把 /CN=... 之类的参数误当成路径转换掉，这里关掉
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

cd "$(dirname "$0")/.."
KEYSTORE_DIR="android/keystore"
KEYSTORE="$KEYSTORE_DIR/release.keystore"

if [ -f "$KEYSTORE" ]; then
  echo "签名已存在：$KEYSTORE（未覆盖）"
  echo "如需重新生成，请先备份并删除 android/keystore/ 再运行。"
  exit 0
fi

mkdir -p "$KEYSTORE_DIR"
PASS="$(openssl rand -hex 12)"

echo "生成私钥和自签名证书..."
openssl req -x509 -newkey rsa:2048 -sha256 -days 10000 -nodes \
  -keyout "$KEYSTORE_DIR/key.pem" \
  -out "$KEYSTORE_DIR/cert.pem" \
  -subj "/CN=WeChat AI Sandbox/O=Lucky"

echo "打包成 PKCS12..."
openssl pkcs12 -export \
  -in "$KEYSTORE_DIR/cert.pem" \
  -inkey "$KEYSTORE_DIR/key.pem" \
  -name wechatsandbox \
  -out "$KEYSTORE" \
  -passout "pass:$PASS"

rm -f "$KEYSTORE_DIR/key.pem" "$KEYSTORE_DIR/cert.pem"
openssl base64 -A -in "$KEYSTORE" -out "$KEYSTORE_DIR/release.keystore.base64"

cat > "$KEYSTORE_DIR/INFO.txt" <<EOF
alias: wechatsandbox
storePassword: $PASS
keyPassword: $PASS
keystore: android/keystore/release.keystore
base64: android/keystore/release.keystore.base64
EOF

echo "已生成："
echo "  $KEYSTORE"
echo "  $KEYSTORE_DIR/release.keystore.base64"
echo "  $KEYSTORE_DIR/INFO.txt"
echo
echo "请把 base64 内容和密码配置到 GitHub Secrets（见 docs/发布与更新.md），并备份整个 $KEYSTORE_DIR 目录。"
