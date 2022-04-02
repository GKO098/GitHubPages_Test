price_table = {
  東京都:["0", "150", "280", "400", "500"],
  大阪府:["0", "200", "390", "580", "760"],
  その他:["0", "350", "700", "1000", "1750"]
};



// 金額テーブル初期化
let tbody_price = document.querySelector('#price_table tbody');
tbody_price.innerHTML = "";
for (var key in price_table){
  tbody_price.innerHTML += `<tr>
  <td>${key}</td>
  <td>${price_table[key][1]}</td>
  <td>${price_table[key][2]}</td>
  <td>${price_table[key][3]}</td>
  <td>${price_table[key][4]}</td>
  <td>${price_table[key][5]}</td>
</tr>
`
}


function get_area_and_price(area, amount) {
  amount = parseInt(amount, 10)
  if (isNaN(amount)) {
    return "数量の解釈に失敗しました";
  }

  price_list = []
  if (/東京都/.test(area)) {
    price_list = price_table["東京都"];
  } else if (/大阪府/.test(area)) {
    price_list = ["0", "200", "390", "580", "760"];
  } else {
    price_list = ["0", "350", "700", "1000", "1750"];
  } 
  return price_list[amount];
}

let fileInput = document.getElementById('csv_file');
let message = document.getElementById('message');
let fileReader = new FileReader();

// ファイル変更時イベント
fileInput.onchange = () => {
  message.innerHTML = "読み込み中..."

  let file = fileInput.files[0];
  // CSVファイルかを確認
  if (file.type != 'text/csv') {
    message.innerHTML = "CSVファイルを選択してください。";
    return;
  }
  fileReader.readAsText(file);
};

// ファイル読み込み時
let items = [];
fileReader.onload = () => {
  // ファイル読み込み
  let fileResult = fileReader.result.split('\r\n');

  // 先頭行をヘッダとして格納
  let header = fileResult[0].split(',')
  // 先頭行の削除
  fileResult.shift();

  // CSVから情報を取得
  items = fileResult.map(item => {
    let datas = item.split(',');
    datas.push("postage")
    let result = {};
    for (const index in datas) {
      let key = header[index];
      result[key] = datas[index];
    }
    // 送料の計算
    result["postage"] = result["amount1"] * 100 + result["amount2"] * 10;

    // 返却
    return result;
  });

  // テーブル初期化
  let tbody = document.querySelector('#csv_data_table tbody');
  tbody.innerHTML = "";

  //　CSVの内容を表示
  let tbody_html = "";
  let output_data = "";
  for (item of items) {
    item.test_output = get_area_and_price(item.address, item.amount1)
    tbody_html += `<tr>
        <td>${item.id}</td>
        <td>${item.date}</td>
        <td>${item.customer}</td>
        <td>${item.address}</td>
        <td>${item.item1}</td>
        <td>${item.amount1}</td>
        <td>${item.item2}</td>
        <td>${item.amount2}</td>
        <td>${item.postage}</td>
        <td>${item.test_output}</td>
      </tr>
      `
      output_data += `${item.id},${item.date},${item.customer},${item.address},${item.item1},${item.amount1},${item.item2},${item.amount2},${item.postage},${item.test_output}\n`
  }
  tbody.innerHTML = tbody_html;

  message.innerHTML = items.length + "件のデータを読み込みました。"
  
  // ダウンロード関連
  let bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  let blob = new Blob([bom, output_data], {'type' : 'text/csv'});

  let downloadLink = document.createElement('a');
  downloadLink.download = 'sample.csv';
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.dataset.downloadurl = ['text/plain', downloadLink.download, downloadLink.href].join(':');
  downloadLink.click();
}

// ファイル読み取り失敗時
fileReader.onerror = () => {
  items = [];
  message.innerHTML = "ファイル読み取りに失敗しました。"
}
