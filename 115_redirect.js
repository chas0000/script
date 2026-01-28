// 获取原始请求 URL
let url = $request.url;

// 对 URL 进行 encodeURIComponent
let encoded = encodeURIComponent(url);

// 拼接成 oof.disk scheme
let newUrl = "oof.disk://openurl/" + encoded;

// 返回 302 跳转
$done({
  status: 302,
  headers: {
    "Location": newUrl
  }
});
