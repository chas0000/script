/**
 * 奇瑞 App 定时签到脚本 (动态参数版)
 */
const logPrefix = '[奇瑞签到]';

// 1. 读取 Token 与 抓取的完整 URL
let token = $persistentStore.read('chery_access_token') || '';
let signinUrl = $persistentStore.read('chery_signin_url') || '';

if (!token && typeof $argument !== 'undefined' && $argument &&$argument.manual_token) {
  token = $argument.manual_token.trim();
}

token = token.replace(/^Bearer\s+/i, '').trim();

// 如果没抓到完整 URL，使用带 taskCode 的保底 URL
if (!signinUrl) {
  signinUrl = 'https://mobile-consumer-sapp.chery.cn/web/task/record/sign-in/lottery?taskCode=SIGN_IN';
}

if (!token) {
  console.log(`${logPrefix} ❌ 未找到有效 Token，请重新打开奇瑞 App 进行抓包！`);
  $notification.post('奇瑞 App 签到', '⚠️ 签到失败', '未找到 Token，请打开奇瑞 App 刷新');
  $done();
} else {
  // 2. 构造完整的请求
  const request = {
    url: signinUrl,
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

  console.log(`${logPrefix} 🚀 正在发起签到请求...`);

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
