const storeApp = {};
const cart = [];
storeApp.subTotal = 0;
storeApp.hst = 0.13;
storeApp.totalWithTaxes = 0;
$(function () {
  storeApp.init();
});

storeApp.init = () => {
  storeApp.GetProducts();
  $("#checkoutBtn").prop("disabled", true);
  storeApp.$cartTable = $("#cartTable");
};
storeApp.GetProducts = () => {
  const data = {
    action: "getAll",
  };
  $.ajax({
    //url: `https://infinite-refuge-23522.herokuapp.com/https://junostore.codequark.com/api/v1/requests/ProductAction.php`,
    url: `/api/v1/requests/ProductAction.php`,
    method: "POST",
    dataType: "json",
    crossDomain: true,
    data: data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((r) => {
    const products = r.response.products;
    $("#feed").empty();
    let salebadge = "";
    let saleSpan = "";
    products.forEach((product, index) => {
      if (product.sale) {
        salebadge = `<div class="badge bg-dark text-white position-absolute" style="top: 0.5rem; right: 0.5rem">
                        Sale
                    </div>`;
        saleSpan = `<span class="text-muted text-decoration-line-through">$${product.oldPrice}</span>`;
      } else {
        salebadge = "";
        saleSpan = "";
      }
      const rateStars = storeApp.rateStar(product.rate);
      $("#feed").append(`
        <div class="col mb-5">
            <div class="card h-100">
                <!-- Sale badge-->
                ${salebadge}
                <!-- Product image-->
                <img class="card-img-top" src="${product.imageURL}" alt="${product.productName}"/>
                <!-- Product details-->
                <div class="card-body p-4 border-top-0 ">
                    <div class="text-center">
                        <!-- Product name-->
                        <h5 class="fw-bolder">${product.productName}</h5>
                        <!-- Product reviews-->
                        <div class="d-flex justify-content-center small text-warning mb-2">
                            ${rateStars}
                        </div>
                        <!-- Product price-->
                        ${saleSpan}
                        $${product.productPrice}
                    </div>
                </div>
                <!-- Product actions-->
                <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                    <div class="text-center">
                    <button class="btn btn-outline-dark mt-auto" id="btn_${product.productId}">Add to cart</button>
                    </div>
                </div>
            </div>
        </div>
        `);
      $(`#btn_${product.productId}`).click(function () {
        storeApp.sizeSelector(product);
      });
    });
  });
};

storeApp.rateStar = (rate) => {
  let stars = "";
  for (let i = 0; i < rate; i++) {
    stars += `<div class="bi-star-fill"></div>`;
  }
  return stars;
};
storeApp.sizeSelector = (product) => {
  const data = {
    action: "getAll",
    productId: product.productId,
  };
  $.ajax({
    //url: `https://infinite-refuge-23522.herokuapp.com/https://junostore.codequark.com/api/v1/requests/SizeAction.php`,
    url: `/api/v1/requests/SizeAction.php`,
    method: "POST",
    dataType: "json",
    //crossDomain: true,
    data: data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((r) => {
    const sizes = r.response.sizes;
    $("#sizeModal").modal("show");
    $("#imgSizeSelector").attr("src", product.imageURL);
    $("#sizeProductName").text(product.productName);
    storeApp.currentProduct = product;
    $("#sizeSelectorFeed").text("");
    sizes.forEach((size, index) => {
      $("#sizeSelectorFeed")
        .append(`<input type="radio" class="btn-check m-1" required name="sizeOptions" id="sizeOption_${index}" value="${size.sizeText}" autocomplete="off">
                <label class="btn btn-outline-dark m-1" for="sizeOption_${index}">${size.sizeText}</label>`);
    });
  });
};
/// creating a new object without reference
function product(
  active,
  familyId,
  imageURL,
  productId,
  productName,
  productPrice,
  quantity,
  quantityPrice,
  size
) {
  this.active = active;
  this.familyId = familyId;
  this.imageURL = imageURL;
  this.productId = productId;
  this.productName = productName;
  this.productPrice = productPrice;
  this.quantity = quantity;
  this.quantityPrice = quantityPrice;
  this.size = size;
}

$("#sizeSelectorForm").submit(function (event) {
  const sizeSelection = $(`input[name='sizeOptions']:checked`).val();
  storeApp.currentProduct.size = sizeSelection;
  storeApp.currentProduct.quantity = 1;
  storeApp.currentProduct.quantityPrice = storeApp.currentProduct.productPrice;
  const newProduct = new product(
    storeApp.currentProduct.active,
    storeApp.currentProduct.familyId,
    storeApp.currentProduct.imageURL,
    storeApp.currentProduct.productId,
    storeApp.currentProduct.productName,
    storeApp.currentProduct.productPrice,
    storeApp.currentProduct.quantity,
    storeApp.currentProduct.quantityPrice,
    storeApp.currentProduct.size
  );
  storeApp.addCart(newProduct);
  $("#sizeModal").modal("hide");
  event.preventDefault();
});

storeApp.addCart = (newProduct) => {
  //storeApp.currentProduct = {};
  const repetedItem = cart.filter(function (cartItem) {
    return (
      cartItem.productId === newProduct.productId &&
      cartItem.size === newProduct.size
    );
  });
  if (repetedItem.length > 0) {
    alert("The same product and size is already in the cart");
  } else {
    cart.push(newProduct);
    $("#checkoutBtn").prop("disabled", false);
    $("#cartSpan").text(cart.length);
    $("#cartBtn").removeClass("btn-outline-dark").addClass("btn-warning");
    /////////// stripe functions
    initialize();
    checkStatus();
    ///////////////
    window.scrollTo(0, 0);
  }
};
$("#cartForm").submit(function (event) {
  $("#cartModal").modal("show");
  storeApp.cartTable();
  event.preventDefault();
});

storeApp.cartTable = () => {
  if (cart.length < 1) {
    storeApp.$cartTable.html(
      `<tr><th scope="row" class="text-muted text-center" colspan="5">No items in the cart</th></tr>`
    );
  } else {
    storeApp.$cartTable.text("");
    storeApp.subTotal = 0;
    cart.forEach((product, index) => {
      storeApp.$cartTable.append(`<tr>
        <th scope="row"><img src="${product.imageURL}" class="img-fluid" alt="${product.productName}"></th>
        <td>${product.productName} Size: ${product.size}</td>
        <td><input class="form-control" id="inpQty_${index}" type="number" min="1" value="${product.quantity}"></td>
        <td>$${product.productPrice}</td>
        <td><button id='deleteBtn_${index}' class="btn btn-sm btn-danger">Delete</button></td>
        </tr>`);
      $(`#deleteBtn_${index}`).click(function () {
        storeApp.deleteCart(index);
      });
      $(`#inpQty_${index}`).change(function () {
        storeApp.updateCart(index);
      });
      storeApp.subTotal += product.productPrice;
    });
    storeApp.calculator(storeApp.subTotal);
  }
};
storeApp.deleteCart = (index) => {
  cart.splice(index, 1);
  storeApp.$cartTable.text(cart.length);
  if (cart.length === 0) {
    $("#cartBtn").removeClass("btn-warning").addClass("btn-outline-dark");
    $("#checkoutBtn").prop("disabled", true);
  }
  alert("Item deleted");
  storeApp.cartTable();
};
storeApp.updateCart = (index) => {
  const newQty = $(`#inpQty_${index}`).val();
  cart[index].quantity = newQty;
  cart[index].productPrice = parseInt(newQty) * cart[index].quantityPrice;
  storeApp.cartTable();
};

storeApp.calculator = (subTotal) => {
  let taxes = subTotal * storeApp.hst;
  storeApp.totalWithTaxes = subTotal + taxes;
  storeApp.$cartTable.append(`<tr>
        <th scope="row"></th>
        <td></td>
        <td>Subtotal: </td>
        <td>$${subTotal}</td>
        <td></td>
        </tr>`);
  storeApp.$cartTable.append(`<tr>
        <th scope="row"></th>
        <td></td>
        <td>Estimated GST/HST: </td>
        <td>$${taxes}</td>
        <td></td>
        </tr>`);
  storeApp.$cartTable.append(`<tr>
        <th scope="row"></th>
        <td></td>
        <td>Total: </td>
        <td>$${storeApp.totalWithTaxes}</td>
        <td></td>
        </tr>`);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///Important : To test The payment section please refer to the card provided in the Stripe documentation https://stripe.com/docs/testing#cards
/////

const stripe = Stripe(
  "pk_test_51KuYPKFbavtbTuitmV9HKd250Kzks38KxWD1DAwWMzGBdYS7h4HCmDicElClIAX4BXViGs5O64DnUJaJUMiSEHj2007isKrVyN"
);

// The items the customer wants to buy

let elements;

document
  .querySelector("#payment-form")
  .addEventListener("submit", handleSubmit);

// Fetches a payment intent and captures the client secret
async function initialize() {
  storeApp.StripeItems = [
    { name: "Shoes", unit_amount: storeApp.totalWithTaxes },
  ];
  const items = storeApp.StripeItems;

  //"https://infinite-refuge-23522.herokuapp.com/https://junostore.codequark.com/create.php",
  const { clientSecret } = await fetch("/create.php", {
    method: "POST",
    crossDomain: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }).then((r) => r.json());

  elements = stripe.elements({ clientSecret });

  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // Make sure to change this to your payment completion page
      return_url: "http://localhost/success.html",
    },
  });

  // This point will only be reached if there is an immediate error when
  // confirming the payment. Otherwise, your customer will be redirected to
  // your `return_url`. For some payment methods like iDEAL, your customer will
  // be redirected to an intermediate site first to authorize the payment, then
  // redirected to the `return_url`.
  if (error.type === "card_error" || error.type === "validation_error") {
    showMessage(error.message);
  } else {
    showMessage("An unexpected error occured.");
  }

  setLoading(false);
}

// Fetches the payment intent status after payment submission
async function checkStatus() {
  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );

  if (!clientSecret) {
    return;
  }

  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

  switch (paymentIntent.status) {
    case "succeeded":
      showMessage("Payment succeeded!");
      break;
    case "processing":
      showMessage("Your payment is processing.");
      break;
    case "requires_payment_method":
      showMessage("Your payment was not successful, please try again.");
      break;
    default:
      showMessage("Something went wrong.");
      break;
  }
}

// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageText.textContent = "";
  }, 4000);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}
