import "../scss/styles.scss";
import { Offcanvas, Dropdown } from "bootstrap";

(() => {
  const VALUES = {
    _100: { disp: "100s", value: 10000 },
    _50: { disp: "50s", value: 5000 },
    _20: { disp: "20s", value: 2000 },
    _10: { disp: "10s", value: 1000 },
    _5: { disp: "5s", value: 500 },
    _1: { disp: "1s", value: 100 },
    _qtr: { disp: "Qtr", value: 25, change: true },
    _dim: { disp: "Dim", value: 10, change: true },
    _nik: { disp: "Nic", value: 5, change: true },
    _pen: { disp: "Pen", value: 1, change: true },
    change: { disp: "Change", noValue: true },
    total: { disp: "Total", noValue: true },
  };
  const KEYS = Object.keys(VALUES).filter((key) => !VALUES[key].noValue);
  const CHANGE_KEYS = Object.keys(VALUES).filter((key) => VALUES[key].change);
  const depo = {};
  const draw = {};
  let inputTotals = 0;
  let history = [];

  const populateInputs = () => {
    let html = "";
    KEYS.forEach((key) => {
      html += `
    <div class="input-group mb-3">
      <span class="input-group-text">${VALUES[key].disp}</span>
      <input id="${key}"type="number" min="0" class="form-control" value="${qty[key] ? qty[key] : 0}"/>
    </div>`;
    });
    document.getElementById("inputs").innerHTML = html;
    updateValues();

    if (qty.time) {
      document.getElementById("timestamp").innerText = `History: ${qty.time}`;
      calcAmts();
      genOutput();
    }
  };

  const genOutput = () => {
    const generateTable = (title, data) => {
      let html = `
    <div class="col-5 output text-dark bg-light rounded p-2 ">
      <h4>${title}</h4>
      <table class="table table-bordered table-striped">
        <tbody>`;
      for (let key in VALUES) {
        html += `<tr>
                <td scope="row">${VALUES[key].disp}</th>
                <td>${data[key]}</td>
              </tr>`;
      }
      return html + `</table></div>`;
    };
    document.getElementById("output").innerHTML = generateTable("Deposit", depo) + generateTable("Drawer", draw);
  };

  const sumKeys = (data, keys) => {
    let total = 0;
    keys.forEach((key) => {
      total += data[key] * VALUES[key].value;
    });
    return total;
  };

  const updateValues = () => {
    let total = 0;
    KEYS.forEach((key) => {
      const val = document.getElementById(key).value;
      qty[key] = val > 0 ? parseInt(val) : 0;
    });
    inputTotals = sumKeys(qty, KEYS);
    document.getElementById("total").innerText = (inputTotals / 100).toFixed(2);
  };

  const calcAmts = () => {
    const depositTotal = inputTotals - drawer_amount;
    let total = 0;

    for (let key in VALUES) {
      depo[key] = 0;
      for (let i = qty[key]; i > 0; i--) {
        if (total + VALUES[key].value > depositTotal) break;
        total += VALUES[key].value;
        depo[key] += 1;
      }
      draw[key] = qty[key] - depo[key];
    }

    [depo, draw].forEach((val) => {
      val.change = (sumKeys(val, CHANGE_KEYS) / 100).toFixed(2);
      val.total = (sumKeys(val, KEYS) / 100).toFixed(2);
    });
  };

  const getHistory = () => {
    history = localStorage.history ? JSON.parse(localStorage.history) : [];
    return history;
  };

  const updateHistory = () => {
    const date = new Date();
    const getTime = () => {
      let hour = date.getHours();
      let minute = date.getMinutes();
      let second = date.getSeconds();
      const pm = hour >= 12 ? true : false;
      hour = hour % 12;
      hour = hour ? hour : 12;
      minute = minute < 10 ? "0" + minute : minute;
      second = second < 10 ? "0" + second : second;

      const time = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + " @ " + hour + ":" + minute + ":" + second + (pm ? " PM" : " AM");
      return time;
    };

    qty.time = getTime();
    let history = getHistory();
    history.push(qty);
    localStorage.history = JSON.stringify(history);
  };

  const useHistory = (e) => {
    localStorage.qty = JSON.stringify(history[e.target.dataset.index]);
    location.reload();
  };

  const deleteHistory = () => {
    delete localStorage.history;
    HISTORY_LIST.innerHTML = "No history";
  };

  const setDrawerAmount = (e) => {
    localStorage.drawerAmount = e.target.value;
  };

  const update = () => {
    updateValues();
    localStorage.qty = JSON.stringify(qty);
  };

  const submit = () => {
    calcAmts();
    genOutput();
    updateHistory();
    window.scrollBy(0, window.innerHeight);
  };

  const reset = () => {
    delete localStorage.qty;
    location.reload();
  };

  const populateHistory = () => {
    const history = getHistory();
    if (!history.length) {
      return;
    }
    let html = "";
    history.forEach((el, i) => {
      html = `<li class="list-group-item" role="button" data-index="${i}">${el.time}</li>` + html;
    });
    HISTORY_LIST.innerHTML = html;
  };

  const drawer_amount = (() => {
    const amt = parseInt(localStorage.drawerAmount ? localStorage.drawerAmount * 100 : 10000);
    document.getElementById("drawer-amount").value = (amt / 100).toFixed(2);
    return amt;
  })();

  const qty = (() => {
    return localStorage.qty ? JSON.parse(localStorage.qty) : {};
  })();

  document.getElementById("reset").addEventListener("click", reset);
  document.getElementById("drawer-amount").addEventListener("input", setDrawerAmount);
  document.getElementById("inputs").addEventListener("input", update);
  document.getElementById("submit").addEventListener("click", submit);
  document.getElementById("history-btn").addEventListener("click", populateHistory);
  const HISTORY_LIST = document.getElementById("history-list");
  HISTORY_LIST.addEventListener("click", useHistory);
  document.getElementById("delete-history").addEventListener("click", deleteHistory);

  populateInputs();
})();
