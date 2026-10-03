/**
 * 奇瑞 App 定时签到脚本 (完整请求版)
 */
const logPrefix = '[奇瑞签到]';

// 1. 读取 Token (优先 PersistentStore，其次 Argument 传参)
let token = $persistentStore.read('chery_access_token') || '';

if (!token && typeof $argument !== 'undefined' && $argument &&$argument.manual_token) {
  token = $argument.manual_token.trim();
}

// 过滤可能带有的 Bearer 前缀
token = token.replace(/^Bearer\s+/i, '').trim();

if (!token) {
  console.log(`${logPrefix} ❌ 未找到有效的 Token，请先打开奇瑞 App 进行自动抓包！`);
  $notification.post('奇瑞 App 签到', '⚠️ 签到失败', '未配置 Token，请先打开奇瑞 App 获取');
  $done();
} else {
  // 2. 构造签到目标 URL 与 Request 请求对象
  const request = {
    url: 'https://mobile-consumer-sapp.chery.cn/web/task/record/sign-in/lottery?encryptParam=',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      'Content-Type': 'application/json;charset=UTF-8',
      'Origin': 'https://hybrid-sapp.chery.cn',
      'Referer': 'https://hybrid-sapp.chery.cn/'
    }
  };

  console.log(`${logPrefix} 🚀 正在发送签到请求至: ${request.url}`);

  // 3. 使用 $httpClient 发送请求
  $httpClient.get(request, function(error, response, data) {
    if (error) {
      console.log(`${logPrefix} ❌ 网络请求出错: ${error}`);
      $notification.post('奇瑞 App 签到', '❌ 请求失败', '网络连接异常');
    } else {
      try {
        console.log(`${logPrefix} 📥 响应数据: ${String(data)}`);
        let res = JSON.parse(data || '{}');
        let code = res.status || res.code;
        let msg = res.message || '未知结果';
        let resData = res.data || {};

        if (code === 200) {
          let completed = resData.todayCompleted;
          let days = resData.continualDays;

          if (completed === true) {
            let subTitle = 'ℹ️ 今日已完成签到';
            let detail = '已连续签到 ' + (days !== undefined ? days : 'X') + ' 天！';
            console.log(`${logPrefix} ${subTitle} | ${detail}`);
            $notification.post('奇瑞 App 签到', subTitle, detail);
          } else {
            let subTitle = '🎉 签到成功';
            let detail = days ? '已连续签到 ' + days + ' 天！' : '每日签到任务已完成！';
            $notification.post('奇瑞 App 签到', subTitle, detail);
          }
        } else if (msg.includes('已签到') || msg.includes('重复') || msg.includes('今日已')) {
          $notification.post('奇瑞 App 签到', 'ℹ️ 今日已签到', msg);
        } else {
          $notification.post('奇瑞 App 签到', '⚠️ 签到未成功', msg);
        }
      } catch (e) {
        console.log(`${logPrefix} ❌ JSON 解析失败，原始响应为:\n${data}`);
        $notification.post('奇瑞 App 签到', '❌ 解析失败', '返回数据非标准 JSON');
      }
    }
    // 异步回调执行完毕，闭合脚本
    $done();
  });
}
