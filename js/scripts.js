price_table = {
  東京都:["100", "200", "300", "400"],
  大阪府:["110", "220", "330", "440"],
  その他:["111", "222", "333", "444"]
};

// 金額テーブル初期化
let tbody_price = document.querySelector('#price_table tbody');
tbody_price.innerHTML = "";
for (var key in price_table) {
  table_html = `<tr>
  <td>${key}</td>
  `;
  for (var index in price_table[key]) {
    table_html += `<td>${price_table[key][index]}</td>`;
  }
  table_html += `</tr>`;
  tbody_price.innerHTML += table_html;
}

function get_postage(area, weight) {
  // 宛先と重さから、送料の取得
  weight = parseInt(weight, 10)
  if (isNaN(weight) || weight <= 0) {
    return "重量計算に失敗";
  }
  weight_index =  Math.ceil(weight/5) - 1;

  price_list = []
  if (/東京都/.test(area)) {
    price_list = price_table["東京都"];
  } else if (/大阪府/.test(area)) {
    price_list = price_table["大阪府"];
  } else {
    price_list = price_table["その他"];
  } 
  if (weight_index > price_list.length) {
    return "重量過多";
  }
  return price_list[weight_index];
}

function get_weight(item_type, amount) {
  // 商品名と量から、重さを取得
  if (item_type in weight_table) {
    return weight_table[item_type] * amount;
  } else {
    console.log(`${item_type}の情報がありません`);
  }
  return NaN;
}


function get_tomorrow() {
  const today = new Date()
  var yyyy = today.getFullYear();
  var mm = ('0' + (today.getMonth() + 1)).slice(-2);
  var dd = ('0' + today.getDate() + 1).slice(-2);
  return (yyyy + '-' + mm + '-' + dd);
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
  let fileResult = fileReader.result.split(/\r|\n|\r\n/);

  // 先頭行をヘッダとして格納
  let header = fileResult[0].split(',')
  for (var head in header) { // 使いそうな物は変数名らしい名前に置き換える
    if (header[head].match(/.*取引先コード \(得意先\).*/)) {
      header[head] = "supplier_code"
    } else if (header[head].match(/.*納品書番号.*/)) {
      header[head] = "delivery_slip_number"
    } else if (header[head].match(/.*出荷指定日.*/)) {
      header[head] = "shipment_date"
    } else if (header[head].match(/.*納品数.*/)) {
      header[head] = "amount"
    } else if (header[head].match(/.*積数.*/)) {
      header[head] = "volume_per_unit"
    }
  }
  // 先頭行の削除
  fileResult.shift();

  // CSVから情報を取得
  items = fileResult.map(item => {
    let datas = item.split(',');
    let result = {};
    for (const index in datas) {
      let key = header[index];
      result[key] = datas[index];
    }
    // 返却
    return result;
  });

  // テーブル初期化
  let tbody = document.querySelector('#csv_data_table tbody');
  tbody.innerHTML = "";

  //　CSVの内容を表示
  let tbody_html = "";
  let output_data = "";
  let data_by_supplier_code = {}
  tomorrow = get_tomorrow()
  for (item of items) { // 出荷指定日が今日以前の物を読み込み
    if (!item.supplier_code) { //空白行は追加しない（主に最後の空行）
      continue;
    }
    if (item.shipment_date >= tomorrow) { // 出荷指定日が明日以降なら追加しない
      continue;
    }
    if (item.supplier_code in data_by_supplier_code) {
      data_by_supplier_code[item.supplier_code][0] += item.amount * item.volume_per_unit;
      data_by_supplier_code[item.supplier_code][1].push(item.delivery_slip_number);
    } else {
      data_by_supplier_code[item.supplier_code] = [item.amount * item.volume_per_unit, [item.delivery_slip_number]];
    }
  }
  for (var key in data_by_supplier_code) {
    delivery_slip_numbers = Array.from(new Set(data_by_supplier_code[key][1])).join(";")
    tbody_html += `<tr>
      <td align="right">${key}</td>
      <td align="right">${Math.round(data_by_supplier_code[key][0]*100)/100}</td>
      <td>${delivery_slip_numbers}</td>
    </tr>`
    tbody.innerHTML = tbody_html;
    output_data += `${key},${Math.round(data_by_supplier_code[key][0]*100)/100},${delivery_slip_numbers}\n`
  }

  message.innerHTML = items.length + "件のデータを読み込みました。"
  
  // ダウンロード関連
  let bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  let blob = new Blob([bom, output_data], {'type' : 'text/csv'});

  let downloadLink = document.createElement('a');
  downloadLink.download = 'output.csv';
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.dataset.downloadurl = ['text/plain', downloadLink.download, downloadLink.href].join(':');
  downloadLink.click();
}

// ファイル読み取り失敗時
fileReader.onerror = () => {
  items = [];
  message.innerHTML = "ファイル読み取りに失敗しました。"
}
