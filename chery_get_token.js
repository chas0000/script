/**
 * 奇瑞 App 定时签到脚本
 */
const logPrefix = '[奇瑞签到]';

// 1. 获取 Token：优先从 PersistentStore 读取，其次读取 Argument
let token = $persistentStore.read('chery_access_token') || '';

if (!token && typeof $argument !== 'undefined' && $argument &&$argument.manual_token) {
  token = $argument.manual_token.trim();
}

// 过滤 Bearer 前缀
token = token.replace(/^Bearer\s+/i, '').trim();

if (!token) {
  console.log(`${logPrefix} ❌ 未找到有效的 Token，请先打开奇瑞 App 进行自动抓包或在插件中设置！`);
  $notification.post('奇瑞 App 签到', '⚠️ 签到失败', '未配置 Token，请打开奇瑞 App 重新获取');
  $done();
} else {
  // 2. 发起签到请求
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

  $httpClient.get(request, function(error, response, data) {
    if (error) {
      console.log(`${logPrefix} ❌ 网络请求失败: ${error}`);
      $notification.post('奇瑞 App 签到', '❌ 请求失败', '网络连接异常');
    } else {
      try {
        let res = JSON.parse(data || '{}');
        let code = res.status || res.code;
        let msg = res.message || '未知结果';
        let resData = res.data || {};

        if (code === 200) {
          let completed = resData.todayCompleted;
          let days = resData.continualDays;

          if (completed === true) {
            $notification.post('奇瑞 App 签到', 'ℹ️ 今日已完成签到', `已连续签到 ${days !== undefined ? days : 'X'} 天！`);
          } else {
            $notification.post('奇瑞 App 签到', '🎉 签到成功', days ? `已连续签到 ${days} 天！` : '每日签到任务已完成！');
          }
        } else {
          $notification.post('奇瑞 App 签到', '⚠️ 签到未成功', msg);
        }
      } catch (e) {
        console.log(`${logPrefix} ❌ JSON 解析失败，响应内容为:\n${data}`);
        $notification.post('奇瑞 App 签到', '❌ 解析失败', '返回数据非标准 JSON');
      }
    }
    $done();
  });
}
