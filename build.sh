#!/usr/bin/env bash
# Construit l'APK signé : dist/KetoFamille.apk
# Prérequis : Java 17+ et Python 3 (aucun SDK Android nécessaire).
set -euo pipefail
cd "$(dirname "$0")"

KS=signing/ketofamille.keystore
PASS=ketofamille
mkdir -p dist build signing

if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass "$PASS" -keypass "$PASS" \
    -alias ketofamille -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Keto Famille, O=Famille, C=MA" >/dev/null 2>&1
fi

python3 tools/make_icon.py app --style k-feuilles >/dev/null
java -jar tools/bin/apktool.jar b app -o build/unsigned.apk 2>&1 | grep -E '^(I|W|E):' || true
python3 tools/zipalign.py build/unsigned.apk build/aligned.apk
java -jar tools/bin/apksigner.jar sign --ks "$KS" --ks-pass "pass:$PASS" \
  --ks-key-alias ketofamille --min-sdk-version 24 \
  --out dist/KetoFamille.apk build/aligned.apk
java -jar tools/bin/apksigner.jar verify --verbose dist/KetoFamille.apk | head -6
rm -f dist/KetoFamille.apk.idsig
echo "APK prêt : dist/KetoFamille.apk ($(du -h dist/KetoFamille.apk | cut -f1))"
