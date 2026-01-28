let url = $request.url;
let newUrl = "oof.disk://openurl/" + encodeURIComponent(url);

$done({
  status: 302,
  headers: {
    "Location": newUrl
  }
});
