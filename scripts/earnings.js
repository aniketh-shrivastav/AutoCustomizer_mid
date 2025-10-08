// Chart.js 
const ctx = document.getElementById('earningsChart').getContext('2d');
let earningsChart;


function getMonthName(monthIndex) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
}


const monthlyEarnings = [1200, 1500, 1800, 2000, 2200, 2500, 3000, 2800, 3200, 3500, 4000, 4200]; 


function generateEarningsData(timeRange) {
    const currentDate = new Date();
    const labels = [];
    const data = [];
    let totalEarnings = 0;

    if (timeRange === 1) {
       
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const monthName = getMonthName(currentDate.getMonth());

        
        let baseEarnings = monthlyEarnings[currentDate.getMonth()] / 4; 
        for (let weekStart = 1; weekStart <= daysInMonth; weekStart += 7) {
            const weekEnd = Math.min(weekStart + 6, daysInMonth); 
            labels.push(`${monthName} ${weekStart}-${weekEnd}`); 

           
            if (weekStart <= 7) {
                baseEarnings += Math.floor(Math.random() * 200); 
            } else if (weekStart <= 14) {
                baseEarnings -= Math.floor(Math.random() * 100);
            } else if (weekStart <= 21) {
                baseEarnings += Math.floor(Math.random() * 150); 
            } else {
                baseEarnings += Math.floor(Math.random() * 100); 
            }
            totalEarnings += baseEarnings;
            data.push(baseEarnings); 
        }
    } else {
       //6months/1year
        for (let i = 0; i < timeRange; i++) {
            const date = new Date(currentDate);
            date.setMonth(currentDate.getMonth() - i); // Go back 'i' months from the current date
            const monthName = getMonthName(date.getMonth());
            labels.unshift(monthName); //start

           
            const monthlyEarning = monthlyEarnings[date.getMonth()];
            totalEarnings += monthlyEarning;
            data.unshift(monthlyEarning); 
        }
    }

    
    document.getElementById('totalEarnings').textContent = `Total Earnings: ₹${totalEarnings.toLocaleString()}`;

    return { labels, data };
}


function updateChart() {
    const timeRange = parseInt(document.getElementById('timeRange').value);
    const { labels, data } = generateEarningsData(timeRange);

    
    earningsChart.data.labels = labels;
    earningsChart.data.datasets[0].data = data;
    earningsChart.update();
}


function initializeChart() {
    const { labels, data } = generateEarningsData(1); // Show last month by default

    earningsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Earnings (₹)',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
                tension: 0.4, // Smooth curve
                pointRadius: 5, // Make data points visible
                pointBackgroundColor: '#007bff', // Color of data points
                borderWidth: 2 // Thicker line
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e0e0e0'
                    },
                    title: {
                        display: true,
                        text: 'Earnings (₹)'
                    }
                },
                x: {
                    grid: {
                        color: '#e0e0e0'
                    },
                    title: {
                        display: true,
                        text: timeRange === 1 ? 'Weeks' : 'months' 
                    }
                }
            }
        }
    });
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}


document.querySelectorAll('.payout-history tbody tr').forEach((row, index) => {
    row.addEventListener('click', () => {
        // Remove any previously selected row's highlight
        document.querySelectorAll('.payout-history tbody tr').forEach((r) => {
            r.classList.remove('selected-row');
        });

       
        row.classList.add('selected-row');

        
    });
});



function calculateTodaysEarnings() {
   
    const todaysEarnings = Math.floor(Math.random() * 2000) + 500; 
    return todaysEarnings;
}


function updateTodaysEarnings() {
    const todaysEarnings = calculateTodaysEarnings();
    document.getElementById('todaysEarnings').textContent = `₹${todaysEarnings.toLocaleString()}`;
}


window.onload = function () {
    initializeChart();
    updateTodaysEarnings(); 
};


function viewDetails(date, amount, status, orderId, customerId, serviceProvided) {
    alert(
        `Payout Details:
        \nDate: ${date}
        \nAmount: ${amount}
        \nStatus: ${status}
        \nOrder ID: ${orderId}
        \nCustomer ID: ${customerId}
        \nService Provided: ${serviceProvided}`
    );
}

