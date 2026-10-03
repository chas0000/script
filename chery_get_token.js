/**
 * 奇瑞 App Token 自动抓取脚本 (增强日志版)
 */
const logPrefix = '[奇瑞抓包]';
console.log(`${logPrefix} 触发请求: ${$request.url}`);

if ($request &&$request.headers) {
  // 兼顾大小写和各种 Token 传递方式
  let headers = $request.headers;
  let auth = headers['Authorization'] || headers['authorization'] || headers['token'] || headers['access_token'];

  if (auth) {
    // 过滤 Bearer 前缀
    let token = auth.replace(/^Bearer\s+/i, '').trim();
    
    // 保存至 PersistentStore
    $persistentStore.write(token, 'chery_access_token');
    console.log(`${logPrefix} 🎉 成功抓取并保存 Token: ${token.substring(0, 10)}...`);
    
    $notification.post('奇瑞 App 抓包', '🎉 Token 抓取成功', `前缀: ${token.substring(0, 8)}...\n已成功写入 Loon 本地存储！`);
  } else {
    console.log(`${logPrefix} ⚠️ 请求未包含 Authorization 请求头`);
  }
}

// 请求拦截必须返回 $done({})$done({});
