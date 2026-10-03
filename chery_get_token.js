/**
 * 奇瑞 App Token 自动抓取脚本 (彻底修复版)
 */
const logPrefix = '[奇瑞抓包]';

if (typeof $request !== 'undefined' && $request &&$request.headers) {
  console.log(`${logPrefix} 触发请求: ${$request.url}`);
  
  // 兼顾所有大小写与可能用到的自定义 Header 字段
  const headers = $request.headers;
  
  // 遍历寻找可能包含 Token 的属性名
  let rawAuth = '';
  for (let key in headers) {
    const lowerKey = key.toLowerCase();
    if (['authorization', 'token', 'access_token', 'access-token', 'auth-token', 'x-auth-token'].includes(lowerKey)) {
      rawAuth = headers[key];
      if (rawAuth) break;
    }
  }

  if (rawAuth) {
    // 过滤可能存在的 Bearer 前缀
    let token = String(rawAuth).replace(/^Bearer\s+/i, '').trim();
    
    // 成功存入 PersistentStore
    let isSaved = $persistentStore.write(token, 'chery_access_token');
    
    if (isSaved) {
      console.log(`${logPrefix} 🎉 成功抓取并保存 Token: ${token.substring(0, 10)}...`);
      $notification.post('奇瑞 App 抓包', '🎉 Token 抓取成功', `前缀: ${token.substring(0, 8)}...\n已保存至 PersistentStore`);
    } else {
      console.log(`${logPrefix} ❌ Token 抓取成功但写入 PersistentStore 失败`);
      $notification.post('奇瑞 App 抓包', '⚠️ 保存失败', 'Token 读取成功但无法写入存储');
    }
  } else {
    console.log(`${logPrefix} ⚠️ 匹配到 chery.cn 请求，但未找到有效 Auth/Token 请求头`);
  }
} else {
  console.log(`${logPrefix} ❌ 未接收到有效的 $request 对象`);
}

// 确保执行闭合回调
$done({});
