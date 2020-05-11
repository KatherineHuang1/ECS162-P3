// This code runs as soon as the page is loaded, when
// the script tag in the HTML file is executed.

//get the url /getPostcard?id=ramdomstring
function encodeUrl() {
  let url = "getPostcard" + window.location.search;
  console.log("Encoded Url: " + url);
  return url;
}

// It sends a GET request for url
let url = encodeUrl();
let xhr = new XMLHttpRequest();
xhr.open("GET", url);
console.log("send get url:", url, "to server");
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

// set up callback function that will run when the HTTP response comes back
xhr.onloadend = function (e) {
  console.log("display get's response", xhr.responseText);

  // responseText is a string
  let data = JSON.parse(xhr.responseText);
  console.log(data[0]);

  // get the postcard data out of the object "data" and
  // configure the postcard
  let postcardImage = document.getElementById("cardImg");
  postcardImage.style.display = "block";
  if (typeof data[0].image !== "undefined") {
    postcardImage.src = data[0].image;
  }
  let postcardMessage = document.getElementById("message");
  postcardMessage.innerText = data[0].message;
  postcardMessage.className = data[0].font;
  document.querySelector(".postcard").style.backgroundColor = data[0].color;
};

// send off request
xhr.send(null);
