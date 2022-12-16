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

  // array of keys that are related to the transaction, disregards keys related to history
  const KEYS = Object.keys(VALUES).filter((key) => !VALUES[key].noValue);

  // array of keys that coorespond to coins
  const CHANGE_KEYS = Object.keys(VALUES).filter((key) => VALUES[key].change);

  // objects that holds values that should be in deposit and in drawer
  const deposit = {};
  const drawer = {};

  // sets the amount to be kept in the drawer. Initializes from localstorage value or defaults to $100
  let drawer_amount = (() => {
    const amt = parseInt(localStorage.drawerAmount ? localStorage.drawerAmount * 100 : 10000);
    document.getElementById("drawer-amount").value = (amt / 100).toFixed(2);
    return amt;
  })();

  // holds all bill quantities. Initializes from localstorage value or defaults to an empty object
  const qty = (() => {
    return localStorage.qty ? JSON.parse(localStorage.qty) : {};
  })();

  // retrieves history from localstorage or initializes to an empty array
  const history = localStorage.history ? JSON.parse(localStorage.history) : [];

  // saves total of all inputs
  let inputTotals = 0;

  // generates HTML for all input fields and appends to "inputs" <div>
  const populateInputs = () => {
    let html = "";
    // Creates each input field per key. Sets value to qty value or 0
    KEYS.forEach((key) => {
      html += `
    <div class="input-group mb-3">
      <span class="input-group-text">${VALUES[key].disp}</span>
      <input id="${key}"type="number" min="0" class="form-control" value="${qty[key] ? qty[key] : 0}"/>
    </div>`;
    });
    document.getElementById("inputs").innerHTML = html;
    updateValues();

    // if qty has a time property that means it was retrieved from history. Displays the timestamp on page, calculates transaction and generates output. Does not save this transaction to history.
    if (qty.time) {
      document.getElementById("timestamp").innerText = `History: ${qty.time}`;
      calcAmts();
      genOutput();
    }
  };

  // generates HTML for the output values of the transaction and appends to the "output" <div>
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
    document.getElementById("output").innerHTML = generateTable("Deposit", deposit) + generateTable("Drawer", drawer);
  };

  // returns sum of selected keys from the passed data
  const sumKeys = (data, keys) => {
    let total = 0;
    keys.forEach((key) => {
      total += data[key] * VALUES[key].value;
    });
    return total;
  };

  // updates qty object with the current input values, then sets inputTotals to the sum of all inputs
  const updateValues = () => {
    let total = 0;
    KEYS.forEach((key) => {
      const val = document.getElementById(key).value;
      qty[key] = val > 0 ? parseInt(val) : 0;
    });
    inputTotals = sumKeys(qty, KEYS);
    document.getElementById("total").innerText = (inputTotals / 100).toFixed(2);
  };

  // calculates the total deposit amount
  const calcAmts = () => {
    const depositTotal = inputTotals - drawer_amount;
    let total = 0;

    for (let key in VALUES) {
      deposit[key] = 0;
      for (let i = qty[key]; i > 0; i--) {
        if (total + VALUES[key].value > depositTotal) break;
        total += VALUES[key].value;
        deposit[key] += 1;
      }
      drawer[key] = qty[key] - deposit[key];
    }

    // add change and total propertys to deposit and drawer objects.
    [deposit, drawer].forEach((val) => {
      val.change = (sumKeys(val, CHANGE_KEYS) / 100).toFixed(2);
      val.total = (sumKeys(val, KEYS) / 100).toFixed(2);
    });
  };

  // Adds the current time and a random color to the qty object then pushes that qty object to history and saves history to localstorage
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
    qty.color = (() => {
      const h = Math.floor(Math.random() * 24) * 15;
      return `hsl(${h},60%,70%)`;
    })();

    history.push(qty);
    localStorage.history = JSON.stringify(history);
  };

  // use history click handler. When a history is clicked, sets qty values to be those stored in the target history index and reloads the page.
  const useHistory = (e) => {
    localStorage.qty = JSON.stringify(history[e.target.dataset.index]);
    location.reload();
  };

  // delete history button handler. Deletes all history from localstorage
  const deleteHistory = () => {
    delete localStorage.history;
    HISTORY_LIST.innerHTML = "No history";
  };

  // sets new drawer amount to localStorage
  const setDrawerAmount = (e) => {
    const amt = e.target.value;
    localStorage.drawerAmount = amt;
    drawerAmount = amt;
  };

  // update handler. Saves all quantities to localstorage and gene
  const update = () => {
    updateValues();
    localStorage.qty = JSON.stringify(qty);
  };

  // submit button handler. Calculates amounts, creates and displayes the output, and saves the transaction to history.
  const submit = () => {
    calcAmts();
    genOutput();
    updateHistory();
    window.scrollBy(0, window.innerHeight);
  };

  // resets localstorage qty and reloads page. Does not reset history
  const reset = () => {
    delete localStorage.qty;
    location.reload();
  };

  // grabs history and then populates the slideover with that history
  const populateHistory = () => {
    if (!history.length) {
      return;
    }
    let html = "";
    history.forEach((el, i) => {
      html =
        `<li class="list-group-item" role="button" data-index="${i}">
      <span class="dot" style="background:${el.color}"> </span> ${el.time}</li>` + html;
    });
    HISTORY_LIST.innerHTML = html;
  };

  // adds all listeners
  document.getElementById("reset").addEventListener("click", reset);
  document.getElementById("drawer-amount").addEventListener("input", setDrawerAmount);
  document.getElementById("inputs").addEventListener("input", update);
  document.getElementById("submit").addEventListener("click", submit);
  document.getElementById("history-btn").addEventListener("click", populateHistory);
  const HISTORY_LIST = document.getElementById("history-list");
  HISTORY_LIST.addEventListener("click", useHistory);
  document.getElementById("delete-history").addEventListener("click", deleteHistory);

  // application start
  populateInputs();
})();
