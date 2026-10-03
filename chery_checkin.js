/**
 * 奇瑞 App 定时签到脚本 (抓包精准对齐版)
 */
const logPrefix = '[奇瑞签到]';

// 1. 读取 Token (优先 PersistentStore，其次 Argument 传参)
let token = $persistentStore.read('chery_access_token') || '';

if (!token && typeof $argument !== 'undefined' && $argument &&$argument.manual_token) {
  token = $argument.manual_token.trim();
}

// 过滤 Bearer 前缀
token = token.replace(/^Bearer\s+/i, '').trim();

if (!token) {
  console.log(`${logPrefix} ❌ 未找到有效的 Token，请先打开奇瑞 App 进行自动抓包！`);
  $notification.post('奇瑞 App 签到', '⚠️ 签到失败', '未配置 Token，请先打开奇瑞 App 获取');
  $done();
} else {
  // 2. 构造与抓包 100% 对齐的 Request 请求
  const request = {
    url: 'https://mobile-consumer-sapp.chery.cn/web/task/record/sign-in/lottery?taskCode=SIGN_IN&encryptParam=',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'encryptFlag': 'true',
      'User-Agent': 'ios/1.0.0',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Origin': 'https://hybrid-sapp.chery.cn',
      'Referer': 'https://hybrid-sapp.chery.cn/',
      'Accept-Language': 'zh-CN,zh'
    }
  };

  console.log(`${logPrefix} 🚀 发送精准匹配签到请求...`);

  // 3. 发送请求并解析结果
  $httpClient.get(request, function(error, response, data) {
    if (error) {
      console.log(`${logPrefix} ❌ 网络请求失败: ${error}`);
      $notification.post('奇瑞 App 签到', '❌ 请求失败', '网络连接异常');
    } else {
      try {
        console.log(`${logPrefix} 📥 返回数据: ${String(data)}`);
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
          $notification.post('奇瑞 App 签到', 'ℹ️️ 今日已签到', msg);
        } else {
          $notification.post('奇瑞 App 签到', '⚠️ 签到未成功', msg);
        }
      } catch (e) {
        console.log(`${logPrefix} ❌ 解析失败: ${e}`);
        $notification.post('奇瑞 App 签到', '❌ 解析失败', '返回数据非标准 JSON');
      }
    }
    $done();
  });
}
