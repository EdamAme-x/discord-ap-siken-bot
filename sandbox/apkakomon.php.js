import { createHash } from "crypto";

fetch("https://www.ap-siken.com/apkakomon.php", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ja-JP,ja;q=0.9,ar-SS;q=0.8,ar;q=0.7,en-US;q=0.6,en;q=0.5,ko-KR;q=0.4,ko;q=0.3",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded",
      "pragma": "no-cache",
      "priority": "u=0, i",
      "sec-ch-ua": "\"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"144\", \"Google Chrome\";v=\"144\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "Referer": "https://www.ap-siken.com/apkakomon.php"
    },
    "body": (() => {
      const params = new URLSearchParams();
      const sid = createHash("sha256").update(Date.now().toString()).digest("hex");
      const bodyData = {
        times: ["07_aki", "07_haru", "06_aki", "06_haru", "05_aki", "05_haru", "04_aki", "04_haru", "03_aki", "03_haru", "02_aki", "01_aki", "31_haru", "30_aki", "30_haru", "29_aki", "29_haru", "28_aki", "28_haru", "27_aki", "27_haru", "26_aki", "26_haru", "25_aki", "25_haru", "24_aki", "24_haru", "23_aki", "23_toku", "22_aki", "22_haru", "21_aki", "21_haru", "20_aki"],
        fields: ["te_all", "ma_all", "st_all"],
        categories: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        moshi: "mix_all",
        moshi_cnt: 40,
        options: ["random", "showComment", "noQuestion"],
        addition: 0,
        mode: 1,
        qno: 0,
        sid,
        _q: "",
        _r: "",
        _c: "",
        result: -1,
        startTime: ""
      };
      
      bodyData.times.forEach(time => params.append("times[]", time));
      bodyData.fields.forEach(field => params.append("fields[]", field));
      bodyData.categories.forEach(category => params.append("categories[]", category.toString()));
      bodyData.options.forEach(option => params.append("options[]", option));
      params.append("moshi", bodyData.moshi);
      params.append("moshi_cnt", bodyData.moshi_cnt.toString());
      params.append("addition", bodyData.addition.toString());
      params.append("mode", bodyData.mode.toString());
      params.append("qno", bodyData.qno.toString());
      params.append("sid", bodyData.sid);
      params.append("_q", bodyData._q);
      params.append("_r", bodyData._r);
      params.append("_c", bodyData._c);
      params.append("result", bodyData.result.toString());
      params.append("startTime", bodyData.startTime);
      
      return params.toString();
    })(),
    "method": "POST"
  }).then(response => response.text()).then(data => {
    console.log(data);
  });