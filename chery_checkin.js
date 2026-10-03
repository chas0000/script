/**
 * 奇瑞 App 定时签到
 * 类型: Cron Script
 */
const logPrefix = '[奇瑞签到]';
console.log(logPrefix + ' 开始执行签到...');

let storeToken = $persistentStore.read('chery_access_token');
let argToken = typeof $argument === 'object' && $argument ? $argument.manual_token : '';
let token = storeToken || argToken;

if (!token) {
  console.log(logPrefix + ' ❌ 未找到 Token');
  $notification.post('奇瑞 App 签到', '❌ 签到中断', '未抓到 Token！请进入 App 刷新或手动填入');
  $done();
} else {
  console.log(logPrefix + ' ✅ 使用 Token: ' + String(token).substring(0, 8) + '...');
  
  const options = {
    url: 'https://mobile-consumer-sapp.chery.cn/web/event/trigger?access_token=' + token,
    timeout: 8000,
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://hybrid-sapp.chery.cn',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15',
      'Authorization': 'Bearer ' + token,
      'Referer': 'https://hybrid-sapp.chery.cn/',
      'Accept': '*/*'
    },
    body: JSON.stringify({ eventCode: 'SJ10002' })
  };

  $httpClient.post(options, function (error, response, data) {
    if (error) {
      console.log(logPrefix + ' ❌ 网络错误: ' + String(error));
      $notification.post('奇瑞 App 签到', '❌ 网络失败', String(error));
    } else {
      try {
        console.log(logPrefix + ' 📥 响应数据: ' + String(data));
        let res = JSON.parse(data || '{}');
        if (res.status === 200) {
          $notification.post('奇瑞 App 签到', '🎉 签到成功', '每日任务已完成！');
        } else {
          $notification.post('奇瑞 App 签到', '⚠️️ 签到失败', res.message || 'Token 已失效');
        }
      } catch (e) {
        $notification.post('奇瑞 App 签到', '❌ 解析失败', '返回数据格式非 JSON');
      }
    }
    $done();
  });
}
