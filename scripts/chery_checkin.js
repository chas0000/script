/**
 * 奇瑞 App 定时签到脚本 (先查后签版)
 */
const logPrefix = '[奇瑞签到]';

// 1. 读取保存的 Token
let token = $persistentStore.read('chery_access_token') || '';

if (!token && typeof $argument !== 'undefined' && $argument &&$argument.manual_token) {
  token = $argument.manual_token.trim();
}

token = token.replace(/^Bearer\s+/i, '').trim();

if (!token) {
  console.log(`${logPrefix} ❌ 未找到有效 Token，请重新打开奇瑞 App 进行抓包！`);
  $notification.post('奇瑞 App 签到', '⚠️ 签到失败', '未找到 Token，请先打开奇瑞 App 刷新');
  $done();
} else {
  // 开始第一步：先检查签到状态
  checkStatusAndSign(token);
}

/**
 * 第一步：检查是否已经签到
 */
function checkStatusAndSign(token) {
  let signinUrl = $persistentStore.read('chery_signin_url') || '';
  if (!signinUrl) {
    signinUrl = 'https://mobile-consumer-sapp.chery.cn/web/task/record/sign-in/lottery?taskCode=SIGN_IN';
  }

  const queryRequest = {
    url: signinUrl,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'encryptFlag': 'true',
      'User-Agent': 'ios/1.0.0',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Origin': 'https://hybrid-sapp.chery.cn',
      'Referer': 'https://hybrid-sapp.chery.cn/'
    }
  };

  console.log(`${logPrefix} 🔍 正在查询今日签到状态...`);

  $httpClient.get(queryRequest, function(error, response, data) {
    if (error) {
      console.log(`${logPrefix} ❌ 查询状态失败: ${error}`);
      $notification.post('奇瑞 App 签到', '❌ 查询失败', '网络连接异常');
      $done();
      return;
    }

    try {
      let res = JSON.parse(data || '{}');
      let code = res.status || res.code;
      let resData = res.data || {};

      if (code === 200) {
        let completed = resData.todayCompleted;
        let days = resData.continualDays;

        if (completed === true) {
          // 条件满足：今日已签到，直接终止并通知
          console.log(`${logPrefix} ℹ️ 今日已完成签到，无需重复触发！连续签到 ${days} 天。`);
          $notification.post('奇瑞 App 签到', 'ℹ️ 今日已签到', `已连续签到 ${days !== undefined ? days : 'X'} 天，无需重复签到`);
          $done();
        } else {
          // 条件满足：今日未签到，发起 POST 触发签到
          console.log(`${logPrefix} 💡 今日尚未签到，准备发起 POST 签到触发...`);
          doPostCheckin(token);
        }
      } else {
        console.log(`${logPrefix} ⚠️ 状态接口返回异常: ${res.message || '未知错误'}`);
        // 查询失败时备用方案：尝试直接 POST 签到
        doPostCheckin(token);
      }
    } catch (e) {
      console.log(`${logPrefix} ❌ 解析状态失败: ${e}，尝试直接触发 POST...`);
      doPostCheckin(token);
    }
  });
}

/**
 * 第二步：发起 POST 触发签到事件
 */
function doPostCheckin(token) {
  const triggerRequest = {
    url: `https://mobile-consumer-sapp.chery.cn/web/event/trigger?access_token=${token}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Origin': 'https://hybrid-sapp.chery.cn',
      'Referer': 'https://hybrid-sapp.chery.cn/',
      'User-Agent': 'ios/1.0.0',
      'Accept-Language': 'zh-CN,zh'
    },
    body: JSON.stringify({ eventCode: 'SJ10002' })
  };

  console.log(`${logPrefix} 🚀 发起 POST 签到请求...`);

  $httpClient.post(triggerRequest, function(error, response, data) {
    if (error) {
      console.log(`${logPrefix} ❌ POST 请求失败: ${error}`);
      $notification.post('奇瑞 App 签到', '❌ 签到失败', '网络请求失败');
      $done();
      return;
    }

    try {
      console.log(`${logPrefix} 📥 POST 响应数据: ${String(data)}`);
      let res = JSON.parse(data || '{}');
      let code = res.status || res.code;
      let msg = res.message || '未知结果';

      if (code === 200) {
        console.log(`${logPrefix} 🎉 签到触发成功！更新最新签到数据...`);
        // 延迟 1 秒二次确认最新连续天数
        setTimeout(() => {
          queryFinalDays(token);
        }, 1000);
      } else if (msg.includes('重复') || msg.includes('已签到') || msg.includes('频繁')) {
        $notification.post('奇瑞 App 签到', 'ℹ️ 今日已签到', msg);
        $done();
      } else {
        $notification.post('奇瑞 App 签到', '⚠️ 签到未成功', msg);
        $done();
      }
    } catch (e) {
      console.log(`${logPrefix} ❌ POST 响应解析失败: ${e}`);
      $notification.post('奇瑞 App 签到', '❌ 解析失败', '返回数据格式异常');
      $done();
    }
  });
}

/**
 * 第三步：签到成功后，获取最新的连续签到天数并推送
 */
function queryFinalDays(token) {
  let signinUrl = $persistentStore.read('chery_signin_url') || '';
  if (!signinUrl) {
    signinUrl = 'https://mobile-consumer-sapp.chery.cn/web/task/record/sign-in/lottery?taskCode=SIGN_IN';
  }

  const queryRequest = {
    url: signinUrl,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'encryptFlag': 'true',
      'User-Agent': 'ios/1.0.0',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Origin': 'https://hybrid-sapp.chery.cn',
      'Referer': 'https://hybrid-sapp.chery.cn/'
    }
  };

  $httpClient.get(queryRequest, function(error, response, data) {
    if (!error && data) {
      try {
        let res = JSON.parse(data);
        let days = res.data ? res.data.continualDays : undefined;
        let detail = days !== undefined ? `已连续签到 ${days} 天！` : '签到任务已完成！';
        $notification.post('奇瑞 App 签到', '🎉 签到成功', detail);
      } catch (e) {
        $notification.post('奇瑞 App 签到', '🎉 签到成功', '签到任务已完成！');
      }
    } else {
      $notification.post('奇瑞 App 签到', '🎉 签到成功', '签到任务已完成！');
    }
    $done();
  });
}
