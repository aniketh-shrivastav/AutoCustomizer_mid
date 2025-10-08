
    document.addEventListener("DOMContentLoaded", function () {
        let urlParams = new URLSearchParams(window.location.search);
        let product = urlParams.get("product");

        if (product) {
            document.getElementById("product").value = product;
        }

        document.getElementById("review-form").addEventListener("submit", function (event) {
            event.preventDefault();
            let product = document.getElementById("product").value;
            let rating = document.getElementById("rating").value;
            let review = document.getElementById("review").value;

            let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
            reviews.push({ product, rating, review });
            localStorage.setItem("reviews", JSON.stringify(reviews));

            alert("Review submitted!");
            window.location.href = "history.html";
        });

        function loadReviews() {
            let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
            let reviewList = document.getElementById("reviews-list");
            reviewList.innerHTML = "";
            reviews.forEach(r => {
                let li = document.createElement("li");
                li.innerHTML = `<strong>${r.product}:</strong> ${r.rating}⭐ - "${r.review}"`;
                reviewList.appendChild(li);
            });
        }

        loadReviews();
    })
