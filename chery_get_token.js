/**
 * 奇瑞 App 抓包获取 Token
 * 类型: Request Script
 */
try {
  const headers = $request.headers || {};
  const url = $request.url || '';
  let token = '';

  // 1. 从 Header 提取
  const auth = headers['Authorization'] || headers['authorization'] || headers['token'] || headers['access_token'];
  if (auth && typeof auth === 'string') {
    token = auth.replace(/Bearer\s+/i, '').trim();
  }

  // 2. 从 URL 提取
  if (!token && url.indexOf('access_token=') !== -1) {
    token = url.split('access_token=')[1].split('&')[0];
  }

  // 3. 保存并写入通知
  if (token && token.length > 10) {
    let oldToken = $persistentStore.read('chery_access_token');
    if (oldToken !== token) {
      $persistentStore.write(token, 'chery_access_token');
      console.log('[奇瑞抓包] 🔑 写入成功: ' + token);
      $notification.post('奇瑞 App', '🎉 Token 抓取成功', 'Token 前缀: ' + token.substring(0, 8) + '...');
    }
  }
} catch (e) {
  console.log('[奇瑞抓包] ❌ 执行异常: ' + String(e));
}

// Request 脚本必须放行原请求
$done({});
