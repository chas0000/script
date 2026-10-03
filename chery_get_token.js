/**
 * 奇瑞 App Token 自动抓取脚本 (全能版: 支持 Header + URL Query 解析)
 */
const logPrefix = '[奇瑞抓包]';

if (typeof $request !== 'undefined' &&$request) {
  let token = '';

  // 1. 优先从 URL Query 参数中提取 access_token
  if ($request.url) {
    let urlMatch = $request.url.match(/[?&]access_token=([^&]+)/i) \vert{}\vert{}$request.url.match(/[?&]token=([^&]+)/i);
    if (urlMatch && urlMatch[1]) {
      token = urlMatch[1];
      console.log(`${logPrefix} 💡 在 URL 参数中提取到 Token`);
    }
  }

  // 2. 如果 URL 中没有，再去 Request Headers 中寻找
  if (!token && $request.headers) {
    const headers = $request.headers;
    for (let key in headers) {
      const lowerKey = key.toLowerCase();
      if (['authorization', 'token', 'access_token', 'access-token', 'auth-token', 'x-auth-token'].includes(lowerKey)) {
        let rawAuth = headers[key];
        if (rawAuth) {
          token = String(rawAuth).replace(/^Bearer\s+/i, '').trim();
          console.log(`${logPrefix} 💡 在 Header [${key}] 中提取到 Token`);
          break;
        }
      }
    }
  }

  // 3. 保存 Token 至 PersistentStore
  if (token) {
    let isSaved = $persistentStore.write(token, 'chery_access_token');
    if (isSaved) {
      console.log(`${logPrefix} 🎉 成功保存 Token: ${token.substring(0, 10)}...`);
      $notification.post('奇瑞 App 抓包', '🎉 Token 自动抓取成功', `已存入 PersistentStore\n前缀: ${token.substring(0, 8)}...`);
    } else {
      console.log(`${logPrefix} ❌ Token 读取成功，但写入 PersistentStore 失败`);
    }
  } else {
    console.log(`${logPrefix} ⚠️ 未在当前请求的 URL 或 Header 中找到 Token`);
  }
}

$done({});
