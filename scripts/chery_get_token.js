/**
 * 奇瑞 App Token & 签到链接 自动抓取脚本
 */
const logPrefix = '[奇瑞抓包]';

if (typeof $request !== 'undefined' &&$request) {
  let url = $request.url || '';
  let token = '';

  // 1. 如果匹配到签到/抽奖接口，自动把带 encryptParam 的完整 URL 存下来
  if (url.includes('/task/record/sign-in/lottery')) {
    $persistentStore.write(url, 'chery_signin_url');
    console.log(`${logPrefix} 🎉 成功捕获并保存完整签到 URL！`);
  }

  // 2. 提取 access_token (优先 URL，其次 Header)
  let urlMatch = url.match(/[?&]access_token=([^&]+)/i) || url.match(/[?&]token=([^&]+)/i);
  if (urlMatch && urlMatch[1]) {
    token = urlMatch[1];
  } else if ($request.headers) {
    const headers = $request.headers;
    for (let key in headers) {
      if (['authorization', 'token', 'access_token', 'access-token', 'auth-token'].includes(key.toLowerCase())) {
        let rawAuth = headers[key];
        if (rawAuth) {
          token = String(rawAuth).replace(/^Bearer\s+/i, '').trim();
          break;
        }
      }
    }
  }

  // 3. 保存 Token
  if (token) {
    let isSaved = $persistentStore.write(token, 'chery_access_token');
    if (isSaved) {
      console.log(`${logPrefix} 🎉 成功保存 Token: ${token.substring(0, 10)}...`);
      $notification.post('奇瑞 App 抓包', '🎉 抓包成功', '已自动更新 Token 及签到参数！');
    }
  }
}

$done({});
