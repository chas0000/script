/**
 * 奇瑞 App Token 自动抓取脚本
 */
const logPrefix = '[奇瑞抓包]';

if (typeof $request !== 'undefined' &&$request) {
  let token = '';

  // 1. 优先从 URL Query 参数中提取 access_token / token
  if ($request.url) {
    let urlMatch = $request.url.match(/[?&]access_token=([^&]+)/i) \vert{}\vert{}$request.url.match(/[?&]token=([^&]+)/i);
    if (urlMatch && urlMatch[1]) {
      token = urlMatch[1];
      console.log(`${logPrefix} 💡 从 URL 参数中提取到 Token`);
    }
  }

  // 2. 若 URL 中无 Token，再去 Request Headers 中寻找
  if (!token && $request.headers) {
    const headers = $request.headers;
    for (let key in headers) {
      const lowerKey = key.toLowerCase();
      if (['authorization', 'token', 'access_token', 'access-token', 'auth-token', 'x-auth-token'].includes(lowerKey)) {
        let rawAuth = headers[key];
        if (rawAuth) {
          token = String(rawAuth).replace(/^Bearer\s+/i, '').trim();
          console.log(`${logPrefix} 💡 从 Header [${key}] 中提取到 Token`);
          break;
        }
      }
    }
  }

  // 3. 持久化保存 Token
  if (token) {
    let isSaved = $persistentStore.write(token, 'chery_access_token');
    if (isSaved) {
      console.log(`${logPrefix} 🎉 成功保存 Token: ${token.substring(0, 10)}...`);
      $notification.post('奇瑞 App 抓包', '🎉 Token 自动抓取成功', `前缀: ${token.substring(0, 8)}...\n已成功写入 PersistentStore！`);
    } else {
      console.log(`${logPrefix} ❌ Token 提取成功，但写入 PersistentStore 失败`);
    }
  } else {
    console.log(`${logPrefix} ⚠️ 未在当前请求的 URL 或 Header 中找到有效 Token`);
  }
}

$done({});
