/**
 * 奇瑞 App 签到结果解析片段
 */
try {
  console.log(logPrefix + ' 📥 响应内容: ' + String(data));
  let res = JSON.parse(data || '{}');
  let code = res.status || res.code;
  let msg = res.message || '未知结果';
  let resData = res.data || {};

  // 1. 判断是否成功
  if (code === 200) {
    // 检查返回数据中的 todayCompleted 和 continualDays
    let completed = resData.todayCompleted;
    let days = resData.continualDays;

    if (completed === true) {
      // 捕获已完成状态（无论是刚签成功，还是重复请求）
      let subTitle = 'ℹ️ 今日已完成签到';
      let detail = '已连续签到 ' + (days !== undefined ? days : 'X') + ' 天！';
      
      console.log(logPrefix + ' ' + subTitle + ' | ' + detail);
      $notification.post('奇瑞 App 签到', subTitle, detail);
    } else {
      // 签到成功的常规通知
      let subTitle = '🎉 签到成功';
      let detail = days ? '已连续签到 ' + days + ' 天！' : '每日签到任务已完成！';
      
      $notification.post('奇瑞 App 签到', subTitle, detail);
    }
  } else if (msg.includes('已签到') || msg.includes('重复') || msg.includes('今日已')) {
    // 兼容其他返回文本提示已签到的分支
    $notification.post('奇瑞 App 签到', 'ℹ️ 今日已签到', msg);
  } else {
    // 失败/Token失效分支
    $notification.post('奇瑞 App 签到', '⚠️️ 签到失败', msg);
  }
} catch (e) {
  $notification.post('奇瑞 App 签到', '❌ 解析失败', '返回数据非标准 JSON');
}
