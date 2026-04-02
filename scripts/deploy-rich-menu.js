#!/usr/bin/env node
/**
 * deploy-rich-menu.js
 *
 * LINE Rich Menu のデプロイスクリプト。
 * SVGをPNGに変換し、LINE Messaging APIへアップロードしてデフォルトリッチメニューに設定する。
 *
 * 前提ツール:
 *   npm install sharp axios form-data dotenv
 *   (SVG→PNG変換に sharp を使用)
 *
 * 使い方:
 *   node scripts/deploy-rich-menu.js
 *
 * 環境変数（.env または 環境変数として設定）:
 *   LINE_CHANNEL_ACCESS_TOKEN — LINE Messaging API のチャネルアクセストークン
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── 設定 ────────────────────────────────────────────────────────────────────
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const RICH_MENU_CONFIG_PATH = path.join(__dirname, '../scenarios/templates/rich-menus/rich-menu-config.json');
const RICH_MENU_SVG_PATH    = path.join(__dirname, '../scenarios/templates/rich-menus/rich-menu-main.svg');
const RICH_MENU_PNG_PATH    = path.join(__dirname, '../scenarios/templates/rich-menus/rich-menu-main.png');

const LINE_API_BASE = 'https://api.line.me';

// ── ユーティリティ ───────────────────────────────────────────────────────────

function lineRequest(method, path, body = null, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const isBuffer = Buffer.isBuffer(body);
    const bodyData = isBuffer ? body : (body ? Buffer.from(JSON.stringify(body)) : null);

    const options = {
      hostname: 'api.line.me',
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        'Content-Type': contentType,
        ...(bodyData ? { 'Content-Length': bodyData.length } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); }
          catch { resolve(data); }
        } else {
          reject(new Error(`LINE API Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

// ── STEP 1: SVG → PNG 変換 ───────────────────────────────────────────────────

async function convertSvgToPng() {
  console.log('📐 SVG → PNG 変換中...');
  try {
    // sharp が利用可能な場合
    const sharp = require('sharp');
    await sharp(RICH_MENU_SVG_PATH)
      .resize(2500, 1686)
      .png()
      .toFile(RICH_MENU_PNG_PATH);
    console.log(`✅ PNG 生成: ${RICH_MENU_PNG_PATH}`);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.warn('⚠️  sharp が未インストールです。');
      console.warn('   npm install sharp を実行してから再度お試しください。');
      console.warn('');
      console.warn('   または以下のコマンドで手動変換してください:');
      console.warn('   npx svgexport scenarios/templates/rich-menus/rich-menu-main.svg scenarios/templates/rich-menus/rich-menu-main.png 2500:1686');
      console.warn('   Inkscape: inkscape --export-png=rich-menu-main.png --export-width=2500 rich-menu-main.svg');
      process.exit(1);
    }
    throw e;
  }
}

// ── STEP 2: Rich Menu 作成 ───────────────────────────────────────────────────

async function createRichMenu() {
  console.log('\n📋 Rich Menu 設定を登録中...');

  const config = JSON.parse(fs.readFileSync(RICH_MENU_CONFIG_PATH, 'utf8'));

  // _comment フィールドを除去して送信（LINE APIが受け付けない）
  const cleanAreas = config.areas.map(({ _comment, ...area }) => area);
  const payload = {
    size: config.size,
    selected: config.selected,
    name: config.name,
    chatBarText: config.chatBarText,
    areas: cleanAreas,
  };

  const result = await lineRequest('POST', '/v2/bot/richmenu', payload);
  const richMenuId = result.richMenuId;
  console.log(`✅ Rich Menu 作成完了: richMenuId = ${richMenuId}`);
  return richMenuId;
}

// ── STEP 3: 画像アップロード ─────────────────────────────────────────────────

async function uploadRichMenuImage(richMenuId) {
  console.log('\n🖼  Rich Menu 画像をアップロード中...');

  if (!fs.existsSync(RICH_MENU_PNG_PATH)) {
    throw new Error(`PNG ファイルが見つかりません: ${RICH_MENU_PNG_PATH}\nまず convertSvgToPng() を実行してください。`);
  }

  const imageBuffer = fs.readFileSync(RICH_MENU_PNG_PATH);

  await lineRequest(
    'POST',
    `/v2/bot/richmenu/${richMenuId}/content`,
    imageBuffer,
    'image/png'
  );

  console.log('✅ 画像アップロード完了');
}

// ── STEP 4: デフォルト Rich Menu に設定 ─────────────────────────────────────

async function setDefaultRichMenu(richMenuId) {
  console.log('\n⚙️  デフォルト Rich Menu に設定中...');
  await lineRequest('POST', `/v2/bot/user/all/richmenu/${richMenuId}`);
  console.log(`✅ デフォルト Rich Menu 設定完了: ${richMenuId}`);
}

// ── STEP 5: 既存 Rich Menu の一覧取得（オプション）────────────────────────────

async function listRichMenus() {
  const result = await lineRequest('GET', '/v2/bot/richmenu/list');
  return result.richmenus || [];
}

// ── STEP 6: 古い Rich Menu を削除（オプション）──────────────────────────────

async function deleteRichMenu(richMenuId) {
  await lineRequest('DELETE', `/v2/bot/richmenu/${richMenuId}`);
  console.log(`🗑  削除: ${richMenuId}`);
}

// ── メイン処理 ───────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  LINE Rich Menu デプロイスクリプト');
  console.log('  不動産丸投げ集客サービス');
  console.log('='.repeat(60));

  if (!CHANNEL_ACCESS_TOKEN) {
    console.error('❌ エラー: LINE_CHANNEL_ACCESS_TOKEN が設定されていません。');
    console.error('   .env ファイルまたは環境変数を確認してください。');
    process.exit(1);
  }

  try {
    // 既存の Rich Menu を確認
    console.log('\n📋 既存の Rich Menu を確認中...');
    const existing = await listRichMenus();
    if (existing.length > 0) {
      console.log(`   既存の Rich Menu: ${existing.length} 件`);
      existing.forEach((m) => console.log(`   - ${m.richMenuId}: ${m.name}`));
    } else {
      console.log('   既存の Rich Menu はありません。');
    }

    // SVG → PNG 変換
    await convertSvgToPng();

    // Rich Menu 作成
    const richMenuId = await createRichMenu();

    // 画像アップロード
    await uploadRichMenuImage(richMenuId);

    // デフォルト設定
    await setDefaultRichMenu(richMenuId);

    // 古い Rich Menu を削除（任意）
    if (existing.length > 0 && process.argv.includes('--clean')) {
      console.log('\n🗑  古い Rich Menu を削除中...');
      for (const menu of existing) {
        await deleteRichMenu(menu.richMenuId);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('  ✅ デプロイ完了！');
    console.log(`  Rich Menu ID: ${richMenuId}`);
    console.log('  LINE アプリでリッチメニューを確認してください。');
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\n❌ デプロイ失敗:', err.message);
    process.exit(1);
  }
}

main();
